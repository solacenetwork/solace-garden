import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ slots: [], index: 0, pending: [], instances: [], path: '/' }));
vi.mock('preact-iso', () => ({ useLocation: () => ({ path: hooks.path }) }));
vi.mock('./HeaderSearch.jsx', () => ({ HeaderSearch: () => null }));
vi.mock('preact/hooks', () => ({
	useRef(initial) { return hooks.slots[hooks.index++] ??= { current: initial }; },
	useState(initial) {
		const i = hooks.index++;
		if (!(i in hooks.slots)) hooks.slots[i] = initial;
		return [hooks.slots[i], (value) => { hooks.slots[i] = typeof value === 'function' ? value(hooks.slots[i]) : value; }];
	},
	useEffect(effect, deps) {
		const i = hooks.index++;
		const previous = hooks.slots[i];
		if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
			hooks.slots[i] = { deps, cleanup: previous?.cleanup };
			hooks.pending.push(() => { hooks.slots[i].cleanup?.(); hooks.slots[i].cleanup = effect(); });
		}
	},
}));
vi.mock('bootstrap/js/dist/menu.js', () => ({ default: class Menu {
	static getOrCreateInstance(toggle, config) { return new this(toggle, config); }
	constructor(toggle, config) {
		this.toggle = toggle;
		this.config = config;
		this.hide = vi.fn();
		this.dispose = vi.fn();
		hooks.instances.push(this);
	}
} }));

import { HeaderToolbar } from './HeaderToolbar.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}
function mount() {
	let width = 547;
	let frameId = 0;
	const frames = new Map();
	let resize;
	const observe = vi.fn();
	const disconnect = vi.fn();
	const doc = {
		activeElement: null,
		fonts: { ready: new Promise(() => {}), addEventListener: vi.fn(), removeEventListener: vi.fn() },
		getElementById: vi.fn(() => ({ focus: quickFocus })),
	};
	function element(getWidth = () => 48) {
		return { ownerDocument: doc, getBoundingClientRect: () => ({ width: getWidth() }), contains: (target) => target?.insideMore, focus: vi.fn() };
	}
	const quickFocus = vi.fn();
	vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { frames.set(++frameId, callback); return frameId; }));
	vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => frames.delete(id)));
	vi.stubGlobal('getComputedStyle', () => ({ columnGap: '8px' }));
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback) { resize = callback; }
		observe = observe;
		disconnect = disconnect;
	});
	vi.stubGlobal('addEventListener', vi.fn());
	vi.stubGlobal('removeEventListener', vi.fn());
	const render = () => { hooks.index = 0; return HeaderToolbar(); };
	const tree = render();
	for (const node of nodes(tree).filter((node) => node.ref)) {
		const el = node.props.class === 'header-toolbar' ? element(() => width) : element();
		if (node.props.class === 'header-toolbar__measure-tools') el.children = [80, 85, 100, 90].map((size) => element(() => size));
		node.ref.current = el;
	}
	const effects = () => { for (const effect of hooks.pending.splice(0)) effect(); };
	effects();
	const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); };
	return {
		render, effects, doc, observe, disconnect, quickFocus, frames,
		resize(next) { width = next; resize(); flush(); },
		cleanup() { for (const slot of hooks.slots) slot?.cleanup?.(); },
	};
}
const menu = (tree, id) => nodes(tree).find((node) => node.props.id === id);
const hrefs = (tree) => nodes(tree).filter(({ type }) => type === 'a').map(({ props }) => props.href);

beforeEach(() => { hooks.slots = []; hooks.index = 0; hooks.pending = []; hooks.instances = []; hooks.path = '/'; });
afterEach(() => vi.unstubAllGlobals());

