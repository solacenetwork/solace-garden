import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocationsService, DEFAULT_LOCATION_ID } from './locations.js';
import { CONTROL_DATABASE_NAME } from '../storage/dexie/constants.js';
import { createGardenDatabase, openGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { StorageError, ValidationError } from '../storage/index.js';

const DATABASE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const LOCATION_ONE = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const LOCATION_TWO = '3d18c8af-06ea-4b7d-8bd8-c450f3e2bd4d';
const GARDEN_UUID = '210b8b0f-030c-4220-9374-8b78f461b474';
const CREATED_AT = '2026-11-06T18:00:00.000Z';
const UPDATED_AT = '2026-11-06T19:00:00.000Z';

describe('Geographic Locations', () => {
	let indexedDB;
	let dependencies;
	let createdDatabases;

	beforeEach(() => {
		indexedDB = new IDBFactory();
		dependencies = { indexedDB, IDBKeyRange };
		createdDatabases = new Set([CONTROL_DATABASE_NAME]);
	});

	afterEach(async () => {
		await Promise.all(Array.from(createdDatabases, (databaseName) =>
			new Dexie(databaseName, dependencies).delete(),
		));
	});

	async function initialize(ids = [], options = {}) {
		const uuids = [DATABASE_UUID, ...ids];
		const storage = await initializeDexieStorage({
			dependencies,
			randomUUID: vi.fn(() => uuids.shift()),
			now: () => CREATED_AT,
			...options,
		});
		if (storage.databaseName) createdDatabases.add(storage.databaseName);
		return storage;
	}

	function service(storage, times = [CREATED_AT]) {
		const timestamps = [...times];
		return createLocationsService(storage.repositories.locations, {
			now: () => timestamps.shift() ?? UPDATED_AT,
		});
	}

	it('seeds exactly one stable Default Location on fresh and repeated initialization', async () => {
		const first = await initialize();
		expect(first.status).toBe('ready');
		expect(await first.repositories.locations.list()).toEqual([
			expect.objectContaining({
				id: DEFAULT_LOCATION_ID,
				name: 'Default',
				hardinessZone: null,
				isSystemDefault: true,
			}),
		]);
		const databaseName = first.databaseName;
		first.close();

		const second = await initializeDexieStorage({ dependencies });
		expect(second.databaseName).toBe(databaseName);
		expect(await second.repositories.locations.list()).toHaveLength(1);
		second.close();
	});

	it('preserves an edited Default name and zone across initialization and restart', async () => {
		const first = await initialize();
		const locations = service(first, [UPDATED_AT]);
		expect(await locations.update(DEFAULT_LOCATION_ID, {
			name: '  Home Farm  ',
			hardinessZone: '7B',
		})).toBe(true);
		first.close();

		const reopened = await initializeDexieStorage({ dependencies });
		expect(await reopened.repositories.locations.getById(DEFAULT_LOCATION_ID)).toMatchObject({
			name: 'Home Farm',
			hardinessZone: '7b',
			isSystemDefault: true,
			createdAt: CREATED_AT,
			updatedAt: UPDATED_AT,
		});
		expect(await reopened.repositories.locations.list()).toHaveLength(1);
		reopened.close();
	});

	it('creates, retrieves, edits, and deletes a custom Location', async () => {
		const storage = await initialize([LOCATION_ONE]);
		const locations = service(storage, [CREATED_AT, UPDATED_AT]);
		const created = await locations.create({
			name: '  Community Garden  ',
			hardinessZone: '8A',
		});

		expect(created).toMatchObject({
			id: LOCATION_ONE,
			name: 'Community Garden',
			hardinessZone: '8a',
			isSystemDefault: false,
		});
		expect(await locations.getById(LOCATION_ONE)).toEqual(created);
		expect(await locations.update(LOCATION_ONE, {
			name: 'Allotment',
			hardinessZone: '',
		})).toBe(true);
		expect(await locations.getById(LOCATION_ONE)).toMatchObject({
			name: 'Allotment',
			hardinessZone: null,
			updatedAt: UPDATED_AT,
		});
		expect(await locations.remove(LOCATION_ONE)).toBe(true);
		expect(await locations.getById(LOCATION_ONE)).toBeNull();
		expect(await locations.remove(LOCATION_ONE)).toBe(false);
		expect(await locations.update(LOCATION_ONE, { name: 'Missing' })).toBe(false);
		storage.close();
	});

	it('rejects blank names and invalid zones without changing records', async () => {
		const storage = await initialize([LOCATION_ONE]);
		const locations = service(storage);
		for (const name of ['', '   ', '\n']) {
			await expect(locations.create({ name })).rejects.toMatchObject({
				name: 'ValidationError',
				code: 'INVALID_LOCATION_NAME',
				field: 'name',
			});
		}

		for (const hardinessZone of ['0a', '1c', '13c', '14a', '7', 'zone 7b']) {
			await expect(locations.create({ name: 'Invalid zone', hardinessZone }))
				.rejects.toMatchObject({
					name: 'ValidationError',
					code: 'INVALID_HARDINESS_ZONE',
					field: 'hardinessZone',
				});
		}
		expect(await locations.list()).toHaveLength(1);
		await expect(storage.repositories.locations.create({
			id: 'not-a-uuid',
			name: 'Invalid identity',
			hardinessZone: null,
			isSystemDefault: false,
			createdAt: CREATED_AT,
			updatedAt: CREATED_AT,
		})).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'INVALID_RECORD_ID',
			field: 'id',
		});
		storage.close();
	});

	it('accepts every zone boundary and normalizes uppercase input', async () => {
		const storage = await initialize([LOCATION_ONE, LOCATION_TWO]);
		const locations = service(storage, [CREATED_AT, UPDATED_AT]);
		expect((await locations.create({ name: 'Cold site', hardinessZone: '1A' })).hardinessZone)
			.toBe('1a');
		expect((await locations.create({ name: 'Warm site', hardinessZone: '13B' })).hardinessZone)
			.toBe('13b');
		storage.close();
	});

	it('rejects deletion of the protected Default even after it is renamed', async () => {
		const storage = await initialize();
		const locations = service(storage, [UPDATED_AT]);
		await locations.update(DEFAULT_LOCATION_ID, { name: 'Home' });
		await expect(locations.remove(DEFAULT_LOCATION_ID)).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'PROTECTED_LOCATION',
		});
		expect(await locations.getById(DEFAULT_LOCATION_ID)).toMatchObject({ name: 'Home' });
		storage.close();
	});

	it('atomically rejects deletion referenced by an archived Garden', async () => {
		const storage = await initialize([LOCATION_ONE]);
		const locations = service(storage);
		await locations.create({ name: 'Old Orchard' });

		const database = createGardenDatabase(storage.databaseName, dependencies);
		await database.open();
		await database.table('gardens').add({
			id: GARDEN_UUID,
			name: 'Archived Orchard',
			locationId: LOCATION_ONE,
			typeIds: [],
			status: 'archived',
			isClosed: true,
			updatedAt: UPDATED_AT,
		});
		database.close();

		await expect(locations.remove(LOCATION_ONE)).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'LOCATION_IN_USE',
			field: 'id',
		});
		expect(await locations.getById(LOCATION_ONE)).toMatchObject({ name: 'Old Orchard' });

		const verification = createGardenDatabase(storage.databaseName, dependencies);
		await verification.open();
		expect(await verification.table('gardens').get(GARDEN_UUID)).toMatchObject({
			locationId: LOCATION_ONE,
			status: 'archived',
		});
		verification.close();
		storage.close();
	});

	it('surfaces storage failures without discarding a custom Location', async () => {
		const storage = await initialize([LOCATION_ONE]);
		const locations = service(storage);
		const created = await locations.create({ name: 'Keep this site' });
		storage.close();

		await expect(locations.update(created.id, { name: 'Do not save' }))
			.rejects.toBeInstanceOf(StorageError);

		const reopened = await initializeDexieStorage({ dependencies });
		expect(await reopened.repositories.locations.getById(created.id)).toEqual(created);
		reopened.close();
	});

	it('fails startup visibly when Default seeding fails without replacing data', async () => {
		const first = await initialize([LOCATION_ONE]);
		const locations = service(first);
		const retained = await locations.create({ name: 'Retained site' });
		const databaseName = first.databaseName;
		first.close();

		const raw = createGardenDatabase(databaseName, dependencies);
		await raw.open();
		await raw.table('locations').delete(DEFAULT_LOCATION_ID);
		raw.close();

		const result = await initializeDexieStorage({
			dependencies,
			openGarden: async (...args) => {
				const database = await openGardenDatabase(...args);
				database.table('locations').hook('creating', () => {
					throw new Error('simulated seeding failure');
				});
				return database;
			},
		});
		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'LOCATION_INITIALIZATION_FAILED' },
		});

		const verification = createGardenDatabase(databaseName, dependencies);
		await verification.open();
		expect(await verification.table('locations').get(retained.id)).toEqual(retained);
		expect(await verification.table('locations').get(DEFAULT_LOCATION_ID)).toBeUndefined();
		verification.close();
	});
});
