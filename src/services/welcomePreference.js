export const SHOW_WELCOME_STORAGE_KEY = 'solace-garden.show-welcome-at-startup';
export const DEFAULT_SHOW_WELCOME_AT_STARTUP = true;

export function readShowWelcomeAtStartup(storage) {
	try {
		const availableStorage = storage ?? globalThis.localStorage;
		const storedPreference = availableStorage?.getItem(SHOW_WELCOME_STORAGE_KEY);

		return {
			showWelcomeAtStartup: storedPreference === 'false'
				? false
				: DEFAULT_SHOW_WELCOME_AT_STARTUP,
			storageAvailable: Boolean(availableStorage),
		};
	} catch {
		return {
			showWelcomeAtStartup: DEFAULT_SHOW_WELCOME_AT_STARTUP,
			storageAvailable: false,
		};
	}
}

export function writeShowWelcomeAtStartup(showWelcomeAtStartup, storage) {
	if (typeof showWelcomeAtStartup !== 'boolean') return false;

	try {
		const availableStorage = storage ?? globalThis.localStorage;
		availableStorage?.setItem(SHOW_WELCOME_STORAGE_KEY, String(showWelcomeAtStartup));
		return Boolean(availableStorage);
	} catch {
		return false;
	}
}

export function resolveStartupPath(pathname, showWelcomeAtStartup) {
	return pathname === '/' && showWelcomeAtStartup ? '/welcome' : pathname;
}

export function applyWelcomeStartupPreference({
	location = globalThis.location,
	history = globalThis.history,
	storage,
} = {}) {
	if (!location || !history) return location?.pathname;

	const { showWelcomeAtStartup } = readShowWelcomeAtStartup(storage);
	const startupPath = resolveStartupPath(location.pathname, showWelcomeAtStartup);
	if (startupPath !== location.pathname) {
		history.replaceState(history.state ?? null, '', startupPath);
	}
	return startupPath;
}
