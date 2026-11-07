import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGardenTypesService } from './gardenTypes.js';
import { CONTROL_DATABASE_NAME } from '../storage/dexie/constants.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { GARDEN_TYPE_DEFINITIONS } from '../storage/gardenTypeValidation.js';
import { ValidationError } from '../storage/index.js';

const DATABASE_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Garden Types', () => {
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

	async function initialize() {
		const storage = await initializeDexieStorage({
			dependencies,
			randomUUID: vi.fn(() => DATABASE_UUID),
		});
		if (storage.databaseName) createdDatabases.add(storage.databaseName);
		return storage;
	}

	it('seeds exactly eight fixed definitions in deterministic order', async () => {
		const storage = await initialize();
		expect(storage.status).toBe('ready');
		expect(await storage.repositories.gardenTypes.list()).toEqual(
			GARDEN_TYPE_DEFINITIONS.map((definition) => ({ ...definition })),
		);
		expect((await storage.repositories.gardenTypes.list()).map(({ id, name, isSystem, sortOrder }) => ({
			id,
			name,
			isSystem,
			sortOrder,
		}))).toEqual([
			{ id: 'in-ground', name: 'In-Ground', isSystem: true, sortOrder: 0 },
			{ id: 'raised-bed', name: 'Raised Bed', isSystem: true, sortOrder: 1 },
			{ id: 'container', name: 'Container', isSystem: true, sortOrder: 2 },
			{ id: 'greenhouse', name: 'Greenhouse', isSystem: true, sortOrder: 3 },
			{ id: 'hydroponic', name: 'Hydroponic', isSystem: true, sortOrder: 4 },
			{ id: 'other', name: 'Other', isSystem: true, sortOrder: 5 },
			{ id: 'indoor', name: 'Indoor', isSystem: true, sortOrder: 6 },
			{ id: 'outdoor', name: 'Outdoor', isSystem: true, sortOrder: 7 },
		]);
		storage.close();
	});

	it('is idempotent across restart and preserves valid existing definitions', async () => {
		const first = await initialize();
		const databaseName = first.databaseName;
		first.close();

		const raw = createGardenDatabase(databaseName, dependencies);
		await raw.open();
		await raw.table('gardenTypes').update('container', {
			description: 'A valid existing description',
		});
		raw.close();

		const reopened = await initializeDexieStorage({ dependencies });
		expect(reopened.databaseName).toBe(databaseName);
		expect(await reopened.repositories.gardenTypes.list()).toHaveLength(8);
		expect(await reopened.repositories.gardenTypes.getById('container')).toMatchObject({
			description: 'A valid existing description',
		});
		reopened.close();
	});

	it('restores a missing fixed definition without replacing valid records', async () => {
		const first = await initialize();
		const databaseName = first.databaseName;
		first.close();

		const raw = createGardenDatabase(databaseName, dependencies);
		await raw.open();
		await raw.table('gardenTypes').delete('outdoor');
		await raw.table('gardenTypes').update('container', {
			description: 'Preserve this value',
		});
		raw.close();

		const reopened = await initializeDexieStorage({ dependencies });
		expect(await reopened.repositories.gardenTypes.list()).toHaveLength(8);
		expect(await reopened.repositories.gardenTypes.getById('outdoor')).toMatchObject({
			name: 'Outdoor',
		});
		expect(await reopened.repositories.gardenTypes.getById('container')).toMatchObject({
			description: 'Preserve this value',
		});
		reopened.close();
	});

	it('fails safely on a conflicting definition without resetting stored data', async () => {
		const first = await initialize();
		const databaseName = first.databaseName;
		first.close();

		const raw = createGardenDatabase(databaseName, dependencies);
		await raw.open();
		await raw.table('gardenTypes').update('raised-bed', { name: 'Conflicting name' });
		raw.close();

		const result = await initializeDexieStorage({ dependencies });
		expect(result).toMatchObject({
			status: 'recovery-required',
			error: { code: 'GARDEN_TYPE_INITIALIZATION_FAILED' },
		});

		const verification = createGardenDatabase(databaseName, dependencies);
		await verification.open();
		expect(await verification.table('gardenTypes').get('raised-bed')).toMatchObject({
			name: 'Conflicting name',
		});
		expect(await verification.table('gardenTypes').count()).toBe(8);
		verification.close();
	});

	it('exposes read-only repository and service interfaces', async () => {
		const storage = await initialize();
		const repository = storage.repositories.gardenTypes;
		const service = createGardenTypesService(repository);

		expect(Object.keys(repository).sort()).toEqual(['getById', 'list']);
		expect(Object.keys(service).sort()).toEqual(['getById', 'list', 'validateSelection']);
		expect(repository.create).toBeUndefined();
		expect(repository.update).toBeUndefined();
		expect(repository.remove).toBeUndefined();
		expect(service.create).toBeUndefined();
		expect(service.update).toBeUndefined();
		expect(service.remove).toBeUndefined();
		storage.close();
	});

	it('accepts empty and multiple independent selections', async () => {
		const storage = await initialize();
		const service = createGardenTypesService(storage.repositories.gardenTypes);

		expect(await service.validateSelection([])).toEqual([]);
		expect(await service.validateSelection(['outdoor', 'raised-bed', 'container']))
			.toEqual(['outdoor', 'raised-bed', 'container']);
		storage.close();
	});

	it('rejects null, malformed, unknown, and duplicate selections', async () => {
		const storage = await initialize();
		const service = createGardenTypesService(storage.repositories.gardenTypes);

		for (const selection of [null, 'in-ground', {}, new Set(['in-ground'])]) {
			await expect(service.validateSelection(selection)).rejects.toMatchObject({
				name: 'ValidationError',
				code: 'INVALID_GARDEN_TYPE_SELECTION',
				field: 'typeIds',
			});
		}
		await expect(service.validateSelection(['unknown'])).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'UNKNOWN_GARDEN_TYPE',
			field: 'typeIds',
		});
		await expect(service.validateSelection(['indoor', 'indoor'])).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'DUPLICATE_GARDEN_TYPE',
			field: 'typeIds',
		});
		storage.close();
	});

	it('does not validate selections against an incomplete stored catalog', async () => {
		const storage = await initialize();
		const service = createGardenTypesService(storage.repositories.gardenTypes);
		const raw = createGardenDatabase(storage.databaseName, dependencies);
		await raw.open();
		await raw.table('gardenTypes').delete('other');
		raw.close();

		await expect(service.validateSelection(['in-ground'])).rejects.toBeInstanceOf(
			ValidationError,
		);
		storage.close();
	});
});
