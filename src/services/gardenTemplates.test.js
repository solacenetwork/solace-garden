import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGardenLifecycleService } from './gardenLifecycle.js';
import { createGardenTemplatesService } from './gardenTemplates.js';
import { createGardensService } from './gardens.js';
import { createLocationsService } from './locations.js';
import { GARDEN_DATABASE_VERSION, GARDEN_STORES } from '../storage/dexie/constants.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { StorageError, ValidationError } from '../storage/errors.js';
import { DEFAULT_LOCATION_ID } from '../storage/locationValidation.js';

const CREATED = '2026-11-08T15:00:00.000Z';
const UPDATED = '2026-11-08T16:00:00.000Z';
const MISSING = '550e8400-e29b-41d4-a716-446655440099';

describe('Garden Template foundation', () => {
	let dependencies;
	let storage;
	let gardens;
	let templates;
	let raw;

	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates, {
			now: () => CREATED,
		});
		raw = createGardenDatabase(storage.databaseName, dependencies);
		await raw.open();
	});

	afterEach(async () => {
		raw.close();
		storage.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	async function createSource(overrides = {}) {
		return gardens.create({
			name: '  Kitchen Garden  ',
			description: '  Sunny vegetables  ',
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['outdoor', 'raised-bed'],
			...overrides,
		});
	}

	it('creates an independent named snapshot containing only reusable configuration', async () => {
		const garden = await createSource({
			subtitle: 'South beds', notes: 'Do not copy', startDate: '2026-04-01',
		});
		const template = await templates.createFromGarden({
			gardenId: garden.id,
			name: '  Summer vegetables  ',
		});

		expect(template).toEqual({
			id: expect.stringMatching(/^[\da-f-]{36}$/),
			name: 'Summer vegetables',
			configuration: {
				name: 'Kitchen Garden',
				description: 'Sunny vegetables',
				locationId: DEFAULT_LOCATION_ID,
				typeIds: ['outdoor', 'raised-bed'],
				layoutMediaId: null,
			},
			createdAt: CREATED,
			updatedAt: CREATED,
		});
		expect(Object.keys(template.configuration).sort()).toEqual([
			'description', 'layoutMediaId', 'locationId', 'name', 'typeIds',
		]);

		template.configuration.name = 'Changed by caller';
		template.configuration.typeIds.push('indoor');
		await gardens.update(garden.id, {
			name: 'Renamed Garden', description: 'Different', typeIds: ['container'],
		});
		expect((await templates.getById(template.id)).configuration).toEqual({
			name: 'Kitchen Garden',
			description: 'Sunny vegetables',
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['outdoor', 'raised-bed'],
			layoutMediaId: null,
		});
	});

	it('allows duplicate Template names while always creating distinct records', async () => {
		const garden = await createSource();
		const first = await templates.createFromGarden({ gardenId: garden.id, name: 'Favorite' });
		const second = await templates.createFromGarden({ gardenId: garden.id, name: 'Favorite' });
		expect(second.id).not.toBe(first.id);
		expect((await templates.list()).map(({ name }) => name)).toEqual(['Favorite', 'Favorite']);
	});

	it.each([
		['closed', async (lifecycle, garden) => lifecycle.close(
			garden.id, {}, { status: garden.status, isClosed: garden.isClosed },
		)],
		['archived', async (lifecycle, garden) => lifecycle.archive(
			garden.id, { status: garden.status, isClosed: garden.isClosed },
		)],
	])('creates a snapshot from a %s Garden', async (_state, transition) => {
		const garden = await createSource();
		const lifecycle = createGardenLifecycleService(storage.repositories.gardens, {
			now: () => UPDATED,
		});
		await transition(lifecycle, garden);
		const template = await templates.createFromGarden({ gardenId: garden.id, name: 'History' });
		expect(template.configuration.name).toBe('Kitchen Garden');
	});

	it('rejects invalid creation input, missing Gardens, stale references, and unsupported fields', async () => {
		const garden = await createSource();
		for (const input of [null, [], 'template']) {
			await expect(templates.createFromGarden(input)).rejects.toBeInstanceOf(ValidationError);
		}
		for (const name of [undefined, '', '   ']) {
			await expect(templates.createFromGarden({ gardenId: garden.id, name }))
				.rejects.toMatchObject({ code: 'INVALID_TEMPLATE_NAME' });
		}
		await expect(templates.createFromGarden({ gardenId: 'not-an-id', name: 'No' }))
			.rejects.toMatchObject({ code: 'INVALID_RECORD_ID', field: 'gardenId' });
		await expect(templates.createFromGarden({ gardenId: MISSING, name: 'Missing' }))
			.rejects.toMatchObject({ code: 'GARDEN_NOT_FOUND', field: 'gardenId' });
		await expect(templates.createFromGarden({ gardenId: garden.id, name: 'No', status: 'active' }))
			.rejects.toMatchObject({ code: 'UNSUPPORTED_TEMPLATE_FIELD', field: 'status' });

		await raw.table('gardens').update(garden.id, { locationId: MISSING });
		await expect(templates.createFromGarden({ gardenId: garden.id, name: 'Stale' }))
			.rejects.toMatchObject({ code: 'LOCATION_NOT_FOUND' });
		expect(await templates.list()).toEqual([]);
	});

	it('validates Garden Type selections without adding exclusivity rules', async () => {
		const combined = await createSource({
			typeIds: ['indoor', 'outdoor', 'container', 'hydroponic'],
		});
		expect((await templates.createFromGarden({
			gardenId: combined.id, name: 'Combined',
		})).configuration.typeIds).toEqual(['indoor', 'outdoor', 'container', 'hydroponic']);

		const duplicate = await createSource({ name: 'Duplicate source' });
		await raw.table('gardens').update(duplicate.id, { typeIds: ['outdoor', 'outdoor'] });
		await expect(templates.createFromGarden({ gardenId: duplicate.id, name: 'Invalid' }))
			.rejects.toMatchObject({ code: 'DUPLICATE_GARDEN_TYPE' });

		const unknown = await createSource({ name: 'Unknown source' });
		await raw.table('gardens').update(unknown.id, { typeIds: ['future-type'] });
		await expect(templates.createFromGarden({ gardenId: unknown.id, name: 'Invalid' }))
			.rejects.toMatchObject({ code: 'UNKNOWN_GARDEN_TYPE' });
	});

	it('retrieves and lists Templates after database reopen with defensive copies', async () => {
		const garden = await createSource();
		const created = await templates.createFromGarden({ gardenId: garden.id, name: 'Persistent' });
		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates);
		const retrieved = await templates.getById(created.id);
		expect(retrieved).toEqual(created);
		retrieved.configuration.typeIds.length = 0;
		const listed = await templates.list();
		listed[0].configuration.typeIds.push('indoor');
		expect((await templates.getById(created.id)).configuration.typeIds)
			.toEqual(['outdoor', 'raised-bed']);
		expect(await templates.getById(MISSING)).toBeNull();
	});

	it('falls back to Default after a custom Location is deleted and preserves the snapshot', async () => {
		const locations = createLocationsService(storage.repositories.locations, { now: () => CREATED });
		const custom = await locations.create({ name: 'Community Plot' });
		const garden = await createSource({ locationId: custom.id });
		const template = await templates.createFromGarden({ gardenId: garden.id, name: 'Community' });

		await expect(locations.remove(custom.id)).rejects.toMatchObject({ code: 'LOCATION_IN_USE' });
		await gardens.update(garden.id, { locationId: DEFAULT_LOCATION_ID });
		expect(await locations.remove(custom.id)).toBe(true);

		const resolution = await templates.resolveConfiguration(template.id);
		expect(resolution).toEqual({
			configuration: { ...template.configuration, locationId: DEFAULT_LOCATION_ID },
			locationResolution: {
				fallbackOccurred: true,
				originalLocationId: custom.id,
				resolvedLocationId: DEFAULT_LOCATION_ID,
			},
		});
		expect((await templates.getById(template.id)).configuration.locationId).toBe(custom.id);
		resolution.configuration.typeIds.push('indoor');
		expect((await templates.getById(template.id)).configuration.typeIds)
			.toEqual(['outdoor', 'raised-bed']);
	});

	it('never replaces an existing valid Location and reports no fallback', async () => {
		const garden = await createSource();
		const template = await templates.createFromGarden({ gardenId: garden.id, name: 'Default site' });
		expect(await templates.resolveConfiguration(template.id)).toEqual({
			configuration: template.configuration,
			locationResolution: {
				fallbackOccurred: false,
				originalLocationId: DEFAULT_LOCATION_ID,
				resolvedLocationId: DEFAULT_LOCATION_ID,
			},
		});
		expect(await templates.resolveConfiguration(MISSING)).toBeNull();
	});

	it('does not let a previously resolved Location bypass Garden creation integrity', async () => {
		const locations = createLocationsService(storage.repositories.locations, { now: () => CREATED });
		const custom = await locations.create({ name: 'Short-lived site' });
		const source = await createSource({ locationId: custom.id });
		const template = await templates.createFromGarden({ gardenId: source.id, name: 'Stale form' });
		const resolved = await templates.resolveConfiguration(template.id);
		expect(resolved.locationResolution.fallbackOccurred).toBe(false);

		await gardens.update(source.id, { locationId: DEFAULT_LOCATION_ID });
		await locations.remove(custom.id);
		const { layoutMediaId: _deferredMedia, ...creationFields } = resolved.configuration;
		await expect(gardens.create(creationFields)).rejects.toMatchObject({
			code: 'LOCATION_NOT_FOUND',
			field: 'locationId',
		});
	});

	it('permanently removes only the Template and leaves Gardens unchanged', async () => {
		const source = await createSource();
		const other = await createSource({ name: 'Other Garden' });
		const template = await templates.createFromGarden({ gardenId: source.id, name: 'Disposable' });
		expect(await templates.removePermanently(template.id)).toBe(true);
		expect(await templates.removePermanently(template.id)).toBe(false);
		expect(await templates.getById(template.id)).toBeNull();
		expect(await gardens.getById(source.id)).toEqual(source);
		expect(await gardens.getById(other.id)).toEqual(other);
	});

	it('rolls back failed writes without leaving a partial Template', async () => {
		const garden = await createSource();
		const fail = vi.fn(() => { throw new Error('simulated storage failure'); });
		const hooked = await initializeDexieStorage({
			dependencies,
			openGarden: async () => {
				const database = createGardenDatabase(storage.databaseName, dependencies);
				await database.open();
				database.table('gardenTemplates').hook('creating', fail);
				return database;
			},
		});
		try {
			const service = createGardenTemplatesService(hooked.repositories.gardenTemplates, {
				now: () => CREATED,
			});
			await expect(service.createFromGarden({ gardenId: garden.id, name: 'Failed' }))
				.rejects.toBeInstanceOf(StorageError);
			expect(fail).toHaveBeenCalled();
		} finally {
			hooked.close();
		}
		expect(await templates.list()).toEqual([]);
		expect(await gardens.getById(garden.id)).toEqual(garden);
	});

	it('retains the existing schema version and indexes', () => {
		expect(storage.repositories.gardenTemplates).toBeDefined();
		expect(raw.verno).toBe(GARDEN_DATABASE_VERSION);
		expect(GARDEN_DATABASE_VERSION).toBe(2);
		expect(raw.tables.map(({ name }) => name).sort()).toEqual(Object.keys(GARDEN_STORES).sort());
		expect(raw.table('gardenTemplates').schema.primKey.name).toBe('id');
		expect(raw.table('gardenTemplates').schema.indexes.map(({ name }) => name).sort())
			.toEqual(['name', 'updatedAt']);
	});

	it('rejects invalid Template IDs before storage access', async () => {
		for (const operation of [
			() => templates.getById('invalid'),
			() => templates.resolveConfiguration('invalid'),
			() => templates.removePermanently('invalid'),
		]) {
			await expect(operation()).rejects.toMatchObject({
				code: 'INVALID_RECORD_ID',
				field: 'id',
			});
		}
	});
});
