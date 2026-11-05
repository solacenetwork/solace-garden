import {
	CONTROL_DATABASE_NAME,
	CONTROL_STORE_NAME,
	MAIN_CONFIG_ID,
} from './constants.js';
import {
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

const RECOVERY_DETAILS = {
	CONTROL_OPEN_FAILED: {
		message: 'The local storage configuration could not be opened.',
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
};

function recoveryRequired(code) {
	return {
		status: 'recovery-required',
		error: {
			code,
			title: 'Garden storage needs attention',
			...RECOVERY_DETAILS[code],
		},
	};
}

export async function initializeDexieStorage({
	dependencies,
	randomUUID,
	openGarden = openGardenDatabase,
} = {}) {
	let controlDatabase;
	let gardenDatabase;
	let databaseNames;

	try {
		databaseNames = await discoverDatabaseNames(dependencies);
	} catch {
		return recoveryRequired('DATABASE_DISCOVERY_UNAVAILABLE');
	}

	if (!databaseNames.includes(CONTROL_DATABASE_NAME)) {
		if (findGardenDatabaseNames(databaseNames).length > 0) {
			return recoveryRequired('CONTROL_DATABASE_MISSING');
		}
	}

	try {
		controlDatabase = createControlDatabase({ dependencies, randomUUID });
		await controlDatabase.open();
		if (!validateControlSchema(controlDatabase)) {
			controlDatabase.close();
			return recoveryRequired('CONFIGURATION_INVALID');
		}
	} catch {
		controlDatabase?.close();
		return recoveryRequired('CONTROL_OPEN_FAILED');
	}

	const configuration = await controlDatabase
		.table(CONTROL_STORE_NAME)
		.get(MAIN_CONFIG_ID)
		.catch(() => undefined);

	if (!validateConfiguration(configuration)) {
		controlDatabase.close();
		return recoveryRequired('CONFIGURATION_INVALID');
	}

	const initializationInProgress = isInitialConfiguration(configuration);

	try {
		gardenDatabase = await openGarden(configuration.activeDatabase, {
			allowCreate: initializationInProgress,
			dependencies,
		});

		if (initializationInProgress) {
			await markInitializationComplete(controlDatabase);
		}
	} catch (error) {
		gardenDatabase?.close();
		controlDatabase.close();

		if (initializationInProgress) {
			return recoveryRequired('INITIALIZATION_INCOMPLETE');
		}

		return recoveryRequired(
			error?.code === 'GARDEN_DATABASE_MISSING'
				? 'GARDEN_DATABASE_MISSING'
				: 'GARDEN_OPEN_FAILED',
		);
	}

	controlDatabase.close();

	return {
		status: 'ready',
		databaseName: configuration.activeDatabase,
		close() {
			gardenDatabase.close();
		},
	};
}

