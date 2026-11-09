import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { seedGardenSamples } from '../../dev/seedGardens.js';
import { DEFAULT_LOCATION_ID } from '../../storage/locationValidation.js';
import { StorageError } from '../../storage/errors.js';
import { createGardenReaders, loadGardenDetail, loadGardenOverview } from './viewModel.js';

const MISSING_ID = '550e8400-e29b-41d4-a716-446655440099';

describe('Garden browsing data', () => {
	let dependencies, storage, readers, samples;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		samples = await seedGardenSamples({ dependencies });
		storage = await initializeDexieStorage({ dependencies });
		readers = createGardenReaders(storage.repositories);
	});
	afterEach(async () => {
		storage?.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	it('groups fixture statuses and keeps duplicate names linked to distinct UUIDs', async () => {
		const result = await loadGardenOverview(readers);
		expect(result.status).toBe('ready');
		expect(result.current.map(({ status }) => status).sort()).toEqual(['active', 'planned']);
		expect(result.previous.map(({ status }) => status).sort()).toEqual(['archived', 'completed']);
		expect(result.current.map(({ name }) => name)).toEqual(['Tomatoes', 'Tomatoes']);
		expect(new Set(result.current.map(({ href }) => href)).size).toBe(2);
		for (const record of samples) {
			expect([...result.current, ...result.previous]).toContainEqual(
				expect.objectContaining({ id: record.id, href: `/gardens/${record.id}` }),
			);
		}
	});

	it('orders by update time with a stable UUID tie-breaker, independently of closure and dates', async () => {
		const gardens = { list: async () => [
			{ ...samples[0], id: 'b', updatedAt: '2026-11-01', isClosed: true, endDate: '2020-01-01' },
			{ ...samples[0], id: 'c', updatedAt: '2026-11-02' },
			{ ...samples[0], id: 'a', updatedAt: '2026-11-01' },
		] };
		const result = await loadGardenOverview({ ...readers, gardens });
		expect(result.current.map(({ id }) => id)).toEqual(['c', 'a', 'b']);
	});

	it('retrieves the correct saved detail and resolves renamed Locations and seeded Type names', async () => {
		await readers.locations.update(DEFAULT_LOCATION_ID, { name: 'Home Farm' });
		const result = await loadGardenDetail(readers, samples[1].id);
		expect(result).toMatchObject({ status: 'ready', garden: {
			id: samples[1].id, name: 'Tomatoes', subtitle: 'Patio', locationName: 'Home Farm',
			typeNames: ['Container', 'Outdoor'], statusLabel: 'Active', notes: samples[1].notes,
		} });
		expect((await loadGardenOverview(readers)).current.every(({ locationName }) => locationName === 'Home Farm')).toBe(true);
	});

	it('preserves empty optional data and a valid empty overview', async () => {
		const result = await loadGardenDetail(readers, samples[0].id);
		expect(result).toMatchObject({ status: 'ready', garden: {
			typeNames: [], startDate: null, endDate: null, notes: null, description: null,
		} });
		expect(await loadGardenOverview({ ...readers, gardens: { list: async () => [] } })).toEqual({
			status: 'ready', current: [], previous: [], drafts: [],
		});
	});

	it('lists recoverable Garden drafts with useful resume labels', async () => {
		const untitled = await readers.drafts.create();
		const result = await loadGardenOverview(readers);
		expect(result.drafts).toContainEqual(expect.objectContaining({
			id: untitled.id,
			label: 'Untitled Garden',
			href: `/gardens/new/wizard/${untitled.id}`,
		}));
	});

	it('reopens unfinished drafts in their last-used editor in both directions', async () => {
		const draft = await readers.drafts.create();
		await readers.drafts.save({
			id: draft.id,
			fields: draft.fields,
			preferredEditor: 'advanced',
		});
		let result = await loadGardenOverview(readers);
		expect(result.drafts).toContainEqual(expect.objectContaining({
			id: draft.id,
			href: `/gardens/new/advanced/${draft.id}`,
		}));

		await readers.drafts.save({
			id: draft.id,
			fields: draft.fields,
			preferredEditor: 'wizard',
		});
		result = await loadGardenOverview(readers);
		expect(result.drafts).toContainEqual(expect.objectContaining({
			id: draft.id,
			href: `/gardens/new/wizard/${draft.id}`,
		}));
	});

	it.each(['invalid-id', MISSING_ID])('returns not-found for missing or invalid IDs: %s', async (id) => {
		expect(await loadGardenDetail(readers, id)).toEqual({ status: 'not-found' });
	});

	it('distinguishes read failures from missing records, including reference lookup failures', async () => {
		const failure = vi.fn(async () => { throw new StorageError('read', new Error('offline storage failure')); });
		expect(await loadGardenDetail({ ...readers, gardens: { getById: failure } }, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenDetail({ ...readers, types: { list: failure } }, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenOverview({ ...readers, locations: { list: failure } })).toEqual({ status: 'error' });
		storage.close();
		expect(await loadGardenDetail(readers, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenOverview(readers)).toEqual({ status: 'error' });
	});
});
