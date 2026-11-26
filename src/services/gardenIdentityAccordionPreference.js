export const GARDEN_IDENTITY_ACCORDION_STORAGE_KEY = 'solace-garden.garden-identity.accordion-state';

export const DEFAULT_GARDEN_IDENTITY_ACCORDION_STATE = Object.freeze({
	icon: false,
	color: false,
});

function normalizePreference(value) {
	if (!value || Object.getPrototypeOf(value) !== Object.prototype) {
		return { ...DEFAULT_GARDEN_IDENTITY_ACCORDION_STATE };
	}
	return {
		icon: typeof value.icon === 'boolean' ? value.icon : false,
		color: typeof value.color === 'boolean' ? value.color : false,
	};
}

export function readGardenIdentityAccordionPreference(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const stored = availableStorage?.getItem(GARDEN_IDENTITY_ACCORDION_STORAGE_KEY);
		return stored
			? normalizePreference(JSON.parse(stored))
			: { ...DEFAULT_GARDEN_IDENTITY_ACCORDION_STATE };
	} catch {
		return { ...DEFAULT_GARDEN_IDENTITY_ACCORDION_STATE };
	}
}

export function writeGardenIdentityAccordionPreference(preference, storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		if (!availableStorage) return false;
		availableStorage.setItem(
			GARDEN_IDENTITY_ACCORDION_STORAGE_KEY,
			JSON.stringify(normalizePreference(preference)),
		);
		return true;
	} catch {
		return false;
	}
}
