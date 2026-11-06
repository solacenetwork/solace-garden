import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTROL_DATABASE_NAME } from '../storage/dexie/constants.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { StorageError, ValidationError } from '../storage/index.js';
import { createNotesService } from './notes.js';

const DATABASE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const NOTE_UUID_ONE = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const NOTE_UUID_TWO = '3d18c8af-06ea-4b7d-8bd8-c450f3e2bd4d';
const NOTE_UUID_THREE = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const NOTE_UUID_FOUR = 'fe1cbe08-4384-4dfa-9357-4ed87eea0398';
const GARDEN_UUID = '210b8b0f-030c-4220-9374-8b78f461b474';
const MISSING_GARDEN_UUID = '6934b241-739d-45a6-840b-ea2461fae984';
const CREATED_AT = '2026-11-05T14:00:00.000Z';
const UPDATED_AT = '2026-11-05T15:30:00.000Z';

describe('Notes domain service', () => {
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

	async function initialize(noteIds = []) {
		const uuids = [DATABASE_UUID, ...noteIds];
		const storage = await initializeDexieStorage({
			dependencies,
			randomUUID: vi.fn(() => uuids.shift()),
		});

		expect(storage.status).toBe('ready');
		createdDatabases.add(storage.databaseName);
		return storage;
	}

	async function seedGarden(databaseName) {
		const database = createGardenDatabase(databaseName, dependencies);
		await database.open();
		await database.table('gardens').add({
			id: GARDEN_UUID,
			name: 'Kitchen Garden',
			status: 'active',
			updatedAt: CREATED_AT,
		});
		database.close();
	}

	it('preserves multiline plain text and returns Notes newest-updated first', async () => {
		const storage = await initialize([NOTE_UUID_ONE, NOTE_UUID_TWO]);
		const now = vi.fn()
			.mockReturnValueOnce(CREATED_AT)
			.mockReturnValueOnce(UPDATED_AT);
		const notes = createNotesService(storage.repositories.notes, { now });
		const multilineText = '  First line\n\nSecond line with spacing  ';

		const first = await notes.create({ text: multilineText });
		const second = await notes.create({ text: 'A newer Note' });

		expect(first).toEqual({
			id: NOTE_UUID_ONE,
			text: multilineText,
			gardenId: null,
			createdAt: CREATED_AT,
			updatedAt: CREATED_AT,
		});
		expect(await notes.list()).toEqual([second, first]);

		storage.close();
	});

	it('rejects blank text without changing an existing Note', async () => {
		const storage = await initialize([
			NOTE_UUID_ONE,
			NOTE_UUID_TWO,
			NOTE_UUID_THREE,
			NOTE_UUID_FOUR,
		]);
		const notes = createNotesService(storage.repositories.notes, {
			now: () => CREATED_AT,
		});
		const original = await notes.create({ text: 'Keep this text' });

		for (const text of ['', '   ', '\n\t']) {
			await expect(notes.create({ text })).rejects.toMatchObject({
				name: 'ValidationError',
				code: 'INVALID_NOTE_TEXT',
			});
		}
		await expect(notes.update(original.id, { text: ' \n ' })).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(await notes.getById(original.id)).toEqual(original);

		storage.close();
	});

	it('preserves identity and creation time while updating text and update time', async () => {
		const storage = await initialize([NOTE_UUID_ONE]);
		const now = vi.fn()
			.mockReturnValueOnce(CREATED_AT)
			.mockReturnValueOnce(UPDATED_AT);
		const notes = createNotesService(storage.repositories.notes, { now });
		const created = await notes.create({ text: 'Original text' });

		expect(await notes.update(created.id, { text: 'Edited text' })).toEqual({
			text: 'Edited text',
			updatedAt: UPDATED_AT,
		});
		expect(await notes.getById(created.id)).toEqual({
			...created,
			text: 'Edited text',
			updatedAt: UPDATED_AT,
		});

		storage.close();
	});

	it('accepts only existing garden associations and supports unlinking', async () => {
		const storage = await initialize([NOTE_UUID_ONE, NOTE_UUID_TWO]);
		await seedGarden(storage.databaseName);
		const notes = createNotesService(storage.repositories.notes, {
			now: () => CREATED_AT,
		});
		const linked = await notes.create({
			text: 'Linked observation',
			gardenId: GARDEN_UUID,
		});

		expect(linked.gardenId).toBe(GARDEN_UUID);
		await notes.update(linked.id, { text: 'Updated linked observation' });
		expect((await notes.getById(linked.id)).gardenId).toBe(GARDEN_UUID);
		await expect(notes.create({
			text: 'Invalid link',
			gardenId: MISSING_GARDEN_UUID,
		})).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'GARDEN_NOT_FOUND',
			field: 'gardenId',
		});
		expect(await notes.update(linked.id, { gardenId: null })).toMatchObject({
			gardenId: null,
		});
		expect((await notes.getById(linked.id)).gardenId).toBeNull();

		storage.close();
	});

	it('deletes only the selected Note and leaves unrelated data intact', async () => {
		const storage = await initialize([NOTE_UUID_ONE, NOTE_UUID_TWO]);
		await seedGarden(storage.databaseName);
		const notes = createNotesService(storage.repositories.notes, {
			now: () => CREATED_AT,
		});
		const removed = await notes.create({ text: 'Remove me' });
		const retained = await notes.create({ text: 'Keep me', gardenId: GARDEN_UUID });

		expect(await notes.remove(removed.id)).toBe(true);
		expect(await notes.list()).toEqual([retained]);

		const database = createGardenDatabase(storage.databaseName, dependencies);
		await database.open();
		expect(await database.table('gardens').get(GARDEN_UUID)).toMatchObject({
			name: 'Kitchen Garden',
		});
		database.close();
		storage.close();
	});

	it('persists Notes after closing and reopening the active database', async () => {
		const firstStorage = await initialize([NOTE_UUID_ONE]);
		const notes = createNotesService(firstStorage.repositories.notes, {
			now: () => CREATED_AT,
		});
		const created = await notes.create({ text: 'Still here after reopen' });
		const databaseName = firstStorage.databaseName;
		firstStorage.close();

		const reopened = await initializeDexieStorage({
			dependencies,
			randomUUID: vi.fn(() => {
				throw new Error('A healthy reopen must not generate a UUID.');
			}),
		});
		const reopenedNotes = createNotesService(reopened.repositories.notes);

		expect(reopened.status).toBe('ready');
		expect(reopened.databaseName).toBe(databaseName);
		expect(await reopenedNotes.getById(created.id)).toEqual(created);
		reopened.close();
	});

	it('surfaces storage failures without overwriting the saved Note', async () => {
		const storage = await initialize([NOTE_UUID_ONE]);
		const notes = createNotesService(storage.repositories.notes, {
			now: vi.fn()
				.mockReturnValueOnce(CREATED_AT)
				.mockReturnValueOnce(UPDATED_AT),
		});
		const created = await notes.create({ text: 'Preserve on failure' });
		storage.close();

		await expect(notes.update(created.id, { text: 'Do not persist' })).rejects.toBeInstanceOf(
			StorageError,
		);

		const reopened = await initializeDexieStorage({ dependencies });
		expect(await reopened.repositories.notes.getById(created.id)).toEqual(created);
		reopened.close();
	});
});
