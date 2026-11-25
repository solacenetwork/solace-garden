import { describe, expect, it, vi } from 'vitest';
import {
	createNoteDraftPersistence, noteDraftFieldsEqual, noteDraftMatches,
} from './noteDraftLifecycle.js';

const DRAFT_ID = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const NOTE_ID = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const GARDEN_ID = '210b8b0f-030c-4220-9374-8b78f461b474';
const baseline = { text: 'Saved text', gardenId: null };

function draftRecord(fields, overrides = {}) {
	return {
		id: DRAFT_ID, kind: 'note', subjectId: NOTE_ID, isNew: false,
		...fields, createdAt: 'created', updatedAt: 'updated', ...overrides,
	};
}

describe('Note draft persistence lifecycle', () => {
	it('does not persist an untouched editor and establishes complete fields on first change', async () => {
		const drafts = { save: vi.fn(async (input) => draftRecord(input)), remove: vi.fn() };
		const onEstablished = vi.fn();
		const persistence = createNoteDraftPersistence({ drafts, draftId: DRAFT_ID, noteId: NOTE_ID, baseline, onEstablished });
		expect(drafts.save).not.toHaveBeenCalled();

		const fields = { text: 'Saved text', gardenId: GARDEN_ID };
		const saved = await persistence.persist(fields);
		expect(drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			id: DRAFT_ID, noteId: NOTE_ID, text: fields.text, gardenId: GARDEN_ID,
		}));
		expect(onEstablished).toHaveBeenCalledWith(saved);
		expect(persistence.getRecord()).toBe(saved);
	});

	it('removes an established draft after every editable field returns to baseline', async () => {
		const initialDraft = draftRecord({ text: 'Changed', gardenId: GARDEN_ID });
		const drafts = { save: vi.fn(), remove: vi.fn(async () => true) };
		const persistence = createNoteDraftPersistence({ drafts, draftId: DRAFT_ID, noteId: NOTE_ID, baseline, initialDraft });
		expect(await persistence.persist({ ...baseline })).toBeNull();
		expect(drafts.remove).toHaveBeenCalledWith(DRAFT_ID);
		expect(persistence.getRecord()).toBeNull();
	});

	it('retains its record when discard persistence fails', async () => {
		const initialDraft = draftRecord({ text: 'Changed', gardenId: null });
		const drafts = { remove: vi.fn(async () => { throw new Error('failed'); }) };
		const persistence = createNoteDraftPersistence({ drafts, draftId: DRAFT_ID, noteId: NOTE_ID, baseline, initialDraft });
		await expect(persistence.discard()).rejects.toThrow('failed');
		expect(persistence.getRecord()).toBe(initialDraft);
	});

	it('compares exact fields and stable draft identity for navigation handoff', () => {
		const fields = { text: 'Recovered', gardenId: GARDEN_ID };
		const draft = draftRecord(fields);
		expect(noteDraftFieldsEqual(fields, { ...fields })).toBe(true);
		expect(noteDraftMatches(draft, { draftId: DRAFT_ID, noteId: NOTE_ID, fields })).toBe(true);
		expect(noteDraftMatches({ ...draft, id: 'other' }, { draftId: DRAFT_ID, noteId: NOTE_ID, fields })).toBe(false);
	});
});
