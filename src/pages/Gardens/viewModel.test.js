import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { seedGardenSamples } from '../../dev/seedGardens.js';
import { DEFAULT_LOCATION_ID } from '../../storage/locationValidation.js';
import { StorageError } from '../../storage/errors.js';
import {
	createGardenReaders, loadGardenDetail, loadGardenDrafts, loadGardenOverview,
} from './viewModel.js';

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
		expect(result.current.map(({ status }) => status)).toEqual(['active']);
		expect(result.planned.map(({ status }) => status)).toEqual(['planned']);
		expect(result.previous.map(({ status }) => status).sort()).toEqual(['archived', 'completed']);
		expect([...result.current, ...result.planned].map(({ name }) => name)).toEqual(['Tomatoes', 'Tomatoes']);
		expect(new Set([...result.current, ...result.planned].map(({ href }) => href)).size).toBe(2);
		for (const record of samples) {
			expect([...result.current, ...result.planned, ...result.previous]).toContainEqual(
				expect.objectContaining({ id: record.id, href: `/gardens/${record.id}` }),
			);
		}
	});

	it('classifies closed Gardens as Previous before status and never duplicates a record', async () => {
		const base = samples[0];
		const records = [
			{ ...base, id: 'active-open', status: 'active', isClosed: false },
			{ ...base, id: 'planned-open', status: 'planned', isClosed: false },
			{ ...base, id: 'active-closed', status: 'active', isClosed: true },
			{ ...base, id: 'planned-closed', status: 'planned', isClosed: true },
			{ ...base, id: 'completed-open', status: 'completed', isClosed: false },
			{ ...base, id: 'archived-closed', status: 'archived', isClosed: true },
		];
		const result = await loadGardenOverview({ ...readers, gardens: { list: async () => records } });
		expect(result.current.map(({ id }) => id)).toEqual(['active-open']);
		expect(result.planned.map(({ id }) => id)).toEqual(['planned-open']);
		expect(result.previous.map(({ id }) => id)).toEqual([
			'active-closed', 'archived-closed', 'completed-open', 'planned-closed',
		]);
		const groupedIds = [...result.current, ...result.planned, ...result.previous].map(({ id }) => id);
		expect(groupedIds).toHaveLength(records.length);
		expect(new Set(groupedIds).size).toBe(records.length);
	});

	it('orders by update time with a stable UUID tie-breaker within each category', async () => {
		const gardens = { list: async () => [
			{ ...samples[0], id: 'b', updatedAt: '2026-11-01', isClosed: true, endDate: '2020-01-01' },
			{ ...samples[0], id: 'c', updatedAt: '2026-11-02' },
			{ ...samples[0], id: 'a', updatedAt: '2026-11-01' },
		] };
		const result = await loadGardenOverview({ ...readers, gardens });
		expect(result.planned.map(({ id }) => id)).toEqual(['c', 'a']);
		expect(result.previous.map(({ id }) => id)).toEqual(['b']);
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
			status: 'ready', current: [], planned: [], previous: [], drafts: [],
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
		expect([...result.current, ...result.planned, ...result.previous].some(({ id }) => id === untitled.id)).toBe(false);
	});

	it('reopens unfinished drafts in each editor with matching creation labels', async () => {
		const draft = await readers.drafts.create();
		await readers.drafts.save({
			id: draft.id,
			fields: draft.fields,
			preferredEditor: 'advanced',
		});
		let result = await loadGardenOverview(readers);
		expect(result.drafts).toContainEqual(expect.objectContaining({
			id: draft.id,
			creationMethodLabel: 'Advanced',
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
			creationMethodLabel: 'Wizard',
			href: `/gardens/new/wizard/${draft.id}`,
		}));

		await readers.drafts.save({
			id: draft.id,
			fields: draft.fields,
			preferredEditor: 'quickstart',
			currentStepId: null,
		});
		result = await loadGardenOverview(readers);
		expect(result.drafts).toContainEqual(expect.objectContaining({
			id: draft.id,
			creationMethodLabel: 'Quick Start',
			href: `/gardens/new/quickstart/${draft.id}`,
		}));
	});

	it('preserves entered Draft names and subtitles in card data', async () => {
		const draft = await readers.drafts.create();
		await readers.drafts.save({
			id: draft.id,
			fields: { ...draft.fields, name: '  Patio Tomatoes  ', subtitle: '  South wall  ' },
			preferredEditor: draft.preferredEditor,
		});
		expect((await loadGardenDrafts(readers)).drafts).toContainEqual(expect.objectContaining({
			id: draft.id,
			label: '  Patio Tomatoes  ',
			subtitle: '  South wall  ',
		}));
	});

	it('loads the dedicated Draft collection with the same labels, order, and editor links', async () => {
		const wizard = await readers.drafts.create();
		await readers.drafts.save({
			id: wizard.id,
			fields: { ...wizard.fields, name: 'Wizard draft' },
			preferredEditor: 'wizard',
		});
		const result = await loadGardenDrafts(readers);
		expect(result).toEqual({
			status: 'ready',
			drafts: [expect.objectContaining({
				id: wizard.id,
				label: 'Wizard draft',
				href: `/gardens/new/wizard/${wizard.id}`,
			})],
		});
	});

	it.each(['invalid-id', MISSING_ID])('returns not-found for missing or invalid IDs: %s', async (id) => {
		expect(await loadGardenDetail(readers, id)).toEqual({ status: 'not-found' });
	});

	it('distinguishes read failures from missing records, including reference lookup failures', async () => {
		const failure = vi.fn(async () => { throw new StorageError('read', new Error('offline storage failure')); });
		expect(await loadGardenDetail({ ...readers, gardens: { getById: failure } }, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenDetail({ ...readers, types: { list: failure } }, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenOverview({ ...readers, locations: { list: failure } })).toEqual({ status: 'error' });
		expect(await loadGardenDrafts({ ...readers, drafts: { list: failure } })).toEqual({ status: 'error' });
		storage.close();
		expect(await loadGardenDetail(readers, samples[0].id)).toEqual({ status: 'error' });
		expect(await loadGardenOverview(readers)).toEqual({ status: 'error' });
	});
});
