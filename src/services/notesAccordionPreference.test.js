import { describe, expect, it, vi } from 'vitest';
import {
	NOTES_ACCORDION_STORAGE_KEY, readNotesAccordionPreference, writeNotesAccordionPreference,
} from './notesAccordionPreference.js';

function memoryStorage(initial = {}) {
	const values = new Map(Object.entries(initial));
	return {
		getItem: vi.fn((key) => values.get(key) ?? null),
		setItem: vi.fn((key, value) => values.set(key, value)),
		values,
	};
}

describe('Notes accordion preference', () => {
	it('defaults application Notes open and Garden groups closed', () => {
		expect(readNotesAccordionPreference(memoryStorage())).toEqual({ notes: true, gardens: {} });
	});

	it('persists independent states using Garden UUID keys', () => {
		const storage = memoryStorage();
		const preference = { notes: false, gardens: { 'garden-uuid': true, 'other-uuid': false } };
		expect(writeNotesAccordionPreference(preference, storage)).toBe(true);
		expect(storage.setItem).toHaveBeenCalledWith(NOTES_ACCORDION_STORAGE_KEY, JSON.stringify(preference));
		expect(readNotesAccordionPreference(storage)).toEqual(preference);
	});

	it('ignores malformed values and fails safely when storage is unavailable', () => {
		const malformed = memoryStorage({
			[NOTES_ACCORDION_STORAGE_KEY]: JSON.stringify({ notes: 'yes', gardens: { good: true, bad: 'yes' } }),
		});
		expect(readNotesAccordionPreference(malformed)).toEqual({ notes: true, gardens: { good: true } });
		const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
		expect(readNotesAccordionPreference(unavailable)).toEqual({ notes: true, gardens: {} });
		expect(writeNotesAccordionPreference({ notes: false, gardens: {} }, unavailable)).toBe(false);
	});
});
