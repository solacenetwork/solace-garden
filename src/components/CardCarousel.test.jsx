import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	constructors: [],
	effects: [],
	id: 0,
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
	useId: () => `P${++harness.id}`,
	useRef: (initial) => ({ current: initial }),
	useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
	useEffect: (effect, dependencies) => harness.effects.push({ effect, dependencies }),
}));

import {
	CARD_CAROUSEL_CONFIG,
	CardCarousel,
	initializeCardCarousel,
} from './CardCarousel.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}

function items(tree) {
	return nodes(tree).filter(({ props }) => props.class?.split(' ').includes('carousel-item'));
}

beforeEach(() => {
	harness.constructors = [];
	harness.effects = [];
	harness.id = 0;
	vi.stubGlobal('addEventListener', vi.fn());
	vi.stubGlobal('removeEventListener', vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

describe('CardCarousel structure', () => {
	it('renders arbitrary keyed children with Bootstrap markup and accessible native controls', () => {
		const tree = CardCarousel({
			id: 'current-cards',
			label: 'Current Gardens',
			className: 'dashboard-rail',
			children: [
				<article key="a"><button type="button">First action</button></article>,
				<figure key="b">Second card</figure>,
			],
		});
		const all = nodes(tree);
		const controls = all.filter(({ props }) => props['data-bs-slide']);

		expect(tree.props).toMatchObject({
			id: 'current-cards',
			class: 'carousel card-carousel dashboard-rail',
			role: 'region',
			'aria-roledescription': 'carousel',
			'aria-label': 'Current Gardens',
		});
		expect(items(tree)).toHaveLength(2);
		expect(items(tree)[0].props.class).toBe('carousel-item active');
		expect(items(tree)[1].props.class).toBe('carousel-item');
		expect(all.some(({ type }) => type === 'article')).toBe(true);
		expect(all.some(({ type }) => type === 'figure')).toBe(true);
		expect(controls.map(({ type }) => type)).toEqual(['button', 'button']);
		expect(controls.map(({ props }) => props['data-bs-slide'])).toEqual(['prev', 'next']);
		expect(controls.every(({ props }) => props['data-bs-target'] === '#current-cards')).toBe(true);
		expect(controls.map(({ props }) => props['aria-label'])).toEqual([
			'Previous cards in Current Gardens',
			'Next cards in Current Gardens',
		]);
		expect(all.find(({ props }) => props.class === 'carousel-inner card-carousel__viewport').props.tabIndex).toBeUndefined();
	});

	it('tolerates empty, one-child, and short collections', () => {
		for (const [children, count] of [
			[null, 0],
			[<span key="one">One</span>, 1],
			[[<span key="one">One</span>, <span key="two">Two</span>], 2],
		]) {
			const tree = CardCarousel({ id: `cards-${count}`, label: `${count} cards`, children });
			expect(items(tree)).toHaveLength(count);
		}
	});

	it('uses explicit IDs and otherwise gives independent instances unique stable-useId targets', () => {
		const first = CardCarousel({ label: 'First', children: null });
		const second = CardCarousel({ label: 'Second', children: null });

		expect(first.props.id).toBe('card-carousel-P1');
		expect(second.props.id).toBe('card-carousel-P2');
		expect(nodes(first).filter(({ props }) => props['data-bs-target']).every(
			({ props }) => props['data-bs-target'] === '#card-carousel-P1',
		)).toBe(true);
		expect(nodes(second).filter(({ props }) => props['data-bs-target']).every(
			({ props }) => props['data-bs-target'] === '#card-carousel-P2',
		)).toBe(true);
	});

	it('preserves wrapper identity for content updates and exposes order changes through keys', () => {
		const render = (children) => CardCarousel({ id: 'changing', label: 'Changing cards', children });
		const original = render([
			<article key="alpha">Alpha</article>,
			<article key="beta">Beta</article>,
		]);
		const updated = render([
			<article key="alpha">Alpha renamed</article>,
			<article key="beta">Beta</article>,
		]);
		const reordered = render([
			<article key="beta">Beta</article>,
			<article key="alpha">Alpha renamed</article>,
		]);

		expect(items(original).map(({ key }) => key)).toEqual(['alpha', 'beta']);
		expect(items(updated).map(({ key }) => key)).toEqual(['alpha', 'beta']);
		expect(items(reordered).map(({ key }) => key)).toEqual(['beta', 'alpha']);
	});
});

describe('CardCarousel lifecycle', () => {
	it('constructs Bootstrap once, measures locally, recreates on direct child mutations, and cleans up', () => {
		const resizeObservers = [];
		const mutationObservers = [];
		vi.stubGlobal('ResizeObserver', class ResizeObserver {
			constructor(callback) { this.callback = callback; this.observe = vi.fn(); this.disconnect = vi.fn(); resizeObservers.push(this); }
		});
		vi.stubGlobal('MutationObserver', class MutationObserver {
			constructor(callback) { this.callback = callback; this.observe = vi.fn(); this.disconnect = vi.fn(); mutationObservers.push(this); }
		});
		const element = {};
		const viewport = { scrollWidth: 720, clientWidth: 320 };
		const onOverflowChange = vi.fn();

		const cleanup = initializeCardCarousel(element, viewport, onOverflowChange);
		expect(harness.constructors).toHaveLength(1);
		expect(harness.constructors[0].config).toEqual(CARD_CAROUSEL_CONFIG);
		expect(resizeObservers[0].observe).toHaveBeenCalledWith(viewport);
		expect(mutationObservers[0].observe).toHaveBeenCalledWith(viewport, { childList: true });
		expect(onOverflowChange).toHaveBeenLastCalledWith(true);
		expect(globalThis.addEventListener).not.toHaveBeenCalled();

		mutationObservers[0].callback();
		expect(harness.constructors).toHaveLength(2);
		expect(harness.constructors[0].dispose).toHaveBeenCalledOnce();
		expect(harness.constructors[1].element).toBe(element);

		viewport.scrollWidth = 320;
		resizeObservers[0].callback();
		expect(onOverflowChange).toHaveBeenLastCalledWith(false);

		cleanup();
		expect(resizeObservers[0].disconnect).toHaveBeenCalledOnce();
		expect(mutationObservers[0].disconnect).toHaveBeenCalledOnce();
		expect(harness.constructors[1].dispose).toHaveBeenCalledOnce();
	});

	it('uses and removes a window resize fallback only when ResizeObserver is unavailable', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('MutationObserver', undefined);
		const cleanup = initializeCardCarousel({}, { scrollWidth: 0, clientWidth: 0 }, vi.fn());

		expect(globalThis.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
		cleanup();
		expect(globalThis.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(harness.constructors[0].dispose).toHaveBeenCalledOnce();
	});

	it('mounts through one empty-dependency effect and repeatedly disposes without shared state', () => {
		const tree = CardCarousel({ id: 'lifecycle', label: 'Lifecycle', children: <span>Card</span> });
		const viewportNode = nodes(tree).find(({ props }) => props.class === 'carousel-inner card-carousel__viewport');
		tree.ref.current = {};
		viewportNode.ref.current = { scrollWidth: 100, clientWidth: 100 };
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('MutationObserver', undefined);

		expect(harness.effects.at(-1).dependencies).toEqual([]);
		const firstCleanup = harness.effects.at(-1).effect();
		firstCleanup();
		const secondCleanup = initializeCardCarousel({}, { scrollWidth: 100, clientWidth: 100 }, vi.fn());
		secondCleanup();
		expect(harness.constructors).toHaveLength(2);
		for (const instance of harness.constructors) expect(instance.dispose).toHaveBeenCalledOnce();
	});

	it('does not access IndexedDB or require any record shape', () => {
		Object.defineProperty(globalThis, 'indexedDB', {
			configurable: true,
			get() { throw new Error('CardCarousel must not access IndexedDB'); },
		});
		try {
			const tree = CardCarousel({
				id: 'generic',
				label: 'Generic content',
				children: <output key="not-a-record">Arbitrary output</output>,
			});
			expect(nodes(tree).some(({ type }) => type === 'output')).toBe(true);
		} finally {
			delete globalThis.indexedDB;
		}
	});
});