describe('HeaderToolbar', () => {
	it('keeps exactly one permanent More and ordered overflow through repeated resizing and navigation', () => {
		const view = mount();
		for (const [width, expected] of [
			[547, ['/help', '/about', '/settings?ref=home']],
			[546, ['/calendar', '/help', '/about', '/settings?ref=home']],
			[160, ['/notes', '/tasks', '/wishlist', '/calendar', '/help', '/about', '/settings?ref=home']],
			[547, ['/help', '/about', '/settings?ref=home']],
		]) {
			view.resize(width);
			const tree = view.render();
			expect(nodes(tree).filter(({ props }) => props['aria-label'] === 'More')).toHaveLength(1);
			expect(hrefs(menu(tree, 'header-more-menu'))).toEqual(expected);
		}
		hooks.path = '/notes/new/draft';
		const tree = view.render();
		view.effects();
		expect(hrefs(menu(tree, 'header-more-menu')).at(-1)).toBe('/settings?ref=notes');
		expect(nodes(tree).find(({ props }) => props['data-header-tool'] === 'notes').props['aria-current']).toBe('page');
		view.cleanup();
	});

	it('reserves four existing creation actions and focuses repeat list actions only for normal clicks', () => {
		hooks.path = '/tasks';
		const view = mount();
		const actions = nodes(menu(view.render(), 'header-add-menu')).filter(({ type }) => type === 'a');
		expect(hrefs(menu(view.render(), 'header-add-menu'))).toEqual([
			'/gardens/new', '/notes/new', '/tasks#lists-quick-text', '/wishlist#lists-quick-text',
		]);
		expect(actions.map(({ props }) => nodes(props.children).find(({ type }) => type === 'span').props.children)).toEqual([
			'New Garden', 'New Note', 'New Task', 'New Wish List Item',
		]);
		actions[2].props.onClick({ button: 0 });
		expect(view.quickFocus).toHaveBeenCalledOnce();
		actions[2].props.onClick({ button: 0, ctrlKey: true });
		actions[3].props.onClick({ button: 0 });
		expect(view.quickFocus).toHaveBeenCalledOnce();
		hooks.path = '/wishlist';
		nodes(menu(view.render(), 'header-add-menu')).filter(({ type }) => type === 'a')[3].props.onClick({ button: 0 });
		expect(view.quickFocus).toHaveBeenCalledTimes(2);
		view.cleanup();
	});

	it('uses Bootstrap data activation once, keeps menu children in place and cleans up instances and observers', () => {
		const view = mount();
		const toggles = nodes(view.render()).filter(({ props }) => props['data-bs-toggle'] === 'menu');
		expect(toggles).toHaveLength(2);
		for (const toggle of toggles) expect(toggle.props.onClick).toBeUndefined();
		expect(hooks.instances).toHaveLength(2);
		for (const instance of hooks.instances) expect(instance.config).toMatchObject({ container: false, placement: 'bottom-end', strategy: 'fixed' });
		expect(view.observe).toHaveBeenCalledTimes(8);
		const measurement = nodes(view.render()).find(({ props }) => props.class === 'header-toolbar__measurement');
		expect(measurement.props).toMatchObject({ 'aria-hidden': 'true', inert: true });
		expect(nodes(measurement).some(({ type, props }) => type === 'a' || type === 'button' || props.id)).toBe(false);
		view.cleanup();
		for (const instance of hooks.instances) expect(instance.dispose).toHaveBeenCalledOnce();
		expect(view.disconnect).toHaveBeenCalledOnce();
		expect(cancelAnimationFrame).toHaveBeenCalled();
		expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(view.doc.fonts.removeEventListener).toHaveBeenCalledWith('loadingdone', expect.any(Function));
	});

	it('moves focus to More when a focused tool overflows', () => {
		const view = mount();
		view.resize(547);
		view.doc.activeElement = { closest: () => ({ dataset: { headerTool: 'calendar' } }) };
		view.resize(546);
		expect(hooks.instances[1].toggle.focus).toHaveBeenCalledWith({ preventScroll: true });
		view.cleanup();
	});
});
