import { describe, expect, it } from 'vitest';
import { applicationRoutes, routeCatalog } from '../../routes.js';
import {
	globalToolIds,
	moreDestinationIds,
	simpleCardIds,
	standardPrimaryIds,
} from '../../navigation.js';
import { CAROUSEL_POC_PATH, isCarouselPocPath } from './route.js';

describe('Carousel proof-of-concept isolation', () => {
	it('recognizes its URL only in development', () => {
		expect(CAROUSEL_POC_PATH).toBe('/dev/carousel');
		expect(isCarouselPocPath(CAROUSEL_POC_PATH, true)).toBe(true);
		expect(isCarouselPocPath(CAROUSEL_POC_PATH, false)).toBe(false);
		expect(isCarouselPocPath('/dev/other', true)).toBe(false);
	});

	it('does not register the prototype as a production route or navigation destination', () => {
		expect(applicationRoutes.some(({ path }) => path === CAROUSEL_POC_PATH)).toBe(false);
		expect(routeCatalog.some(({ path }) => path === CAROUSEL_POC_PATH)).toBe(false);
		for (const ids of [simpleCardIds, standardPrimaryIds, globalToolIds, moreDestinationIds]) {
			expect(ids).not.toContain('carousel-poc');
		}
	});
});
