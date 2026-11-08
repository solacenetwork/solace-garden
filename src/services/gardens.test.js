import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGardensService } from './gardens.js';
import { createGardenLifecycleService } from './gardenLifecycle.js';
import { createNotesService } from './notes.js';
import { createListItemsService } from './listItems.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { DEFAULT_LOCATION_ID } from '../storage/locationValidation.js';
import { StorageError, ValidationError } from '../storage/errors.js';

const CREATED = '2026-11-07T12:00:00.000Z';
const UPDATED = '2026-11-07T13:00:00.000Z';
const MISSING = '550e8400-e29b-41d4-a716-446655440099';
const input = { name: '  Tomatoes  ', locationId: DEFAULT_LOCATION_ID };

describe('Garden data foundation', () => {
	let dependencies, storage, gardens, raw;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
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

	it('creates the exact default contract, allows identical labels and returns safe copies', async () => {
		const first = await gardens.create({ ...input, subtitle: ' South Garden ' });
		const second = await gardens.create({ ...input, subtitle: 'South Garden' });
		expect(first).toEqual({
			id: expect.stringMatching(/^[\da-f-]{36}$/), name: 'Tomatoes', subtitle: 'South Garden',
			description: null, locationId: DEFAULT_LOCATION_ID, typeIds: [], status: 'planned',
			isClosed: false, startDate: null, endDate: null, notes: null, icon: null, color: null,
			thumbnailMediaId: null, layoutMediaId: null, createdAt: CREATED, updatedAt: CREATED,
		});
		expect(second.id).not.toBe(first.id);
		first.typeIds.push('outdoor');
		const listed = await gardens.list();
		expect(listed).toHaveLength(2);
		listed[0].typeIds.push('indoor');
		expect((await gardens.getById(first.id)).typeIds).toEqual([]);
		expect(gardens.remove).toBeUndefined();
		expect(storage.repositories.gardens.remove).toBeUndefined();
	});

	it('updates without losing fields and persists across database reopening', async () => {
		await storage.repositories.locations.update(DEFAULT_LOCATION_ID, { name: 'Home' });
		const created = await gardens.create({ ...input, description: ' Details ', typeIds: ['indoor', 'outdoor'] });
		const editor = createGardensService(storage.repositories.gardens, { now: () => UPDATED });
		expect(await editor.update(created.id, { subtitle: ' New ', notes: 'Summary' })).toBe(true);
		expect(await editor.update(MISSING, { name: 'Missing' })).toBe(false);
		expect(await gardens.getById(MISSING)).toBeNull();
		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		expect(await storage.repositories.gardens.getById(created.id)).toEqual({
			...created, subtitle: 'New', notes: 'Summary', updatedAt: UPDATED,
		});
	});

	it('edits every supported field while preserving identity, audit history, and independent Notes', async () => {
		const otherLocation = await storage.repositories.locations.create({
			name: 'Community Plot', hardinessZone: null, isSystemDefault: false,
			createdAt: CREATED, updatedAt: CREATED,
		});
		const created = await gardens.create({ ...input, subtitle: 'Original' });
		const notes = createNotesService(storage.repositories.notes, { now: () => CREATED });
		const independentNote = await notes.create({ text: 'Standalone observation', gardenId: created.id });
		const editor = createGardensService(storage.repositories.gardens, { now: () => UPDATED });
		const changes = {
			name: 'Tomatoes', subtitle: 'South plot', description: 'Full sun',
			locationId: otherLocation.id, typeIds: ['outdoor', 'raised-bed'],
			startDate: '2026-03-01', endDate: '2026-10-31', notes: 'Embedded Garden Notes',
		};
		expect(await editor.update(created.id, changes)).toBe(true);
		expect(await gardens.getById(created.id)).toEqual({
			...created, ...changes, id: created.id, createdAt: CREATED, updatedAt: UPDATED,
		});
		expect(await notes.getById(independentNote.id)).toEqual(independentNote);
		const duplicate = await gardens.create({ ...input, name: 'Tomatoes', subtitle: 'South plot' });
		expect(duplicate.id).not.toBe(created.id);
	});

	it.each([undefined, '', ' \n ', null, 12])('rejects invalid names: %s', async (name) => {
		await expect(gardens.create({ ...input, name })).rejects.toMatchObject({ code: 'INVALID_GARDEN_NAME' });
		expect(await gardens.list()).toEqual([]);
	});

	it('normalizes nullable text and enforces the Notes boundary', async () => {
		const created = await gardens.create({ ...input, subtitle: ' ', description: '\n', notes: 'x'.repeat(1000) });
		expect(created).toMatchObject({ subtitle: null, description: null, notes: 'x'.repeat(1000) });
		await expect(gardens.update(created.id, { notes: 'x'.repeat(1001) })).rejects.toMatchObject({ code: 'GARDEN_NOTES_TOO_LONG' });
		expect(await gardens.getById(created.id)).toEqual(created);
		await gardens.update(created.id, { notes: '  ' });
		expect((await gardens.getById(created.id)).notes).toBeNull();
	});

	it.each([
		[{ typeIds: ['unknown'] }, 'UNKNOWN_GARDEN_TYPE'],
		[{ typeIds: ['outdoor', 'outdoor'] }, 'DUPLICATE_GARDEN_TYPE'],
		[{ typeIds: null }, 'INVALID_GARDEN_TYPE_SELECTION'],
		[{ locationId: MISSING }, 'LOCATION_NOT_FOUND'],
		[{ locationId: undefined }, 'INVALID_RECORD_ID'],
		[{ startDate: '2026-02-29' }, 'INVALID_GARDEN_DATE'],
		[{ endDate: '2024-04-31' }, 'INVALID_GARDEN_DATE'],
		[{ startDate: '2024-13-01' }, 'INVALID_GARDEN_DATE'],
		[{ startDate: '2024-01-00' }, 'INVALID_GARDEN_DATE'],
		[{ startDate: '2024-1-01' }, 'INVALID_GARDEN_DATE'],
		[{ startDate: '2024-03-01', endDate: '2024-02-29' }, 'INVALID_GARDEN_DATE_ORDER'],
	])('rejects invalid creation and updates atomically: %j', async (changes, code) => {
		await expect(gardens.create({ ...input, ...changes })).rejects.toMatchObject({ code });
		const existing = await gardens.create(input);
		await expect(gardens.update(existing.id, { name: 'Must not save', ...changes })).rejects.toMatchObject({ code });
		expect(await gardens.getById(existing.id)).toEqual(existing);
	});

	it('accepts real leap dates, independent dates, and equal endpoints without lifecycle changes', async () => {
		const created = await gardens.create({ ...input, endDate: '2024-02-29' });
		await gardens.update(created.id, { startDate: '2024-02-29' });
		expect(await gardens.getById(created.id)).toMatchObject({ startDate: '2024-02-29', endDate: '2024-02-29', status: 'planned' });
		await gardens.update(created.id, { endDate: null });
	});

	it.each(['id', 'createdAt', 'updatedAt', 'status', 'isClosed', 'icon', 'color', 'thumbnailMediaId', 'layoutMediaId', 'unknown'])(
		'rejects caller-managed field %s', async (field) => {
			const created = await gardens.create(input);
			await expect(gardens.create({ ...input, [field]: 'override' })).rejects.toBeInstanceOf(ValidationError);
			await expect(gardens.update(created.id, { [field]: 'override' })).rejects.toBeInstanceOf(ValidationError);
			if (field !== 'updatedAt') {
				await expect(storage.repositories.gardens.update(created.id, { [field]: 'override' })).rejects.toBeInstanceOf(ValidationError);
			}
			expect(await gardens.getById(created.id)).toEqual(created);
		},
	);

	it.each([{ isClosed: true }, { status: 'archived', isClosed: false }])('enforces read-only rules in storage: %j', async (state) => {
		const created = await gardens.create(input);
		await raw.table('gardens').update(created.id, state);
		await expect(gardens.update(created.id, { name: 'Blocked' })).rejects.toMatchObject({ code: 'GARDEN_READ_ONLY' });
		await expect(storage.repositories.gardens.update(created.id, { name: 'Blocked' })).rejects.toMatchObject({ code: 'GARDEN_READ_ONLY' });
		expect(await gardens.getById(created.id)).toEqual({ ...created, ...state });
	});

	it('checks actual stored type references and protects referenced custom Locations', async () => {
		const location = await storage.repositories.locations.create({ name: 'Site', hardinessZone: null, isSystemDefault: false, createdAt: CREATED, updatedAt: CREATED });
		const created = await gardens.create({ ...input, locationId: location.id });
		await expect(storage.repositories.locations.remove(location.id)).rejects.toMatchObject({ code: 'LOCATION_IN_USE' });
		await raw.table('gardenTypes').delete('outdoor');
		await expect(gardens.update(created.id, { typeIds: ['outdoor'] })).rejects.toMatchObject({ code: 'INCOMPLETE_GARDEN_TYPE_CATALOG' });
		expect(await gardens.getById(created.id)).toEqual(created);
	});

	it('rolls back a failing write and normalizes storage errors', async () => {
		const created = await gardens.create(input);
		const fail = vi.fn(() => { throw new Error('simulated disk error'); });
		// Hook the adapter connection so failure happens during persistence.
		const hooked = await initializeDexieStorage({ dependencies, openGarden: async () => {
			const db = createGardenDatabase(storage.databaseName, dependencies);
			await db.open();
			db.table('gardens').hook('updating', fail);
			return db;
		} });
		try {
			await expect(createGardensService(hooked.repositories.gardens).update(created.id, { name: 'Lost' })).rejects.toBeInstanceOf(StorageError);
			expect(fail).toHaveBeenCalled();
			expect(await gardens.getById(created.id)).toEqual(created);
		} finally { hooked.close(); }
		storage.close();
		await expect(gardens.list()).rejects.toBeInstanceOf(StorageError);
	});

	it('keeps service normalization storage-neutral', async () => {
		const repository = { create: vi.fn(async (record) => record), update: vi.fn() };
		const service = createGardensService(repository, { now: () => CREATED });
		await expect(service.create({ locationId: DEFAULT_LOCATION_ID })).rejects.toMatchObject({ code: 'INVALID_GARDEN_NAME' });
		await expect(service.create({ name: 'Garden' })).rejects.toMatchObject({ code: 'INVALID_RECORD_ID' });
		expect(repository.create).not.toHaveBeenCalled();
		const result = await service.create({ ...input, subtitle: ' Label ', typeIds: ['outdoor'] });
		expect(result).toMatchObject({ name: 'Tomatoes', subtitle: 'Label', status: 'planned', typeIds: ['outdoor'] });
	});

	it('rejects malformed input and empty updates', async () => {
		for (const value of [null, [], 'text']) {
			await expect(gardens.create(value)).rejects.toBeInstanceOf(ValidationError);
			await expect(gardens.update(MISSING, value)).rejects.toBeInstanceOf(ValidationError);
		}
		await expect(gardens.update(MISSING, {})).rejects.toMatchObject({ code: 'EMPTY_CHANGES' });
	});

	it('permanently deletes a Garden and atomically clears independent associations', async () => {
		const garden = await gardens.create(input);
		const other = await gardens.create({ ...input, name: 'Other Garden' });
		const notes = createNotesService(storage.repositories.notes, { now: () => CREATED });
		const lists = createListItemsService(storage.repositories.listItems, { now: () => CREATED });
		const linkedNote = await notes.create({ text: 'Keep note', gardenId: garden.id });
		const otherNote = await notes.create({ text: 'Other note', gardenId: other.id });
		const task = await lists.create('task', { text: 'Keep task', gardenId: garden.id });
		const wish = await lists.create('wishlist', {
			text: 'Keep wish', gardenId: garden.id, quantity: '2', notes: 'Details', url: 'https://example.com/item',
		});
		await lists.setCompleted(task.id, true);
		await lists.setCompleted(wish.id, true);

		const deletion = createGardensService(storage.repositories.gardens, { now: () => UPDATED });
		expect(await deletion.removePermanently(garden.id)).toBe(true);
		expect(await deletion.removePermanently(garden.id)).toBe(false);
		expect(await gardens.getById(garden.id)).toBeNull();
		expect(await gardens.getById(other.id)).toEqual(other);
		expect(await notes.getById(linkedNote.id)).toEqual({ ...linkedNote, gardenId: null, updatedAt: UPDATED });
		expect(await notes.getById(otherNote.id)).toEqual(otherNote);
		expect(await lists.getById(task.id)).toMatchObject({
			id: task.id, text: task.text, gardenId: null, completed: true, sortOrder: task.sortOrder,
			createdAt: task.createdAt, updatedAt: UPDATED,
		});
		expect(await lists.getById(wish.id)).toMatchObject({
			id: wish.id, text: wish.text, gardenId: null, completed: true,
			quantity: '2', notes: 'Details', url: 'https://example.com/item', updatedAt: UPDATED,
		});
	});

	it('rolls back deletion and association clearing after an injected storage failure', async () => {
		const garden = await gardens.create(input);
		const notes = createNotesService(storage.repositories.notes, { now: () => CREATED });
		const lists = createListItemsService(storage.repositories.listItems, { now: () => CREATED });
		const note = await notes.create({ text: 'Still linked', gardenId: garden.id });
		const task = await lists.create('task', { text: 'Still linked task', gardenId: garden.id });
		const fail = vi.fn(() => { throw new Error('simulated disk error'); });
		const hooked = await initializeDexieStorage({ dependencies, openGarden: async () => {
			const db = createGardenDatabase(storage.databaseName, dependencies);
			await db.open();
			db.table('listItems').hook('updating', fail);
			return db;
		} });
		try {
			const deletion = createGardensService(hooked.repositories.gardens, { now: () => UPDATED });
			await expect(deletion.removePermanently(garden.id)).rejects.toBeInstanceOf(StorageError);
			expect(fail).toHaveBeenCalled();
		} finally {
			hooked.close();
		}
		expect(await gardens.getById(garden.id)).toEqual(garden);
		expect(await notes.getById(note.id)).toEqual(note);
		expect(await lists.getById(task.id)).toEqual(task);
	});

	it('serializes concurrent deletion and association writes without dangling references', async () => {
		const garden = await gardens.create(input);
		const notes = createNotesService(storage.repositories.notes, { now: () => UPDATED });
		const deletion = createGardensService(storage.repositories.gardens, { now: () => UPDATED });
		const [deleteResult, linkResult] = await Promise.allSettled([
			deletion.removePermanently(garden.id),
			notes.create({ text: 'Racing association', gardenId: garden.id }),
		]);
		expect(deleteResult.status).toBe('fulfilled');
		expect(await gardens.getById(garden.id)).toBeNull();
		if (linkResult.status === 'fulfilled') {
			expect((await notes.getById(linkResult.value.id)).gardenId).toBeNull();
		} else {
			expect(linkResult.reason).toMatchObject({ code: 'GARDEN_NOT_FOUND' });
		}
	});

	it('allows a formerly referenced custom Location to be deleted after Garden removal', async () => {
		const location = await storage.repositories.locations.create({
			name: 'Temporary Site', hardinessZone: null, isSystemDefault: false,
			createdAt: CREATED, updatedAt: CREATED,
		});
		const garden = await gardens.create({ ...input, locationId: location.id });
		await expect(storage.repositories.locations.remove(location.id)).rejects.toMatchObject({ code: 'LOCATION_IN_USE' });
		await createGardensService(storage.repositories.gardens, { now: () => UPDATED }).removePermanently(garden.id);
		expect(await storage.repositories.locations.remove(location.id)).toBe(true);
	});
});

