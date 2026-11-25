import { describe, expect, it, vi } from 'vitest';
import {
	LIST_ACCORDION_STORAGE_KEY,
	readListAccordionPreference,
	writeListAccordionPreference,
} from './listAccordionPreference.js';

function memoryStorage(initial) {
	const values = new Map(initial ? [[LIST_ACCORDION_STORAGE_KEY, JSON.stringify(initial)]] : []);
	return {
		getItem: vi.fn((key) => values.get(key) ?? null),
		setItem: vi.fn((key, value) => values.set(key, value)),
	};
}

describe('Lists accordion preferences', () => {
	it('defaults both collections to collapsed', () => {
		expect(readListAccordionPreference(memoryStorage())).toEqual({ task: false, wishlist: false });
	});

	it('keeps Tasks and Wish List preferences independent', () => {
		const storage = memoryStorage({ task: true, wishlist: false });
		expect(readListAccordionPreference(storage)).toEqual({ task: true, wishlist: false });
		expect(writeListAccordionPreference({ task: false, wishlist: true }, storage)).toBe(true);
		expect(readListAccordionPreference(storage)).toEqual({ task: false, wishlist: true });
	});

	it('uses safe defaults for malformed or unavailable storage', () => {
		expect(readListAccordionPreference({
			getItem() { return '{bad json'; },
		})).toEqual({ task: false, wishlist: false });
		expect(writeListAccordionPreference({ task: true, wishlist: true }, null)).toBe(false);
	});
});
