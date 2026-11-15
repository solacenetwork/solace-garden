import { startupDiagnostics } from './startupDiagnostics.js';
import {
	CONTROL_STORE_NAME,
	MAIN_CONFIG_ID,
} from './constants.js';
import {
	controlDatabaseExists,
	createControlDatabase,
	isInitialConfiguration,
	markInitializationComplete,
	validateConfiguration,
	validateControlSchema,
} from './controlDatabase.js';
import {
	discoverDatabaseNames,
	findGardenDatabaseNames,
	openGardenDatabase,
} from './gardenDatabase.js';
import { createGardensRepository } from './gardensRepository.js';
import { createNotesRepository } from './notesRepository.js';
import { createDraftsRepository } from './draftsRepository.js';
import { createListItemsRepository } from './listItemsRepository.js';
import { createLocationsRepository } from './locationsRepository.js';
import { createGardenTypesRepository, seedGardenTypes } from './gardenTypesRepository.js';
import { createGardenTemplatesRepository } from './gardenTemplatesRepository.js';
import { createLocationsService } from '../../services/locations.js';

const RECOVERY_DETAILS = {
	CONTROL_OPEN_FAILED: {
		message: 'The local storage configuration could not be opened.',
		action: 'Retry. If this continues, preserve this browser profile before seeking help.',
	},
	CONTROL_DATABASE_CHECK_FAILED: {
		message: 'The local storage configuration could not be checked safely.',
		action: 'Retry. If this continues, preserve this browser profile before seeking help.',
	},
	CONTROL_DATABASE_MISSING: {
		message: 'The local storage configuration is missing, but existing Garden data was found.',
		action: 'Do not clear site data. Preserve this browser profile and seek recovery help.',
	},
	DATABASE_DISCOVERY_UNAVAILABLE: {
		message: 'This browser could not safely check for existing Garden data.',
		action: 'Retry. If this continues, preserve this browser profile and seek recovery help.',
	},
	CONFIGURATION_INVALID: {
		message: 'The saved local database configuration is missing or invalid.',
		action: 'Do not clear site data. Preserve this browser profile and seek recovery help.',
	},
	GARDEN_DATABASE_MISSING: {
		message: 'The saved Garden database could not be found.',
		action: 'Do not clear site data. Preserve this browser profile and seek recovery help.',
	},
	GARDEN_OPEN_FAILED: {
		message: 'The saved Garden database could not be opened safely.',
		action: 'Retry. If this continues, preserve this browser profile before seeking help.',
	},
	INITIALIZATION_INCOMPLETE: {
		message: 'Initial local storage setup was interrupted or could not finish.',
		action: 'Retry to continue setting up the same local database.',
	},
	LOCATION_INITIALIZATION_FAILED: {
		message: 'The required built-in Location could not be prepared safely.',
		action: 'Retry. Existing Garden data has not been replaced or deleted.',
	},
	GARDEN_TYPE_INITIALIZATION_FAILED: {
		message: 'The built-in Garden Type catalog could not be prepared safely.',
		action: 'Retry. Existing Garden data has not been replaced or deleted.',
	},
};

function recoveryRequired(code, stage, cause) {
	return {
		status: 'recovery-required',
		error: {
			code,
			title: 'Garden storage needs attention',
			...RECOVERY_DETAILS[code],
			diagnostics: startupDiagnostics(code, stage, cause),
		},
	};
}

export async function initializeDexieStorage({
	dependencies,
	randomUUID,
	now,
	openGarden = openGardenDatabase,
} = {}) {
	let controlDatabase;
	let gardenDatabase;
	let hasControlDatabase;
	let locationsRepository;
	let gardenTypesRepository;
	let initializationStage = 'control-existence';
	const recover = (code, cause) => recoveryRequired(code, initializationStage, cause);

	try {
		hasControlDatabase = await controlDatabaseExists(dependencies);
	} catch (error) {
		return recover('CONTROL_DATABASE_CHECK_FAILED', error);
	}

	if (!hasControlDatabase) {
		let databaseNames;

		try {
			initializationStage = 'database-enumeration';
			databaseNames = await discoverDatabaseNames(dependencies);
		} catch (error) {
			return recover('DATABASE_DISCOVERY_UNAVAILABLE', error);
		}

		if (findGardenDatabaseNames(databaseNames).length > 0) {
			return recover('CONTROL_DATABASE_MISSING');
		}
	}

	try {
		initializationStage = 'control-create';
		controlDatabase = createControlDatabase({
			dependencies,
			randomUUID,
			onStage: (stage) => { initializationStage = stage; },
		});
		initializationStage = 'control-open';
		await controlDatabase.open();
		initializationStage = 'control-schema';
		if (!validateControlSchema(controlDatabase)) {
			controlDatabase.close();
			return recover('CONFIGURATION_INVALID');
		}
	} catch (error) {
		controlDatabase?.close();
		return recover('CONTROL_OPEN_FAILED', error);
	}

	let configuration;
	try {
		initializationStage = 'configuration-read';
		configuration = await controlDatabase.table(CONTROL_STORE_NAME).get(MAIN_CONFIG_ID);
	} catch (error) {
		controlDatabase.close();
		return recover('CONFIGURATION_INVALID', error);
	}
	initializationStage = 'configuration-validation';

	if (!validateConfiguration(configuration)) {
		controlDatabase.close();
		return recover('CONFIGURATION_INVALID');
	}

	const initializationInProgress = isInitialConfiguration(configuration);

	try {
		initializationStage = 'garden-open';
		gardenDatabase = await openGarden(configuration.activeDatabase, {
			allowCreate: initializationInProgress,
			dependencies,
		});
		initializationStage = 'locations';
		locationsRepository = createLocationsRepository(gardenDatabase, { randomUUID });
		await createLocationsService(locationsRepository, { now }).ensureDefault();
		initializationStage = 'garden-types';
		await seedGardenTypes(gardenDatabase);
		gardenTypesRepository = createGardenTypesRepository(gardenDatabase);

		if (initializationInProgress) {
			initializationStage = 'configuration-finalize';
			await markInitializationComplete(controlDatabase);
		}
	} catch (error) {
		gardenDatabase?.close();
		controlDatabase.close();

		if (initializationInProgress) {
			return recover('INITIALIZATION_INCOMPLETE', error);
		}

		return recover(error?.code === 'GARDEN_DATABASE_MISSING'
			? 'GARDEN_DATABASE_MISSING'
			: initializationStage === 'garden-types'
				? 'GARDEN_TYPE_INITIALIZATION_FAILED'
				: gardenDatabase
					? 'LOCATION_INITIALIZATION_FAILED'
					: 'GARDEN_OPEN_FAILED', error);
	}

	controlDatabase.close();
	const repositories = Object.freeze({
		gardens: createGardensRepository(gardenDatabase, { randomUUID }),
		notes: createNotesRepository(gardenDatabase, { randomUUID }),
		drafts: createDraftsRepository(gardenDatabase),
		listItems: createListItemsRepository(gardenDatabase, { randomUUID }),
		locations: locationsRepository,
		gardenTypes: gardenTypesRepository,
		gardenTemplates: createGardenTemplatesRepository(gardenDatabase, { randomUUID }),
	});

	return {
		status: 'ready',
		databaseName: configuration.activeDatabase,
		repositories,
		close() {
			gardenDatabase.close();
		},
	};
}