describe('Garden lifecycle', () => {
	let dependencies, storage, gardens, lifecycle, raw;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		lifecycle = createGardenLifecycleService(storage.repositories.gardens, { now: () => UPDATED });
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

	function expected(garden) {
		return { status: garden.status, isClosed: garden.isClosed };
	}

	it('moves open Gardens manually while keeping Completed open and editable', async () => {
		const created = await gardens.create({ ...input, startDate: '2020-01-01', endDate: '2020-02-01' });
		expect(await lifecycle.setStatus(created.id, 'active', expected(created))).toBe(true);
		const active = await gardens.getById(created.id);
		expect(active).toEqual({ ...created, status: 'active', updatedAt: UPDATED });
		expect(await lifecycle.complete(active.id, {}, expected(active))).toBe(true);
		const completed = await gardens.getById(created.id);
		expect(completed).toMatchObject({ status: 'completed', isClosed: false, startDate: '2020-01-01', endDate: '2020-02-01' });
		expect(await createGardensService(storage.repositories.gardens, { now: () => '2026-11-07T14:00:00.000Z' })
			.update(created.id, { subtitle: 'Still editable' })).toBe(true);
	});

	it('optionally completes and closes with normalized Garden Notes in one write', async () => {
		const created = await gardens.create(input);
		await lifecycle.complete(created.id, { close: true, notes: '  Season summary  ' }, expected(created));
		expect(await gardens.getById(created.id)).toEqual({
			...created, status: 'completed', isClosed: true, notes: 'Season summary', updatedAt: UPDATED,
		});
		expect(() => lifecycle.complete(created.id, { close: true, notes: 'x'.repeat(1001) }, expected(created)))
			.toThrow(expect.objectContaining({ code: 'GARDEN_NOTES_TOO_LONG' }));
	});

	it('closes and reopens without changing status, and ordinary edits remain blocked while closed', async () => {
		const created = await gardens.create(input);
		await lifecycle.setStatus(created.id, 'active', expected(created));
		const active = await gardens.getById(created.id);
		await lifecycle.close(active.id, { notes: 'At close' }, expected(active));
		const closed = await gardens.getById(created.id);
		expect(closed).toMatchObject({ status: 'active', isClosed: true, notes: 'At close' });
		await expect(gardens.update(created.id, { name: 'Blocked' })).rejects.toMatchObject({ code: 'GARDEN_READ_ONLY' });
		await lifecycle.reopen(closed.id, expected(closed));
		expect(await gardens.getById(created.id)).toMatchObject({ status: 'active', isClosed: false, notes: 'At close' });
	});

	it('archives atomically and unarchives to an open Completed Garden', async () => {
		const created = await gardens.create(input);
		await lifecycle.archive(created.id, expected(created));
		const archived = await gardens.getById(created.id);
		expect(archived).toMatchObject({ status: 'archived', isClosed: true, updatedAt: UPDATED });
		await expect(gardens.update(created.id, { name: 'Blocked' })).rejects.toMatchObject({ code: 'GARDEN_READ_ONLY' });
		await lifecycle.unarchive(archived.id, expected(archived));
		expect(await gardens.getById(created.id)).toMatchObject({ status: 'completed', isClosed: false });
	});

	it('preserves independent Note and list associations across lifecycle changes', async () => {
		const created = await gardens.create(input);
		const notes = createNotesService(storage.repositories.notes, { now: () => CREATED });
		const lists = createListItemsService(storage.repositories.listItems, { now: () => CREATED });
		const note = await notes.create({ text: 'Linked note', gardenId: created.id });
		const task = await lists.create('task', { text: 'Linked task', gardenId: created.id });
		await lifecycle.complete(created.id, { close: true }, expected(created));
		const completed = await gardens.getById(created.id);
		expect((await notes.getById(note.id)).gardenId).toBe(created.id);
		expect((await lists.getById(task.id)).gardenId).toBe(created.id);
		await lifecycle.reopen(completed.id, expected(completed));
		const reopened = await gardens.getById(created.id);
		await lifecycle.archive(reopened.id, expected(reopened));
		expect((await notes.getById(note.id)).gardenId).toBe(created.id);
		expect((await lists.getById(task.id)).gardenId).toBe(created.id);
	});

	it('rejects missing, invalid, stale, duplicate, and unsupported transitions without partial writes', async () => {
		const created = await gardens.create(input);
		expect(await lifecycle.archive(MISSING, { status: 'planned', isClosed: false })).toBe(false);
		expect(() => lifecycle.setStatus(created.id, 'completed', expected(created)))
			.toThrow(expect.objectContaining({ code: 'INVALID_GARDEN_TRANSITION' }));
		await expect(lifecycle.reopen(created.id, expected(created))).rejects.toMatchObject({ code: 'INVALID_GARDEN_TRANSITION' });
		await lifecycle.setStatus(created.id, 'active', expected(created));
		await expect(lifecycle.archive(created.id, expected(created))).rejects.toMatchObject({ code: 'STALE_GARDEN_LIFECYCLE' });
		const active = await gardens.getById(created.id);
		await expect(lifecycle.setStatus(created.id, 'active', expected(active))).rejects.toMatchObject({ code: 'INVALID_GARDEN_TRANSITION' });
		expect(await gardens.getById(created.id)).toEqual(active);
	});

	it('rolls back lifecycle writes on storage failure and guards concurrent requests', async () => {
		const created = await gardens.create(input);
		const first = createGardenLifecycleService(storage.repositories.gardens, { now: () => UPDATED });
		const second = createGardenLifecycleService(storage.repositories.gardens, { now: () => '2026-11-07T14:00:00.000Z' });
		await first.setStatus(created.id, 'active', expected(created));
		await expect(second.archive(created.id, expected(created))).rejects.toMatchObject({ code: 'STALE_GARDEN_LIFECYCLE' });

		const active = await gardens.getById(created.id);
		const fail = vi.fn(() => { throw new Error('simulated disk error'); });
		const hooked = await initializeDexieStorage({ dependencies, openGarden: async () => {
			const db = createGardenDatabase(storage.databaseName, dependencies);
			await db.open();
			db.table('gardens').hook('updating', fail);
			return db;
		} });
		try {
			const failingLifecycle = createGardenLifecycleService(hooked.repositories.gardens, { now: () => UPDATED });
			await expect(failingLifecycle.close(active.id, {}, expected(active))).rejects.toBeInstanceOf(StorageError);
			expect(fail).toHaveBeenCalled();
		} finally {
			hooked.close();
		}
		expect(await gardens.getById(created.id)).toEqual(active);
	});
});
