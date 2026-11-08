import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTROL_DATABASE_NAME } from '../storage/dexie/constants.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { createDraftAutosave } from './draftAutosave.js';
import { createNoteDraftsService, createNotesService } from './notes.js';

const DATABASE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const NOTE_ID = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const OTHER_NOTE_ID = '3d18c8af-06ea-4b7d-8bd8-c450f3e2bd4d';
const DRAFT_ID = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const OTHER_DRAFT_ID = 'fe1cbe08-4384-4dfa-9357-4ed87eea0398';
const TIME = '2026-11-05T14:00:00.000Z';
const GARDEN_ID = '210b8b0f-030c-4220-9374-8b78f461b474';

describe('Recoverable Note drafts', () => {
	let indexedDB;
	let dependencies;
	let databaseNames;

	beforeEach(() => {
		indexedDB = new IDBFactory();
		dependencies = { indexedDB, IDBKeyRange };
		databaseNames = new Set([CONTROL_DATABASE_NAME]);
	});

	afterEach(async () => {
		await Promise.all(Array.from(databaseNames, (name) => new Dexie(name, dependencies).delete()));
	});

	async function open(noteIds = []) {
		const ids = [DATABASE_UUID, ...noteIds];
		const storage = await initializeDexieStorage({ dependencies, randomUUID: () => ids.shift() });
		databaseNames.add(storage.databaseName);
		return storage;
	}

	function services(storage) {
		return {
			notes: createNotesService(storage.repositories.notes, { now: () => TIME }),
			drafts: createNoteDraftsService(storage.repositories.drafts, { now: () => TIME }),
		};
	}

	it('restores existing and multiple independent new drafts after reopen', async () => {
		const first = await open([NOTE_ID]);
		const { notes, drafts } = services(first);
		await notes.create({ text: 'Saved text' });
		await drafts.save({ id: DRAFT_ID, noteId: NOTE_ID, text: 'Existing draft' });
		await drafts.save({ id: OTHER_DRAFT_ID, text: 'Independent new draft' });
		first.close();

		const reopened = await initializeDexieStorage({ dependencies });
		const reopenedDrafts = services(reopened).drafts;
		expect(await reopenedDrafts.getForNote(NOTE_ID)).toMatchObject({ id: DRAFT_ID, text: 'Existing draft', isNew: false });
		expect(await reopenedDrafts.getById(OTHER_DRAFT_ID)).toMatchObject({ text: 'Independent new draft', isNew: true });
		expect(await reopenedDrafts.list()).toHaveLength(2);
		reopened.close();
	});

	it('atomically saves authoritative content and removes its draft', async () => {
		const storage = await open([NOTE_ID]);
		const { notes, drafts } = services(storage);
		await notes.create({ text: 'Saved text' });
		await drafts.save({ id: DRAFT_ID, noteId: NOTE_ID, text: 'Draft text' });

		await notes.update(NOTE_ID, { text: 'Committed text' }, { draftId: DRAFT_ID });
		expect(await notes.getById(NOTE_ID)).toMatchObject({ text: 'Committed text' });
		expect(await drafts.getById(DRAFT_ID)).toBeNull();
		storage.close();
	});

	it('creates a new authoritative Note and clears only its temporary draft', async () => {
		const storage = await open([NOTE_ID]);
		const { notes, drafts } = services(storage);
		await drafts.save({ id: DRAFT_ID, text: 'New recoverable draft' });
		const retained = await drafts.save({ id: OTHER_DRAFT_ID, text: 'Another draft' });

		const created = await notes.create({ text: 'New recoverable draft' }, { draftId: DRAFT_ID });
		expect(created).toMatchObject({ id: NOTE_ID, text: 'New recoverable draft' });
		expect(await drafts.getById(DRAFT_ID)).toBeNull();
		expect(await drafts.getById(OTHER_DRAFT_ID)).toEqual(retained);
		storage.close();
	});

	it('preserves a draft when authoritative Save validation fails', async () => {
		const storage = await open([NOTE_ID]);
		const { notes, drafts } = services(storage);
		await notes.create({ text: 'Saved text' });
		const draft = await drafts.save({ id: DRAFT_ID, noteId: NOTE_ID, text: '   ' });

		await expect(notes.update(NOTE_ID, { text: '   ' }, { draftId: DRAFT_ID })).rejects.toMatchObject({ code: 'INVALID_NOTE_TEXT' });
		expect(await drafts.getById(DRAFT_ID)).toEqual(draft);
		expect(await notes.getById(NOTE_ID)).toMatchObject({ text: 'Saved text' });
		storage.close();
	});

	it('keeps a recoverable text draft when only the saved Note association changes', async () => {
		const storage = await open([NOTE_ID]);
		const { notes, drafts } = services(storage);
		await notes.create({ text: 'Saved text' });
		const draft = await drafts.save({ id: DRAFT_ID, noteId: NOTE_ID, text: 'Unsaved text' });
		const database = createGardenDatabase(storage.databaseName, { indexedDB, IDBKeyRange });
		await database.open();
		await database.table('gardens').add({ id: GARDEN_ID, name: 'Garden', status: 'active' });
		database.close();

		await notes.update(NOTE_ID, { gardenId: GARDEN_ID });
		expect(await notes.getById(NOTE_ID)).toMatchObject({ text: 'Saved text', gardenId: GARDEN_ID });
		expect(await drafts.getById(DRAFT_ID)).toEqual(draft);
		storage.close();
	});

	it('discard removes only the selected draft', async () => {
		const storage = await open();
		const { drafts } = services(storage);
		await drafts.save({ id: DRAFT_ID, text: 'Discard me' });
		const retained = await drafts.save({ id: OTHER_DRAFT_ID, text: 'Keep me' });

		expect(await drafts.remove(DRAFT_ID)).toBe(true);
		expect(await drafts.getById(DRAFT_ID)).toBeNull();
		expect(await drafts.getById(OTHER_DRAFT_ID)).toEqual(retained);
		storage.close();
	});

	it('deleting a Note also removes only its associated draft', async () => {
		const storage = await open([NOTE_ID, OTHER_NOTE_ID]);
		const { notes, drafts } = services(storage);
		await notes.create({ text: 'Delete me' });
		await notes.create({ text: 'Keep me' });
		await drafts.save({ id: DRAFT_ID, noteId: NOTE_ID, text: 'Delete draft' });
		const retained = await drafts.save({ id: OTHER_DRAFT_ID, noteId: OTHER_NOTE_ID, text: 'Keep draft' });

		await notes.remove(NOTE_ID);
		expect(await drafts.getById(DRAFT_ID)).toBeNull();
		expect(await drafts.getById(OTHER_DRAFT_ID)).toEqual(retained);
		expect(await notes.getById(OTHER_NOTE_ID)).toMatchObject({ text: 'Keep me' });
		storage.close();
	});
});

describe('Draft autosave sequencing', () => {
	it('debounces to the latest value and serializes writes', async () => {
		let resolveFirst;
		const write = vi.fn()
			.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
			.mockResolvedValueOnce(undefined);
		const statuses = [];
		const autosave = createDraftAutosave({ write, onStatus: (status) => statuses.push(status) });

		autosave.schedule('older');
		const first = autosave.flush();
		await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
		autosave.schedule('newest');
		const second = autosave.flush();
		expect(write).toHaveBeenCalledTimes(1);

		resolveFirst();
		await first;
		await second;
		expect(write.mock.calls.map(([value]) => value)).toEqual(['older', 'newest']);
		expect(statuses.at(-1)).toBe('draft-saved');
	});

	it('reports failed persistence without claiming the draft was saved', async () => {
		const statuses = [];
		const autosave = createDraftAutosave({ write: vi.fn().mockRejectedValue(new Error('failed')), onStatus: (status) => statuses.push(status) });
		autosave.schedule('unsaved');
		await autosave.flush();
		expect(statuses).toEqual(['saving', 'error']);
	});
});
