export const LIST_ACCORDION_STORAGE_KEY = 'solace-garden.lists.accordion-state';

export const DEFAULT_LIST_ACCORDION_STATE = Object.freeze({
	task: false,
	wishlist: false,
});

function normalizePreference(value) {
	if (!value || Object.getPrototypeOf(value) !== Object.prototype) {
		return { task: false, wishlist: false };
	}
	return {
		task: typeof value.task === 'boolean' ? value.task : false,
		wishlist: typeof value.wishlist === 'boolean' ? value.wishlist : false,
	};
}

export function readListAccordionPreference(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const stored = availableStorage?.getItem(LIST_ACCORDION_STORAGE_KEY);
		return stored ? normalizePreference(JSON.parse(stored)) : { task: false, wishlist: false };
	} catch {
		return { task: false, wishlist: false };
	}
}

export function writeListAccordionPreference(preference, storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		if (!availableStorage) return false;
		availableStorage.setItem(LIST_ACCORDION_STORAGE_KEY, JSON.stringify(normalizePreference(preference)));
		return true;
	} catch {
		return false;
	}
}
