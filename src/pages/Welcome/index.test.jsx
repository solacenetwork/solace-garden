import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const carouselHarness = vi.hoisted(() => ({ instances: [] }));
vi.mock('bootstrap/js/dist/carousel.js', () => ({
	default: class Carousel {
		constructor(element, config) {
			this.element = element;
			this.config = config;
			this.dispose = vi.fn();
			carouselHarness.instances.push(this);
		}
	},
}));

import { Help } from '../Help/index.jsx';
import {
	initializeWelcomeCarousel,
	loadWelcomeSlides,
	WELCOME_CAROUSEL_CONFIG,
	WELCOME_SLIDES_URL,
	WelcomeCarouselView,
	WelcomeView,
} from './index.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	return [node, ...nodes(node.props?.children)];
}

function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ');
}

async function configuredSlides() {
	return JSON.parse(await readFile(
		new URL('../../../public/assets/data/welcome-slides.json', import.meta.url),
		'utf8',
	));
}

beforeEach(() => { carouselHarness.instances = []; });

describe('Welcome introduction', () => {
	it('parses the static JSON in stable slide order', async () => {
		const slides = await configuredSlides();
		expect(slides.map(({ id }) => id)).toEqual(['welcome', 'organize', 'story', 'create']);
		expect(new Set(slides.map(({ id }) => id)).size).toBe(slides.length);
		const fetchSlides = vi.fn(async (url) => ({ ok: true, json: async () => slides }));
		expect(await loadWelcomeSlides(fetchSlides)).toEqual(slides);
		expect(fetchSlides).toHaveBeenCalledWith(WELCOME_SLIDES_URL);
	});

	it('renders JSON content, ordered indicators, and only the configured optional CTA', async () => {
		const slides = await configuredSlides();
		const tree = WelcomeCarouselView({ slides });
		expect(tree.props.class).toBe('carousel carousel-overlay welcome-carousel');
		expect(tree.props.class).not.toContain('carousel-fade');
		expect(nodes(tree).find(({ props }) => props?.class === 'carousel-inner welcome-carousel__viewport')).toBeTruthy();
		const renderedSlides = nodes(tree).filter(({ props }) => props?.class?.includes('welcome-carousel__slide'));
		expect(renderedSlides.map(({ key }) => key)).toEqual(slides.map(({ id }) => id));
		for (const slide of slides) {
			expect(text(tree)).toContain(slide.heading);
			expect(text(tree)).toContain(slide.description);
		}
		const ctas = nodes(tree).filter(({ props }) => props?.class?.includes('welcome-carousel__cta'));
		expect(ctas).toHaveLength(1);
		expect(ctas[0].props).toMatchObject({ href: '/gardens/new/wizard' });
		expect(text(ctas[0])).toBe('Create Your First Garden');
		expect(nodes(tree).filter(({ props }) => Object.hasOwn(props ?? {}, 'data-bs-slide-to')).map(({ props }) => props['data-bs-slide-to']))
			.toEqual([0, 1, 2, 3]);
	});

	it('initializes one manual Bootstrap 6 carousel and disposes it', () => {
		const element = {};
		const cleanup = initializeWelcomeCarousel(element);
		expect(carouselHarness.instances).toHaveLength(1);
		expect(carouselHarness.instances[0]).toMatchObject({
			element,
			config: WELCOME_CAROUSEL_CONFIG,
		});
		expect(WELCOME_CAROUSEL_CONFIG).toEqual({
			autoplay: false, ends: 'wrap', keyboard: true, pause: false,
		});
		cleanup();
		expect(carouselHarness.instances[0].dispose).toHaveBeenCalledOnce();
	});

	it('keeps Skip and Wizard navigation as ordinary links without preference or creation side effects', async () => {
		const onPreferenceChange = vi.fn();
		const view = WelcomeView({
			slides: await configuredSlides(),
			showWelcomeAtStartup: true,
			storageAvailable: true,
			onPreferenceChange,
		});
		const skip = nodes(view).find(({ props }) => props?.href === '/gardens');
		expect(skip.type).toBe('a');
		expect(skip.props.onClick).toBeUndefined();
		expect(onPreferenceChange).not.toHaveBeenCalled();
		expect(nodes(view).some(({ type }) => type === 'form')).toBe(false);

		const checkbox = nodes(view).find(({ props }) => props?.id === 'show-welcome-at-startup');
		expect(checkbox.props.checked).toBe(true);
		checkbox.props.onChange({ currentTarget: { checked: false } });
		expect(onPreferenceChange).toHaveBeenCalledWith(false);
	});

	it('provides the Help entry back to Welcome', () => {
		const link = nodes(Help()).find(({ props }) => props?.href === '/welcome');
		expect(link).toBeTruthy();
		expect(text(link)).toContain('Welcome introduction');
	});
});
