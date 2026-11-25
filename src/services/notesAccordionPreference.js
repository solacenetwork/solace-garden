export const NOTES_ACCORDION_STORAGE_KEY = 'solace-garden.notes.accordion-state';

export const DEFAULT_NOTES_ACCORDION_STATE = Object.freeze({
	notes: true,
	gardens: Object.freeze({}),
});

function normalizePreference(value) {
	if (!value || Object.getPrototypeOf(value) !== Object.prototype) {
		return { notes: true, gardens: {} };
	}

	const gardens = value.gardens && Object.getPrototypeOf(value.gardens) === Object.prototype
		? Object.fromEntries(Object.entries(value.gardens).filter(([, expanded]) => typeof expanded === 'boolean'))
		: {};

	return {
		notes: typeof value.notes === 'boolean' ? value.notes : true,
		gardens,
	};
}

export function readNotesAccordionPreference(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const stored = availableStorage?.getItem(NOTES_ACCORDION_STORAGE_KEY);
		return stored ? normalizePreference(JSON.parse(stored)) : { notes: true, gardens: {} };
	} catch {
		return { notes: true, gardens: {} };
	}
}

export function writeNotesAccordionPreference(preference, storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		if (!availableStorage) return false;
		availableStorage.setItem(NOTES_ACCORDION_STORAGE_KEY, JSON.stringify(normalizePreference(preference)));
		return true;
	} catch {
		return false;
	}
}
