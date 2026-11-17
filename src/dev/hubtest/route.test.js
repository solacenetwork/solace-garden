import { describe, expect, it } from 'vitest';
import { applicationRoutes, routeCatalog } from '../../routes.js';
import {
	globalToolIds,
	moreDestinationIds,
	simpleCardIds,
	standardPrimaryIds,
} from '../../navigation.js';
import { HUBTEST_PATH, isHubtestPath } from './route.js';

describe('Garden Hub prototype isolation', () => {
	it('recognizes its URL only in development', () => {
		expect(HUBTEST_PATH).toBe('/dev/hubtest');
		expect(isHubtestPath(HUBTEST_PATH, true)).toBe(true);
		expect(isHubtestPath(HUBTEST_PATH, false)).toBe(false);
		expect(isHubtestPath('/dev/other', true)).toBe(false);
	});

	it('does not register the prototype as a production route or navigation destination', () => {
		expect(applicationRoutes.some(({ path }) => path === HUBTEST_PATH)).toBe(false);
		expect(routeCatalog.some(({ path }) => path === HUBTEST_PATH)).toBe(false);
		for (const ids of [simpleCardIds, standardPrimaryIds, globalToolIds, moreDestinationIds]) {
			expect(ids).not.toContain('hubtest');
		}
	});
});
