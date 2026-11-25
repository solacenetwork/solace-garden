export const NOTES_ACCORDION_STORAGE_KEY = 'solace-garden.notes.accordion-state';

export const DEFAULT_NOTES_ACCORDION_STATE = Object.freeze({
	drafts: false,
	notes: true,
	gardens: Object.freeze({}),
});

function normalizePreference(value) {
	if (!value || Object.getPrototypeOf(value) !== Object.prototype) {
		return { drafts: false, notes: true, gardens: {} };
	}

	const gardens = value.gardens && Object.getPrototypeOf(value.gardens) === Object.prototype
		? Object.fromEntries(Object.entries(value.gardens).filter(([, expanded]) => typeof expanded === 'boolean'))
		: {};

	return {
		drafts: typeof value.drafts === 'boolean' ? value.drafts : false,
		notes: typeof value.notes === 'boolean' ? value.notes : true,
		gardens,
	};
}

export function readNotesAccordionPreference(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const stored = availableStorage?.getItem(NOTES_ACCORDION_STORAGE_KEY);
		return stored ? normalizePreference(JSON.parse(stored)) : { drafts: false, notes: true, gardens: {} };
	} catch {
		return { drafts: false, notes: true, gardens: {} };
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
