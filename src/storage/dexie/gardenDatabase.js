import Dexie from 'dexie';
import {
	GARDEN_DATABASE_PREFIX,
	GARDEN_DATABASE_VERSION,
	GARDEN_INDEXES,
	GARDEN_STORES,
	GARDEN_STORES_V1,
} from './constants.js';
import { probeDatabaseExists } from './databaseProbe.js';

export async function discoverDatabaseNames(dependencies) {
	const indexedDB = dependencies?.indexedDB ?? Dexie.dependencies.indexedDB;

	if (typeof indexedDB?.databases !== 'function') {
		const error = new Error('IndexedDB database discovery is unavailable.');
		error.code = 'DATABASE_DISCOVERY_UNAVAILABLE';
		throw error;
	}

	let databases;
	try {
		databases = await indexedDB.databases();
	} catch (cause) {
		const error = new Error('IndexedDB database discovery failed.', { cause });
		error.code = 'DATABASE_DISCOVERY_FAILED';
		throw error;
	}

	if (
		!Array.isArray(databases) ||
		databases.some((database) => typeof database?.name !== 'string')
	) {
		const error = new Error('IndexedDB database discovery returned an invalid result.');
		error.code = 'DATABASE_DISCOVERY_FAILED';
		throw error;
	}

	return databases.map(({ name }) => name);
}

export function findGardenDatabaseNames(databaseNames) {
	return databaseNames.filter((name) => name.startsWith(GARDEN_DATABASE_PREFIX));
}

export function createGardenDatabase(databaseName, dependencies) {
	const database = new Dexie(databaseName, dependencies);
	database.version(1).stores(GARDEN_STORES_V1);
	database.version(GARDEN_DATABASE_VERSION).stores(GARDEN_STORES);
	return database;
}

export async function databaseExists(databaseName, dependencies) {
	return probeDatabaseExists(databaseName, dependencies);
}

export function validateGardenSchema(database) {
	const nativeDatabase = database.backendDB();
	const actualStores = Array.from(nativeDatabase.objectStoreNames).sort();
	const expectedStores = Object.keys(GARDEN_STORES).sort();

	if (!(
		database.verno === GARDEN_DATABASE_VERSION &&
		actualStores.length === expectedStores.length &&
		actualStores.every((storeName, index) => storeName === expectedStores[index])
	)) {
		return false;
	}

	const transaction = nativeDatabase.transaction(expectedStores, 'readonly');

	return expectedStores.every((storeName) => {
		const store = transaction.objectStore(storeName);
		const expectedIndexes = GARDEN_INDEXES[storeName];
		const actualIndexNames = Array.from(store.indexNames).sort();
		const expectedIndexNames = Object.keys(expectedIndexes).sort();

		return (
			store.keyPath === 'id' &&
			actualIndexNames.length === expectedIndexNames.length &&
			actualIndexNames.every((indexName, index) =>
				indexName === expectedIndexNames[index] &&
				indexMatches(store.index(indexName), expectedIndexes[indexName]),
			)
		);
	});
}

function indexMatches(index, expected) {
	const actualKeyPath = Array.isArray(index.keyPath)
		? Array.from(index.keyPath)
		: index.keyPath;

	return (
		JSON.stringify(actualKeyPath) === JSON.stringify(expected.keyPath) &&
		index.multiEntry === expected.multiEntry &&
		index.unique === false
	);
}

export async function openGardenDatabase(
	databaseName,
	{ allowCreate = false, dependencies } = {},
) {
	if (!allowCreate && !(await databaseExists(databaseName, dependencies))) {
		const error = new Error('The configured Garden database does not exist.');
		error.code = 'GARDEN_DATABASE_MISSING';
		throw error;
	}

	const database = createGardenDatabase(databaseName, dependencies);

	try {
		await database.open();
		if (!validateGardenSchema(database)) {
			const error = new Error(
				'The configured Garden database has an unexpected schema.',
			);
			error.code = 'GARDEN_SCHEMA_INVALID';
			throw error;
		}

		return database;
	} catch (error) {
		database.close();
		throw error;
	}
}

