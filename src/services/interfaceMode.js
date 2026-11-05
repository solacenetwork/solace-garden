export const INTERFACE_MODE_STORAGE_KEY = 'solace-garden.interface-mode';
export const SIMPLE_MODE_MEDIA_QUERY = '(max-width: 47.999rem)';
export const DEFAULT_INTERFACE_MODE = 'auto';

export const interfaceModes = ['auto', 'simple', 'standard'];

export function isInterfaceMode(value) {
	return interfaceModes.includes(value);
}

export function readInterfaceMode(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const storedPreference = availableStorage?.getItem(INTERFACE_MODE_STORAGE_KEY);

		return {
			preference: isInterfaceMode(storedPreference)
				? storedPreference
				: DEFAULT_INTERFACE_MODE,
			storageAvailable: Boolean(availableStorage),
		};
	} catch {
		return {
			preference: DEFAULT_INTERFACE_MODE,
			storageAvailable: false,
		};
	}
}

export function writeInterfaceMode(preference, storage) {
	if (!isInterfaceMode(preference)) {
		return false;
	}

	try {
		const availableStorage = storage ?? globalThis.localStorage;
		availableStorage?.setItem(INTERFACE_MODE_STORAGE_KEY, preference);
		return Boolean(availableStorage);
	} catch {
		return false;
	}
}

export function resolveInterfaceMode(preference, isNarrow) {
	if (preference === 'simple') {
		return 'simple';
	}

	if (preference === 'standard') {
		return 'standard';
	}

	return isNarrow ? 'simple' : 'standard';
}
