import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	constructors: [],
	effects: [],
	setters: [],
}));

vi.mock('bootstrap/js/dist/carousel.js', () => ({
	default: class Carousel {
		constructor(element, config) {
			this.element = element;
			this.config = config;
			this.dispose = vi.fn();
			harness.constructors.push(this);
		}
	},
}));

vi.mock('preact/hooks', () => ({
	useRef: (initial) => ({ current: initial }),
	useState: (initial) => {
		const value = typeof initial === 'function' ? initial() : initial;
		const setter = vi.fn();
		harness.setters.push(setter);
		return [value, setter];
	},
	useEffect: (effect, dependencies) => {
		harness.effects.push({ effect, dependencies });
	},
}));

import {
	CarouselPoc,
	PrototypeCarousel,
	gallerySamples,
	gardenSamples,
	initializePrototypeCarousel,
} from './CarouselPoc.jsx';

function nodes(node, resolveComponents = false) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap((child) => nodes(child, resolveComponents));
	if (resolveComponents && typeof node.type === 'function') {
		return nodes(node.type(node.props), resolveComponents);
	}
	return [node, ...nodes(node.props?.children, resolveComponents)];
}

beforeEach(() => {
	harness.constructors = [];
	harness.effects = [];
	harness.setters = [];
	vi.stubGlobal('addEventListener', vi.fn());
	vi.stubGlobal('removeEventListener', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Carousel proof-of-concept content', () => {
	it('renders separate Garden, Gallery, and zero-to-three-card carousel identities', () => {
		const tree = CarouselPoc();
		const carousels = nodes(tree).filter(({ type }) => type === PrototypeCarousel);

		expect(carousels.map(({ props }) => props.id)).toEqual([
			'prototype-gardens',
			'prototype-gallery',
			'prototype-edge-0',
			'prototype-edge-1',
			'prototype-edge-2',
			'prototype-edge-3',
		]);
		expect(carousels.map(({ props }) => props.items.length)).toEqual([8, 8, 0, 1, 2, 3]);
		expect(new Set(carousels.map(({ props }) => props.id)).size).toBe(carousels.length);
	});

	it('uses eight existing public sample-image URLs and varied prototype content', () => {
		expect(gallerySamples).toHaveLength(8);
		for (const image of gallerySamples) {
			expect(image.src).toMatch(/^\/assets\/temp\/stock-images\/.+\.jpg$/);
			expect(image.alt.length).toBeGreaterThan(0);
		}
		expect(new Set(gallerySamples.map(({ fit }) => fit))).toEqual(new Set(['cover', 'contain']));
		expect(gardenSamples).toHaveLength(8);
		expect(gardenSamples.some(({ subtitle }) => subtitle === null)).toBe(true);
		expect(gardenSamples.some(({ image }) => image === null)).toBe(true);
		expect(gardenSamples.some(({ title }) => title.length > 45)).toBe(true);
	});

	it('renders native card links, an empty state, and correctly targeted controls', () => {
		const renderItem = (item) => <a href={`#${item.id}`}>{item.title}</a>;
		const populated = PrototypeCarousel({
			id: 'test-populated', label: 'Test cards', items: gardenSamples.slice(0, 2), renderItem,
		});
		const populatedNodes = nodes(populated, true);
		const controls = populatedNodes.filter(({ props }) => props['data-bs-slide']);

		expect(populatedNodes.filter(({ props }) => props.class?.includes('carousel-item'))).toHaveLength(2);
		expect(populatedNodes.filter(({ type }) => type === 'a')).toHaveLength(2);
		expect(controls.map(({ props }) => props['data-bs-slide'])).toEqual(['prev', 'next']);
		expect(controls.every(({ props }) => props['data-bs-target'] === '#test-populated')).toBe(true);
		expect(populated.props).toMatchObject({
			role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Test cards',
		});

		const empty = PrototypeCarousel({ id: 'test-empty', label: 'Empty', items: [], renderItem });
		expect(nodes(empty, true).some(({ props }) => props.class === 'prototype-carousel__empty')).toBe(true);
		expect(nodes(empty, true).some(({ props }) => props.class === 'carousel-item')).toBe(false);
	});
});

describe('Bootstrap Carousel lifecycle', () => {
	it('initializes stop-at-ends behavior, measures overflow, and fully disposes', () => {
		const resizeObservers = [];
		vi.stubGlobal('ResizeObserver', class ResizeObserver {
			constructor(callback) {
				this.callback = callback;
				this.observe = vi.fn();
				this.disconnect = vi.fn();
				resizeObservers.push(this);
			}
		});
		const element = {};
		const viewport = { scrollWidth: 720, clientWidth: 320 };
		const onOverflowChange = vi.fn();

		const cleanup = initializePrototypeCarousel(element, viewport, onOverflowChange);
		const instance = harness.constructors[0];

		expect(instance.element).toBe(element);
		expect(instance.config).toEqual({ autoplay: false, ends: 'stop', keyboard: true, pause: false });
		expect(resizeObservers[0].observe).toHaveBeenCalledWith(viewport);
		expect(onOverflowChange).toHaveBeenLastCalledWith(true);

		viewport.scrollWidth = 320;
		resizeObservers[0].callback();
		expect(onOverflowChange).toHaveBeenLastCalledWith(false);

		cleanup();
		expect(resizeObservers[0].disconnect).toHaveBeenCalledOnce();
		expect(globalThis.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(instance.dispose).toHaveBeenCalledOnce();
	});

	it('ties Preact initialization to collection membership for cleanup and reinitialization', () => {
		const tree = PrototypeCarousel({
			id: 'lifecycle-test', label: 'Lifecycle test', items: gardenSamples.slice(0, 3),
			renderItem: (item) => item.title,
		});
		const viewportNode = nodes(tree).find(({ props }) => props.class === 'carousel-inner');
		const rootElement = {};
		const viewportElement = { scrollWidth: 300, clientWidth: 300 };
		tree.ref.current = rootElement;
		viewportNode.ref.current = viewportElement;

		expect(harness.effects.at(-1).dependencies).toEqual(['kitchen|community|pollinator']);
		const cleanup = harness.effects.at(-1).effect();
		expect(harness.constructors.at(-1).element).toBe(rootElement);
		cleanup();
		expect(harness.constructors.at(-1).dispose).toHaveBeenCalledOnce();
	});

	it('does not access IndexedDB while rendering or initializing the prototype', () => {
		Object.defineProperty(globalThis, 'indexedDB', {
			configurable: true,
			get() {
				throw new Error('Prototype must not access IndexedDB');
			},
		});
		try {
			const tree = CarouselPoc();
			expect(tree.type).toBe('main');
			const cleanup = initializePrototypeCarousel({}, { scrollWidth: 0, clientWidth: 0 }, vi.fn());
			cleanup();
		} finally {
			delete globalThis.indexedDB;
		}
	});
});
