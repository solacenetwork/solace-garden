import { describe, expect, it, vi, afterEach } from 'vitest';
import { startupDiagnostics } from './startupDiagnostics.js';

afterEach(() => vi.unstubAllGlobals());
describe('safe storage startup diagnostics', () => {
	it('captures known original exceptions, nested causes and API capabilities', () => {
		vi.stubGlobal('isSecureContext', false);
		vi.stubGlobal('crypto', { getRandomValues() {} });
		const cause = new TypeError('crypto.randomUUID is not a function');
		const diagnostics = startupDiagnostics('CONTROL_OPEN_FAILED', 'configuration-populate-uuid', new Error('Unknown wrapper', { cause }));
		expect(diagnostics).toMatchObject({
			code: 'CONTROL_OPEN_FAILED', stage: 'configuration-populate-uuid',
			secureContext: false, randomUUIDAvailable: false, getRandomValuesAvailable: true,
			exceptions: [{ name: 'Error' }, { name: 'TypeError', message: cause.message }],
			dexieVersion: '4.4.7',
		});
	});
	it('does not serialize records, keys, database names, URLs, stacks or arbitrary messages', () => {
		const secret = 'Private note at location 123, solace-garden-data-private https://secret.example';
		const error = Object.assign(new Error(secret), { record: { text: secret }, key: secret });
		error.name = secret;
		error.inner = error;
		const output = JSON.stringify(startupDiagnostics('CONTROL_OPEN_FAILED', 'control-open', error));
		expect(output).not.toContain(secret);
		expect(output).not.toContain('stack');
		expect(JSON.parse(output).exceptions).toHaveLength(1);
	});
	it('supports Dexie inner exceptions and absent browser globals', () => {
		const diagnostics = startupDiagnostics('CONTROL_DATABASE_CHECK_FAILED', 'control-existence', {
			name: 'Error', message: 'The database existence check failed.',
			inner: new DOMException('Access denied', 'SecurityError'),
		});
		expect(diagnostics.exceptions[1]).toEqual({ name: 'SecurityError', message: 'Access denied' });
	});
	it('still produces recovery diagnostics if a browser capability getter throws', () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
		Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get() { throw new DOMException('Access denied', 'SecurityError'); } });
		try {
			expect(startupDiagnostics('CONTROL_DATABASE_CHECK_FAILED', 'control-existence').indexedDBAvailable).toBe(null);
		} finally {
			if (original) Object.defineProperty(globalThis, 'indexedDB', original);
			else delete globalThis.indexedDB;
		}
	});

});
