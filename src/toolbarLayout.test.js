import { describe, expect, it } from 'vitest';
import { getVisibleToolCount } from './toolbarLayout.js';

const options = { toolWidths: [80, 85, 100, 90], reservedWidths: [48, 48, 48], gap: 8 };
const count = (availableWidth) => getVisibleToolCount({ ...options, availableWidth });

describe('Header toolbar layout', () => {
	it('keeps all tools when they fit', () => expect(count(700)).toBe(4));
	it('accepts an exact fit including every gap and More', () => expect(count(547)).toBe(4));
	it('overflows Calendar first when one pixel short', () => expect(count(546)).toBe(3));
	it('retains the longest fitting prefix rather than skipping wider tools', () => {
		expect(count(441)).toBe(2);
		expect(count(341)).toBe(2);
		expect(count(340)).toBe(1);
		expect(count(247)).toBe(0);
	});
	it('reserves More even when no tools overflow', () => {
		expect(getVisibleToolCount({ ...options, availableWidth: 500, reservedWidths: [48, 48] })).toBe(4);
		expect(count(500)).toBe(3);
	});
	it.each([0, -1, NaN, Infinity])('handles unavailable width %s conservatively', (availableWidth) => {
		expect(count(availableWidth)).toBe(0);
	});
	it('updates membership in both directions as the available space changes', () => {
		expect([700, 500, 300, 160, 700].map(count)).toEqual([4, 3, 1, 0, 4]);
	});
	it('handles fractional measurements without allowing overflow', () => {
		expect(getVisibleToolCount({ availableWidth: 20.5, toolWidths: [10.25], reservedWidths: [10.25] })).toBe(1);
		expect(getVisibleToolCount({ availableWidth: 20.49, toolWidths: [10.25], reservedWidths: [10.25] })).toBe(0);
	});
});
