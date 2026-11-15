import { describe, expect, it } from 'vitest';
import { resolveInterfaceMode } from './interfaceMode.js';

describe('interface mode presentation resolution', () => {
	it.each([
		['auto', true, 'simple'],
		['auto', false, 'standard'],
		['simple', true, 'simple'],
		['simple', false, 'simple'],
		['standard', true, 'standard'],
		['standard', false, 'standard'],
	])('resolves %s with narrow=%s to %s without persistence', (preference, isNarrow, expected) => {
		expect(resolveInterfaceMode(preference, isNarrow)).toBe(expected);
	});
});
