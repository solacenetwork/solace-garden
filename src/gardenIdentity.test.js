import { describe, expect, it } from 'vitest';
import {
	CURATED_GARDEN_ICONS,
	DEFAULT_GARDEN_COLOR,
	DEFAULT_GARDEN_ICON,
	GARDEN_COLOR_PALETTE,
	GARDEN_NUMBER_ICONS,
	normalizeBootstrapIconName,
	normalizeGardenColor,
	renderableGardenColor,
	renderableGardenIcon,
	validateBootstrapIconName,
	validateGardenColor,
} from './gardenIdentity.js';

describe('Garden identity values', () => {
	it('validates every curated and numbered icon against the installed package metadata', () => {
		for (const icon of [...CURATED_GARDEN_ICONS, ...GARDEN_NUMBER_ICONS]) {
			expect(validateBootstrapIconName(icon)).toMatchObject({ name: icon, isValid: true });
		}
	});

	it('normalizes icon input while rejecting classes, markup, and unknown names', () => {
		expect(normalizeBootstrapIconName('  BI-Flower1 ')).toBe('flower1');
		expect(validateBootstrapIconName('  BI-Flower1 ')).toEqual({
			name: 'flower1', isEmpty: false, isValid: true, error: '',
		});
		for (const value of ['bi bi-flower1', '.bi-flower1', '<i>flower1</i>', 'not-an-installed-icon', 'bi-']) {
			expect(validateBootstrapIconName(value)).toMatchObject({ name: null, isValid: false });
		}
	});

	it('uses null defaults and safely falls back for obsolete stored values', () => {
		expect(validateBootstrapIconName(null)).toMatchObject({ name: null, isEmpty: true, isValid: true });
		expect(validateGardenColor(null)).toMatchObject({ color: null, isEmpty: true, isValid: true });
		expect(renderableGardenIcon('removed-icon-name')).toBe(DEFAULT_GARDEN_ICON);
		expect(renderableGardenColor('invalid')).toBe(DEFAULT_GARDEN_COLOR);
	});

	it('normalizes six-digit colors and rejects malformed values', () => {
		expect(normalizeGardenColor(' 287d46 ')).toBe('#287D46');
		expect(normalizeGardenColor(' #a38dcd ')).toBe('#A38DCD');
		expect(validateGardenColor('287d46')).toEqual({
			color: '#287D46', isEmpty: false, isValid: true, error: '',
		});
		for (const value of ['#123', '#1234567', '#GGGGGG', 'red', 123456]) {
			expect(validateGardenColor(value)).toMatchObject({ color: null, isValid: false });
		}
	});

	it('keeps the neutral fallback outside the curated palette', () => {
		expect(GARDEN_COLOR_PALETTE.map(({ value }) => value)).not.toContain(DEFAULT_GARDEN_COLOR);
	});
});
