import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	CONTROL_DATABASE_NAME,
	CONTROL_STORE_NAME,
	GARDEN_INDEXES,
	GARDEN_STORES,
	MAIN_CONFIG_ID,
} from './constants.js';
import { createControlDatabase } from './controlDatabase.js';
import { createGardenDatabase } from './gardenDatabase.js';
import { initializeDexieStorage } from './initializeDexieStorage.js';

const UUID_ONE = '550e8400-e29b-41d4-a716-446655440000';
const UUID_TWO = '2c1f8f28-9624-4d40-8c5f-4d7bb793d641';

describe('Dexie storage initialization', () => {
	let indexedDB;
	let dependencies;
	let createdDatabases;

	beforeEach(() => {
		indexedDB = new IDBFactory();
		dependencies = { indexedDB, IDBKeyRange };
		createdDatabases = new Set([CONTROL_DATABASE_NAME]);
	});

	afterEach(async () => {
		await Promise.all(
			Array.from(createdDatabases, (databaseName) =>
				new Dexie(databaseName, dependencies).delete(),
			),
		);
	});

	async function initialize(options = {}) {
		const result = await initializeDexieStorage({
			dependencies,
			randomUUID: () => UUID_ONE,
			...options,
		});

		if (result.databaseName) {
			createdDatabases.add(result.databaseName);
		}

		return result;
	}

	async function readConfiguration() {
		const controlDatabase = createControlDatabase({
			dependencies,
			randomUUID: () => UUID_TWO,
		});
		await controlDatabase.open();
		const configuration = await controlDatabase
			.table(CONTROL_STORE_NAME)
			.get(MAIN_CONFIG_ID);
		controlDatabase.close();
		return configuration;
	}

	it('initializes a fresh control database and UUID-named Garden database', async () => {
		const result = await initialize();
		const configuration = await readConfiguration();

		expect(result.status).toBe('ready');
		expect(result.databaseName).toBe(`solace-garden-data-${UUID_ONE}`);
		expect(configuration).toEqual({
			id: 'main',
			configVersion: 1,
			activeDatabase: result.databaseName,
			previousDatabase: null,
			recoveryState: null,
		});

		result.close();
	});

	it('requires recovery when Garden data exists without the control database', async () => {
		const databaseName = `solace-garden-data-${UUID_TWO}`;
		createdDatabases.add(databaseName);
		const existingDatabase = createGardenDatabase(databaseName, dependencies);
		await existingDatabase.open();
		await existingDatabase.table('notes').add({
			id: 'existing-note',
			text: 'Keep this record',
			gardenId: null,
			updatedAt: '2026-11-05T12:00:00.000Z',
		});
		existingDatabase.close();

		const randomUUID = vi.fn(() => UUID_ONE);
		const result = await initialize({ randomUUID });

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'CONTROL_DATABASE_MISSING' },
		});
		expect(randomUUID).not.toHaveBeenCalled();
		expect((await indexedDB.databases()).map(({ name }) => name)).toEqual([
			databaseName,
		]);

		const reopenedDatabase = createGardenDatabase(databaseName, dependencies);
		await reopenedDatabase.open();
		expect(await reopenedDatabase.table('notes').get('existing-note')).toMatchObject({
			text: 'Keep this record',
		});
		reopenedDatabase.close();
	});

	it('fails safely when database enumeration is unavailable', async () => {
		const randomUUID = vi.fn(() => UUID_ONE);
		const result = await initializeDexieStorage({
			dependencies: { indexedDB: {}, IDBKeyRange },
			randomUUID,
		});

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'DATABASE_DISCOVERY_UNAVAILABLE' },
		});
		expect(randomUUID).not.toHaveBeenCalled();
		expect(await indexedDB.databases()).toEqual([]);
	});

	it('fails safely when database enumeration throws', async () => {
		const databaseName = `solace-garden-data-${UUID_TWO}`;
		createdDatabases.add(databaseName);
		const existingDatabase = createGardenDatabase(databaseName, dependencies);
		await existingDatabase.open();
		await existingDatabase.table('notes').add({
			id: 'preserved-note',
			text: 'Still here after discovery failure',
			gardenId: null,
			updatedAt: '2026-11-05T12:00:00.000Z',
		});
		existingDatabase.close();

		const randomUUID = vi.fn(() => UUID_ONE);
		const discovery = vi
			.spyOn(indexedDB, 'databases')
			.mockRejectedValueOnce(new Error('simulated discovery failure'));
		const result = await initialize({ randomUUID });
		discovery.mockRestore();

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'DATABASE_DISCOVERY_UNAVAILABLE' },
		});
		expect(randomUUID).not.toHaveBeenCalled();
		expect((await indexedDB.databases()).map(({ name }) => name)).toEqual([
			databaseName,
		]);

		const reopenedDatabase = createGardenDatabase(databaseName, dependencies);
		await reopenedDatabase.open();
		expect(await reopenedDatabase.table('notes').get('preserved-note')).toMatchObject({
			text: 'Still here after discovery failure',
		});
		reopenedDatabase.close();
	});

	it('creates exactly the six agreed Garden stores', async () => {
		const result = await initialize();
		const database = createGardenDatabase(result.databaseName, dependencies);
		await database.open();

		expect(database.tables.map(({ name }) => name).sort()).toEqual(
			Object.keys(GARDEN_STORES).sort(),
		);
		for (const table of database.tables) {
			expect(
				table.schema.indexes.map(({ name }) => name).sort(),
			).toEqual(Object.keys(GARDEN_INDEXES[table.name]).sort());
		}

		database.close();
		result.close();
	});

	it('reuses the active pointer without generating another name', async () => {
		const first = await initialize();
		first.close();

		const randomUUID = vi.fn(() => UUID_TWO);
		const second = await initializeDexieStorage({ dependencies, randomUUID });

		expect(second.status).toBe('ready');
		expect(second.databaseName).toBe(first.databaseName);
		expect(randomUUID).not.toHaveBeenCalled();

		second.close();
	});

	it('persists records after closing and reopening database connections', async () => {
		const result = await initialize();
		result.close();

		const firstConnection = createGardenDatabase(result.databaseName, dependencies);
		await firstConnection.open();
		await firstConnection.table('notes').add({
			id: 'note-1',
			gardenId: null,
			text: 'Persistent note',
			updatedAt: '2026-11-05T12:00:00.000Z',
		});
		firstConnection.close();

		const secondConnection = createGardenDatabase(result.databaseName, dependencies);
		await secondConnection.open();

		expect(await secondConnection.table('notes').get('note-1')).toMatchObject({
			text: 'Persistent note',
		});

		secondConnection.close();
	});

	it('fails safely when the configuration is invalid', async () => {
		const initial = await initialize();
		createdDatabases.add(initial.databaseName);
		initial.close();

		const controlDatabase = createControlDatabase({ dependencies });
		await controlDatabase.open();
		await controlDatabase.table(CONTROL_STORE_NAME).put({
			id: MAIN_CONFIG_ID,
			configVersion: 1,
			activeDatabase: 'not-a-garden-database',
			previousDatabase: null,
			recoveryState: null,
		});
		controlDatabase.close();

		const result = await initialize({ randomUUID: vi.fn(() => UUID_TWO) });

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'CONFIGURATION_INVALID' },
		});
		expect(await indexedDB.databases()).toHaveLength(2);
	});

	it('does not replace a missing database referenced by valid configuration', async () => {
		const initial = await initialize();
		const databaseName = initial.databaseName;
		initial.close();
		await new Dexie(databaseName, dependencies).delete();

		const result = await initialize({ randomUUID: vi.fn(() => UUID_TWO) });

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'GARDEN_DATABASE_MISSING' },
		});
		expect((await readConfiguration()).activeDatabase).toBe(databaseName);
		expect(await indexedDB.databases()).toEqual([
			expect.objectContaining({ name: CONTROL_DATABASE_NAME }),
		]);
	});

	it('preserves the active pointer when an existing database fails to open', async () => {
		const initial = await initialize();
		const databaseName = initial.databaseName;
		initial.close();

		const result = await initialize({
			openGarden: vi.fn(async () => {
				throw new Error('simulated open failure');
			}),
		});

		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'GARDEN_OPEN_FAILED' },
		});
		expect((await readConfiguration()).activeDatabase).toBe(databaseName);
		expect(await indexedDB.databases()).toHaveLength(2);
	});

	it('retries an interrupted first initialization using the same pointer', async () => {
		const interrupted = await initialize({
			openGarden: vi.fn(async () => {
				throw new Error('simulated interruption');
			}),
		});
		const pendingConfiguration = await readConfiguration();
		createdDatabases.add(pendingConfiguration.activeDatabase);

		expect(interrupted).toMatchObject({
			status: 'recovery-required',
			error: { code: 'INITIALIZATION_INCOMPLETE' },
		});
		expect(pendingConfiguration.recoveryState).toMatchObject({
			type: 'initializing',
			databaseName: `solace-garden-data-${UUID_ONE}`,
		});

		const retried = await initialize({ randomUUID: vi.fn(() => UUID_TWO) });

		expect(retried.status).toBe('ready');
		expect(retried.databaseName).toBe(pendingConfiguration.activeDatabase);
		expect((await readConfiguration()).recoveryState).toBeNull();

		retried.close();
	});
});

