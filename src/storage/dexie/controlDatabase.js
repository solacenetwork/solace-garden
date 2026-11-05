import Dexie from 'dexie';
import {
	CONFIG_VERSION,
	CONTROL_DATABASE_NAME,
	CONTROL_DATABASE_VERSION,
	CONTROL_STORE_NAME,
	MAIN_CONFIG_ID,
} from './constants.js';
import { createGardenDatabaseName, isGardenDatabaseName } from './databaseNames.js';
import { probeDatabaseExists } from './databaseProbe.js';

const INITIALIZING_STATE = 'initializing';

function createInitialConfig(randomUUID) {
	const activeDatabase = createGardenDatabaseName(randomUUID);

	return {
		id: MAIN_CONFIG_ID,
		configVersion: CONFIG_VERSION,
		activeDatabase,
		previousDatabase: null,
		recoveryState: {
			type: INITIALIZING_STATE,
			databaseName: activeDatabase,
		},
	};
}

export function createControlDatabase({ dependencies, randomUUID } = {}) {
	const database = new Dexie(CONTROL_DATABASE_NAME, dependencies);
	database.version(CONTROL_DATABASE_VERSION).stores({
		[CONTROL_STORE_NAME]: 'id',
	});

	// Dexie's populate event runs in the database-creation transaction. Writing
	// the pointer and its initialization marker here avoids a blank control
	// database if the first startup is interrupted.
	database.on('populate', (transaction) =>
		transaction
			.table(CONTROL_STORE_NAME)
			.add(createInitialConfig(randomUUID)),
	);

	return database;
}

export function controlDatabaseExists(dependencies) {
	return probeDatabaseExists(CONTROL_DATABASE_NAME, dependencies);
}

export function isInitialConfiguration(record) {
	return (
		record?.recoveryState?.type === INITIALIZING_STATE &&
		record.recoveryState.databaseName === record.activeDatabase
	);
}

export function validateConfiguration(record) {
	if (!record || record.id !== MAIN_CONFIG_ID) {
		return false;
	}

	if (
		record.configVersion !== CONFIG_VERSION ||
		!isGardenDatabaseName(record.activeDatabase) ||
		(record.previousDatabase !== null &&
			!isGardenDatabaseName(record.previousDatabase))
	) {
		return false;
	}

	return record.recoveryState === null || isInitialConfiguration(record);
}

export function validateControlSchema(database) {
	const stores = Array.from(database.backendDB().objectStoreNames);
	return (
		database.verno === CONTROL_DATABASE_VERSION &&
		stores.length === 1 &&
		stores[0] === CONTROL_STORE_NAME
	);
}

export async function markInitializationComplete(database) {
	const updated = await database
		.table(CONTROL_STORE_NAME)
		.update(MAIN_CONFIG_ID, { recoveryState: null });

	if (updated !== 1) {
		throw new Error('The active database pointer could not be finalized.');
	}
}

