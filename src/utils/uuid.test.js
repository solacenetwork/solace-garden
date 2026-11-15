import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUUID } from './uuid.js';
import { isGardenDatabaseName } from '../storage/dexie/databaseNames.js';

afterEach(() => vi.unstubAllGlobals());
describe('cryptographic UUID v4 generation', () => {
	it.each([0, 255])('sets version and variant bits with byte value %i, without randomUUID', (value) => {
		const getRandomValues = vi.fn(bytes => bytes.fill(value));
		vi.stubGlobal('crypto', { getRandomValues });
		const uuid = createUUID();
		expect(uuid).toBe(value === 0 ? '00000000-0000-4000-8000-000000000000' : 'ffffffff-ffff-4fff-bfff-ffffffffffff');
		expect(getRandomValues).toHaveBeenCalledOnce();
		expect(getRandomValues.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
		expect(getRandomValues.mock.calls[0][0]).toHaveLength(16);
		expect(isGardenDatabaseName(`solace-garden-data-${uuid}`)).toBe(true);
	});
	it('uses fresh cryptographic bytes for each identifier', () => {
		const uuids = new Set(Array.from({ length: 100 }, createUUID));
		expect(uuids.size).toBe(100);
		for (const uuid of uuids) expect(isGardenDatabaseName(`solace-garden-data-${uuid}`)).toBe(true);
	});
	it('fails instead of falling back when cryptographic randomness is unavailable', () => {
		vi.stubGlobal('crypto', {});
		expect(createUUID).toThrow(TypeError);
	});
});
