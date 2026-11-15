import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	effects: [],
	setters: [],
}));

vi.mock('../../components/CardCarousel.jsx', () => ({
	CardCarousel: ({ children }) => children,
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
	gallerySamples,
	gardenSamples,
} from './CarouselPoc.jsx';
import { CardCarousel } from '../../components/CardCarousel.jsx';

function nodes(node, resolveComponents = false) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap((child) => nodes(child, resolveComponents));
	if (resolveComponents && typeof node.type === 'function') {
		return nodes(node.type(node.props), resolveComponents);
	}
	return [node, ...nodes(node.props?.children, resolveComponents)];
}

beforeEach(() => {
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
		const carousels = nodes(tree).filter(({ type }) => type === CardCarousel);

		expect(carousels.map(({ props }) => props.id)).toEqual([
			'prototype-gardens',
			'prototype-gallery',
			'prototype-edge-0',
			'prototype-edge-1',
			'prototype-edge-2',
			'prototype-edge-3',
			undefined,
		]);
		expect(carousels.map(({ props }) => nodes(props.children).length)).toEqual([8, 8, 0, 1, 2, 3, 4]);
		expect(new Set(carousels.slice(0, -1).map(({ props }) => props.id)).size).toBe(carousels.length - 1);
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

	it('uses the production component for native Garden links and keeps empty-state copy in the parent', () => {
		const tree = CarouselPoc();
		const carousels = nodes(tree).filter(({ type }) => type === CardCarousel);
		const gardenLinks = nodes(carousels[0], true).filter(({ type }) => type === 'a');

		expect(gardenLinks).toHaveLength(8);
		expect(gardenLinks.every(({ props }) => props.href.startsWith('#prototype-'))).toBe(true);
		expect(nodes(tree).some(({ props }) => props.class === 'prototype-carousel__empty')).toBe(true);
		expect(carousels[2].props.children).toEqual([]);
	});

	it('provides development-only controls for child membership, order, content, and parent rerenders', () => {
		const tree = CarouselPoc();
		const buttons = nodes(tree).filter(({ type }) => type === 'button');

		expect(buttons.map(({ props }) => props.children)).toEqual([
			'Add card',
			'Remove card',
			'Reverse cards',
			'Update first title',
			'Update parent only',
			'Reset',
		]);
		for (const button of buttons) button.props.onClick();
		expect(harness.setters[2]).toHaveBeenCalledTimes(5);
		expect(harness.setters[3]).toHaveBeenCalledOnce();
	});

	it('does not access IndexedDB while rendering the prototype harness', () => {
		Object.defineProperty(globalThis, 'indexedDB', {
			configurable: true,
			get() {
				throw new Error('Prototype must not access IndexedDB');
			},
		});
		try {
			const tree = CarouselPoc();
			expect(tree.type).toBe('main');
		} finally {
			delete globalThis.indexedDB;
		}
	});
});
