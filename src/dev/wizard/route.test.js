import { describe, expect, it } from 'vitest';
import { applicationRoutes, routeCatalog } from '../../routes.js';
import {
	globalToolIds,
	moreDestinationIds,
	simpleCardIds,
	standardPrimaryIds,
} from '../../navigation.js';
import { isWizardPreviewPath, WIZARD_PREVIEW_PATH } from './route.js';

describe('Wizard preview isolation', () => {
	it('recognizes its URL only in development', () => {
		expect(WIZARD_PREVIEW_PATH).toBe('/dev/wizard');
		expect(isWizardPreviewPath(WIZARD_PREVIEW_PATH, true)).toBe(true);
		expect(isWizardPreviewPath(WIZARD_PREVIEW_PATH, false)).toBe(false);
		expect(isWizardPreviewPath('/dev/other', true)).toBe(false);
	});

	it('does not register the preview as a production route or navigation destination', () => {
		expect(applicationRoutes.some(({ path }) => path === WIZARD_PREVIEW_PATH)).toBe(false);
		expect(routeCatalog.some(({ path }) => path === WIZARD_PREVIEW_PATH)).toBe(false);
		for (const ids of [simpleCardIds, standardPrimaryIds, globalToolIds, moreDestinationIds]) {
			expect(ids).not.toContain('wizard-preview');
		}
	});
});
