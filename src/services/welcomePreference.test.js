import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	applyWelcomeStartupPreference,
	DEFAULT_SHOW_WELCOME_AT_STARTUP,
	readShowWelcomeAtStartup,
	resolveStartupPath,
	SHOW_WELCOME_STORAGE_KEY,
	writeShowWelcomeAtStartup,
} from './welcomePreference.js';

function memoryStorage(initial = {}) {
	const values = new Map(Object.entries(initial));
	return {
		getItem: vi.fn((key) => values.get(key) ?? null),
		setItem: vi.fn((key, value) => values.set(key, value)),
		values,
	};
}

beforeEach(() => vi.unstubAllGlobals());

describe('Welcome startup preference', () => {
	it('defaults to enabled on a fresh installation', () => {
		const storage = memoryStorage();
		expect(DEFAULT_SHOW_WELCOME_AT_STARTUP).toBe(true);
		expect(readShowWelcomeAtStartup(storage)).toEqual({
			showWelcomeAtStartup: true,
			storageAvailable: true,
		});
		expect(resolveStartupPath('/', true)).toBe('/welcome');
	});

	it('persists checked and unchecked choices for subsequent launches', () => {
		const storage = memoryStorage();
		expect(writeShowWelcomeAtStartup(false, storage)).toBe(true);
		expect(storage.setItem).toHaveBeenLastCalledWith(SHOW_WELCOME_STORAGE_KEY, 'false');
		expect(readShowWelcomeAtStartup(storage).showWelcomeAtStartup).toBe(false);
		expect(writeShowWelcomeAtStartup(true, storage)).toBe(true);
		expect(storage.setItem).toHaveBeenLastCalledWith(SHOW_WELCOME_STORAGE_KEY, 'true');
		expect(readShowWelcomeAtStartup(storage).showWelcomeAtStartup).toBe(true);
	});

	it('opens Welcome on enabled launches and Home on disabled repeat launches', () => {
		const storage = memoryStorage();
		const history = { state: { retained: true }, replaceState: vi.fn() };
		expect(applyWelcomeStartupPreference({ location: { pathname: '/' }, history, storage })).toBe('/welcome');
		expect(history.replaceState).toHaveBeenCalledWith(history.state, '', '/welcome');

		writeShowWelcomeAtStartup(false, storage);
		history.replaceState.mockClear();
		expect(applyWelcomeStartupPreference({ location: { pathname: '/' }, history, storage })).toBe('/');
		expect(history.replaceState).not.toHaveBeenCalled();
	});

	it.each(['/gardens', '/gardens/new/wizard', '/notes/note-id', '/help', '/welcome'])(
		'preserves the direct or deep link %s', (pathname) => {
			const history = { replaceState: vi.fn() };
			expect(applyWelcomeStartupPreference({
				location: { pathname }, history, storage: memoryStorage(),
			})).toBe(pathname);
			expect(history.replaceState).not.toHaveBeenCalled();
		},
	);

	it('falls back safely when local storage is unavailable', () => {
		const storage = {
			getItem() { throw new Error('blocked'); },
			setItem() { throw new Error('blocked'); },
		};
		expect(readShowWelcomeAtStartup(storage)).toEqual({
			showWelcomeAtStartup: true,
			storageAvailable: false,
		});
		expect(writeShowWelcomeAtStartup(false, storage)).toBe(false);
	});
});
