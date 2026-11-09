import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftAutosave } from './draftAutosave.js';
import {
	createGardenDraftsService, gardenInputFromDraftFields,
} from './gardenDrafts.js';
import { createGardensService } from './gardens.js';
import { createNoteDraftsService } from './notes.js';
import { createLocationsService, DEFAULT_LOCATION_ID } from './locations.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';

const FIRST_DRAFT = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const SECOND_DRAFT = 'fe1cbe08-4384-4dfa-9357-4ed87eea0398';
const NOTE_DRAFT = 'c707274f-b57b-4b1a-9346-a3c16f00008f';
const SOURCE_TEMPLATE = '550e8400-e29b-41d4-a716-446655440010';
const CREATED = '2026-11-07T18:00:00.000Z';
const UPDATED = '2026-11-07T18:05:00.000Z';

function fields(overrides = {}) {
	return {
		name: 'Tomatoes', subtitle: '', description: '', locationId: DEFAULT_LOCATION_ID,
		typeIds: [], startDate: '', endDate: '', ...overrides,
	};
}

describe('Recoverable Garden drafts', () => {
	let dependencies, storage, drafts, gardens, notes;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		drafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED, randomUUID: () => FIRST_DRAFT,
		});
		gardens = createGardensService(storage.repositories.gardens, { now: () => UPDATED });
		notes = createNoteDraftsService(storage.repositories.drafts, { now: () => CREATED });
	});
	afterEach(async () => {
		storage?.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	it('keeps Note and Garden contracts isolated in the shared store', async () => {
		await notes.save({ id: NOTE_DRAFT, text: 'Note work' });
		const gardenDraft = await drafts.create();

		expect((await notes.list()).map(({ id }) => id)).toEqual([NOTE_DRAFT]);
		expect((await drafts.list()).map(({ id }) => id)).toEqual([FIRST_DRAFT]);
		await expect(drafts.getById(NOTE_DRAFT)).rejects.toMatchObject({ code: 'WRONG_DRAFT_KIND' });
		await expect(notes.getById(FIRST_DRAFT)).rejects.toMatchObject({ code: 'WRONG_DRAFT_KIND' });
		await expect(notes.save({ id: FIRST_DRAFT, text: 'Must not overwrite' }))
			.rejects.toMatchObject({ code: 'WRONG_DRAFT_KIND' });
		await expect(notes.remove(FIRST_DRAFT)).rejects.toMatchObject({ code: 'WRONG_DRAFT_KIND' });
		expect(await drafts.getById(FIRST_DRAFT)).toEqual(gardenDraft);
	});

	it('restores multiple independent structured drafts and returns defensive copies', async () => {
		await drafts.create();
		const first = await drafts.save({ id: FIRST_DRAFT, fields: fields({ typeIds: ['outdoor'] }) });
		const secondService = createGardenDraftsService(storage.repositories.drafts, {
			now: () => UPDATED, randomUUID: () => SECOND_DRAFT,
		});
		await secondService.create();
		const second = await secondService.save({ id: SECOND_DRAFT, fields: fields({ name: '', typeIds: ['container'] }) });
		first.fields.typeIds.push('indoor');
		const listed = await drafts.list();
		listed[0].fields.typeIds.push('greenhouse');
		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		drafts = createGardenDraftsService(storage.repositories.drafts);

		expect(await drafts.getById(FIRST_DRAFT)).toMatchObject({ fields: { typeIds: ['outdoor'] } });
		expect(await drafts.getById(SECOND_DRAFT)).toEqual(second);
		expect(await drafts.list()).toHaveLength(2);
	});

	it('persists Garden-only editor context and preserves it through field-only saves and reopen', async () => {
		const created = await drafts.create({ preferredEditor: 'advanced' });
		expect(created).toMatchObject({ sourceTemplateId: null, preferredEditor: 'advanced' });
		await drafts.save({
			id: created.id,
			fields: fields({ name: 'Template fields' }),
			sourceTemplateId: SOURCE_TEMPLATE,
			preferredEditor: 'advanced',
		});
		await drafts.save({ id: created.id, fields: fields({ name: 'Gardener edit' }) });

		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		drafts = createGardenDraftsService(storage.repositories.drafts);
		expect(await drafts.getById(created.id)).toMatchObject({
			fields: { name: 'Gardener edit' },
			sourceTemplateId: SOURCE_TEMPLATE,
			preferredEditor: 'advanced',
		});
	});

	it('normalizes legacy Garden drafts without metadata while leaving Note drafts unchanged', async () => {
		await storage.repositories.drafts.add({
			id: FIRST_DRAFT,
			kind: 'garden',
			subjectId: null,
			isNew: true,
			fields: fields(),
			createdAt: CREATED,
			updatedAt: CREATED,
		});
		const legacy = await drafts.getById(FIRST_DRAFT);
		expect(legacy).toMatchObject({ sourceTemplateId: null, preferredEditor: 'wizard' });

		const note = await notes.save({ id: NOTE_DRAFT, text: 'Note work' });
		expect(note).not.toHaveProperty('sourceTemplateId');
		expect(note).not.toHaveProperty('preferredEditor');
		await expect(storage.repositories.drafts.save({ ...note, preferredEditor: 'advanced' }))
			.rejects.toMatchObject({ code: 'UNSUPPORTED_DRAFT_FIELD', field: 'preferredEditor' });
	});

	it('validates Garden draft editor context without requiring a schema migration', async () => {
		await expect(drafts.create({ preferredEditor: 'grid' }))
			.rejects.toMatchObject({ code: 'INVALID_GARDEN_DRAFT_EDITOR', field: 'preferredEditor' });
		await drafts.create();
		await expect(drafts.save({ id: FIRST_DRAFT, fields: fields(), sourceTemplateId: 'not-a-uuid' }))
			.rejects.toMatchObject({ code: 'INVALID_RECORD_ID', field: 'sourceTemplateId' });
	});

	it('discards only the selected Garden draft', async () => {
		await drafts.create();
		const secondDrafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED, randomUUID: () => SECOND_DRAFT,
		});
		const retained = await secondDrafts.create();
		await notes.save({ id: NOTE_DRAFT, text: 'Keep Note draft' });

		expect(await drafts.remove(FIRST_DRAFT)).toBe(true);
		expect(await drafts.getById(FIRST_DRAFT)).toBeNull();
		expect(await drafts.getById(SECOND_DRAFT)).toEqual(retained);
		expect((await notes.list()).map(({ id }) => id)).toEqual([NOTE_DRAFT]);
	});

	it('creates a Garden and consumes only its own draft atomically', async () => {
		await drafts.create();
		const draft = await drafts.save({
			id: FIRST_DRAFT,
			fields: fields({ name: '  Kitchen Garden  ', subtitle: ' South ', typeIds: ['indoor', 'container'] }),
		});
		await notes.save({ id: NOTE_DRAFT, text: 'Keep this Note draft' });
		const retainedService = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED, randomUUID: () => SECOND_DRAFT,
		});
		await retainedService.create();
		const retained = await retainedService.save({ id: SECOND_DRAFT, fields: fields({ name: 'Other' }) });

		const garden = await gardens.createFromDraft(gardenInputFromDraftFields(draft.fields), FIRST_DRAFT);
		expect(garden).toMatchObject({
			name: 'Kitchen Garden', subtitle: 'South', locationId: DEFAULT_LOCATION_ID,
			typeIds: ['indoor', 'container'], status: 'planned', isClosed: false,
			startDate: null, endDate: null, notes: null, icon: null, color: null,
			thumbnailMediaId: null, layoutMediaId: null,
		});
		expect(garden.id).not.toBe(FIRST_DRAFT);
		expect(garden).not.toHaveProperty('sourceTemplateId');
		expect(garden).not.toHaveProperty('preferredEditor');
		expect(await drafts.getById(FIRST_DRAFT)).toBeNull();
		expect(await drafts.getById(SECOND_DRAFT)).toEqual(retained);
		expect((await notes.list()).map(({ id }) => id)).toEqual([NOTE_DRAFT]);
	});

	it('preserves invalid drafts and rejects wrong-kind or repeated finalization', async () => {
		await drafts.create();
		const blank = await drafts.save({ id: FIRST_DRAFT, fields: fields({ name: '  ' }) });
		await expect(gardens.createFromDraft(gardenInputFromDraftFields(blank.fields), FIRST_DRAFT))
			.rejects.toMatchObject({ code: 'INVALID_GARDEN_NAME' });
		expect(await drafts.getById(FIRST_DRAFT)).toEqual(blank);
		await notes.save({ id: NOTE_DRAFT, text: 'Not a Garden draft' });
		await expect(gardens.createFromDraft(gardenInputFromDraftFields(fields()), NOTE_DRAFT))
			.rejects.toMatchObject({ code: 'WRONG_DRAFT_KIND' });

		const valid = await drafts.save({ id: FIRST_DRAFT, fields: fields() });
		await gardens.createFromDraft(gardenInputFromDraftFields(valid.fields), FIRST_DRAFT);
		await expect(gardens.createFromDraft(gardenInputFromDraftFields(valid.fields), FIRST_DRAFT))
			.rejects.toMatchObject({ code: 'GARDEN_DRAFT_NOT_FOUND' });
		expect(await gardens.list()).toHaveLength(1);
	});

	it('rejects invalid dates while retaining the correctable draft', async () => {
		await drafts.create();
		const draft = await drafts.getById(FIRST_DRAFT);
		for (const invalid of [
			fields({ startDate: '2026-02-29' }),
			fields({ startDate: '2026-03-02', endDate: '2026-03-01' }),
		]) {
			await expect(gardens.createFromDraft(gardenInputFromDraftFields(invalid), FIRST_DRAFT))
				.rejects.toBeInstanceOf(Error);
			expect(await drafts.getById(FIRST_DRAFT)).toEqual(draft);
		}
		expect(await gardens.list()).toEqual([]);
	});

	it('supports renamed Default and custom Locations, optional types, and duplicate names', async () => {
		const locations = createLocationsService(storage.repositories.locations, { now: () => CREATED });
		await locations.update(DEFAULT_LOCATION_ID, { name: 'Home Farm' });
		const custom = await locations.create({ name: 'Community Garden' });
		await drafts.create();
		const firstFields = fields({ name: 'Same Name', typeIds: [] });
		await drafts.save({ id: FIRST_DRAFT, fields: firstFields });
		const first = await gardens.createFromDraft(gardenInputFromDraftFields(firstFields), FIRST_DRAFT);

		const secondDrafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED, randomUUID: () => SECOND_DRAFT,
		});
		await secondDrafts.create();
		const secondFields = fields({
			name: 'Same Name', locationId: custom.id, typeIds: ['outdoor', 'container'],
		});
		await secondDrafts.save({ id: SECOND_DRAFT, fields: secondFields });
		const second = await gardens.createFromDraft(gardenInputFromDraftFields(secondFields), SECOND_DRAFT);

		expect(first).toMatchObject({ locationId: DEFAULT_LOCATION_ID, typeIds: [] });
		expect(second).toMatchObject({ locationId: custom.id, typeIds: ['outdoor', 'container'] });
		expect(second.id).not.toBe(first.id);
	});

	it('serializes concurrent finalization so only one Garden is created', async () => {
		await drafts.create();
		const draft = await drafts.save({ id: FIRST_DRAFT, fields: fields() });
		const results = await Promise.allSettled([
			gardens.createFromDraft(gardenInputFromDraftFields(draft.fields), FIRST_DRAFT),
			gardens.createFromDraft(gardenInputFromDraftFields(draft.fields), FIRST_DRAFT),
		]);
		expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
		expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
		expect(await gardens.list()).toHaveLength(1);
	});

	it('rolls back the Garden insert when draft cleanup fails', async () => {
		await drafts.create();
		const draft = await drafts.save({ id: FIRST_DRAFT, fields: fields() });
		const failDelete = vi.fn(() => { throw new Error('simulated draft deletion failure'); });
		const hooked = await initializeDexieStorage({
			dependencies,
			openGarden: async () => {
				const database = createGardenDatabase(storage.databaseName, dependencies);
				await database.open();
				database.table('drafts').hook('deleting', failDelete);
				return database;
			},
		});
		try {
			const hookedGardens = createGardensService(hooked.repositories.gardens, { now: () => UPDATED });
			await expect(hookedGardens.createFromDraft(gardenInputFromDraftFields(draft.fields), FIRST_DRAFT))
				.rejects.toMatchObject({ code: 'STORAGE_OPERATION_FAILED' });
			expect(failDelete).toHaveBeenCalledOnce();
			expect(await gardens.list()).toEqual([]);
			expect(await drafts.getById(FIRST_DRAFT)).toEqual(draft);
		} finally {
			hooked.close();
		}
	});

	it('waits out an autosave before finalization so it cannot recreate a consumed draft', async () => {
		await drafts.create();
		await drafts.save({ id: FIRST_DRAFT, fields: fields({ name: 'Original' }) });
		let release;
		const blocked = new Promise((resolve) => { release = resolve; });
		const write = vi.fn(async (value) => {
			await blocked;
			await drafts.save({ id: FIRST_DRAFT, fields: value, createdAt: CREATED });
		});
		const autosave = createDraftAutosave({ write, onStatus() {} });
		autosave.schedule(fields({ name: 'Older pending value' }));
		const flushing = autosave.flush();
		await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
		const stopping = autosave.stop();
		release();
		await flushing;
		await stopping;
		const latest = fields({ name: 'Final value' });
		await drafts.save({ id: FIRST_DRAFT, fields: latest, createdAt: CREATED });
		await gardens.createFromDraft(gardenInputFromDraftFields(latest), FIRST_DRAFT);
		await Promise.resolve();

		expect(await drafts.getById(FIRST_DRAFT)).toBeNull();
		await expect(drafts.save({ id: FIRST_DRAFT, fields: fields({ name: 'Stale write' }), createdAt: CREATED }))
			.rejects.toMatchObject({ code: 'DRAFT_NOT_FOUND' });
		expect(await gardens.list()).toHaveLength(1);
	});
});
