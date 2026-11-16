import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ slots: [], index: 0, pending: [], path: '/gardens' }));
vi.mock('preact-iso', () => ({ useLocation: () => ({ path: hooks.path }) }));
vi.mock('./AppDrawer.jsx', () => ({ AppDrawer: function AppDrawer() {} }));
vi.mock('preact/hooks', () => ({
	useRef(initial) { return hooks.slots[hooks.index++] ??= { current: initial }; },
	useState(initial) {
		const i = hooks.index++;
		if (!(i in hooks.slots)) hooks.slots[i] = typeof initial === 'function' ? initial() : initial;
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
import { StandardNavigation } from './StandardNavigation.jsx';
import { AppDrawer } from './AppDrawer.jsx';
import { routeCatalog } from '../routes.js';
import { navigationGroups, primaryActionIds, secondaryDestinationIds } from '../navigation.js';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function' && node.type !== AppDrawer) return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}
const links = (tree) => nodes(tree).filter(({ type }) => type === 'a');
const ids = (tree) => links(tree).map(({ props }) => props['data-standard-destination']);
const drawer = (tree) => nodes(tree).find(({ type }) => type === AppDrawer);
function mount(width = 1280) {
	const media = new Map();
	const frames = new Map();
	let sequence = 0;
	let tree;
	const logo = { focus: vi.fn() };
	const doc = { activeElement: null, querySelector: vi.fn(() => logo) };
	const focus = vi.fn();
	const phoneTrigger = { focus: vi.fn() };
	const root = {
		ownerDocument: doc, isConnected: true, querySelector: vi.fn((selector) => selector.includes('aria-controls') ? phoneTrigger : null),
		contains: (target) => Boolean(target?.insideNavigation),
		querySelectorAll: () => links(tree).map(({ props }) => ({ dataset: { standardDestination: props['data-standard-destination'] }, focus: (options) => focus(props['data-standard-destination'], options) })),
	};
	vi.stubGlobal('matchMedia', (query) => {
		if (!media.has(query)) media.set(query, {
			matches: width >= (query.includes('1024') ? 1024 : 768), listeners: new Set(),
			addEventListener(_, listener) { this.listeners.add(listener); },
			removeEventListener(_, listener) { this.listeners.delete(listener); },
		});
		return media.get(query);
	});
	vi.stubGlobal('requestAnimationFrame', (callback) => { frames.set(++sequence, callback); return sequence; });
	vi.stubGlobal('cancelAnimationFrame', (id) => frames.delete(id));
	const render = () => {
		hooks.index = 0;
		tree = StandardNavigation();
		tree.ref.current = root;
		for (const effect of hooks.pending.splice(0)) effect();
		return tree;
	};
	render();
	return {
		render, doc, focus, media, root, logo, phoneTrigger,
		flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); },
		resize(next) {
			const changed = [];
			for (const [query, entry] of media) {
				const matches = next >= (query.includes('1024') ? 1024 : 768);
				if (entry.matches !== matches) { entry.matches = matches; changed.push(entry); }
			}
			for (const entry of changed) for (const listener of entry.listeners) listener(entry);
			return render();
		},
		cleanup() { for (const slot of hooks.slots) slot?.cleanup?.(); },
	};
}
const normalClick = () => ({ button: 0, preventDefault: vi.fn() });
beforeEach(() => { hooks.slots = []; hooks.index = 0; hooks.pending = []; hooks.path = '/gardens'; });
afterEach(() => vi.unstubAllGlobals());

describe('StandardNavigation', () => {
	it('renders only the four ordered primary destinations', () => {
		const view = mount();
		const tree = view.render();
		expect(ids(tree)).toEqual(['gardens', 'journal', 'photos', 'plants']);
		expect(links(tree).map(({ props }) => props.href)).toEqual(['/gardens', '/journal', '/photos', '/plants']);
		expect(links(tree).map(({ props }) => nodes(props.children).find(({ type }) => type === 'span').props.children)).toEqual(['Gardens', 'Journal', 'Gallery', 'PlantDB']);
		const list = nodes(tree).find(({ type }) => type === 'ul');
		expect(list.props.children).toHaveLength(4);
		expect(nodes(tree).some(({ props }) => props['data-standard-destination'] === 'templates')).toBe(false);
		expect(drawer(tree)).toBeUndefined();
		view.cleanup();
	});

	it.each([
		['/gardens', 'gardens'], ['/gardens/new', 'gardens'], ['/gardens/new/wizard/draft-1', 'gardens'],
		['/gardens/new/advanced/draft-2', 'gardens'], ['/gardens/garden-1', 'gardens'], ['/gardens/garden-1/edit', 'gardens'],
		['/journal', 'journal', 'page'], ['/photos', 'photos', 'page'], ['/plants', 'plants', 'page'], ['/notes/new/draft-1', undefined, undefined],
	])('marks the primary destination for %s', (path, expected, ariaCurrent = 'page') => {
		hooks.path = path;
		const view = mount();
		expect(links(view.render()).filter(({ props }) => props['aria-current']).map(({ props }) => [props['data-standard-destination'], props['aria-current']])).toEqual(expected ? [[expected, ariaCurrent]] : []);
		view.cleanup();
	});

	it('keeps Templates in the Gardens navigation context without rendering a Templates link', () => {
		hooks.path = '/templates';
		const view = mount();
		expect(links(view.render()).filter(({ props }) => props['aria-current']).map(({ props }) => [props['data-standard-destination'], props['aria-current']])).toEqual([['gardens', 'location']]);
		expect(ids(view.render())).not.toContain('templates');
		view.cleanup();
	});

	it.each([768, 900, 1023])('provides four named direct icon links and one AppDrawer at %ipx', (width) => {
		hooks.path = '/photos';
		const view = mount(width);
		const tree = view.render();
		expect(ids(tree)).toEqual(['gardens', 'journal', 'photos', 'plants']);
		expect(links(tree).map(({ props }) => [props['aria-label'], props.title])).toEqual(['Gardens', 'Journal', 'Gallery', 'PlantDB'].map((label) => [label, label]));
		expect(links(tree).find(({ props }) => props['aria-current']).props['aria-label']).toBe('Gallery');
		expect(nodes(tree).filter(({ type }) => type === AppDrawer)).toHaveLength(1);
		const panel = drawer(tree);
		expect(panel.props).toMatchObject({ id: 'standard-navigation-drawer', title: 'Navigation', placement: 'start', style: { '--app-drawer-width': '300px' } });
		const supplied = { ref: { current: null }, type: 'button', onClick: vi.fn(), 'aria-controls': panel.props.id, 'aria-expanded': true, hidden: true };
		const button = panel.props.renderTrigger(supplied);
		expect(button.ref).toBe(supplied.ref);
		const { ref, ...nativeProps } = supplied;
		expect(button.props).toMatchObject({ ...nativeProps, 'aria-label': 'Open navigation' });
		view.cleanup();
	});

	it.each([375, 900])('shares expanded content and delegates ordinary link dismissal at %ipx without blocking routing', (width) => {
		const view = mount(width);
		const close = vi.fn();
		const content = drawer(view.render()).props.children({ close });
		expect(ids(content)).toEqual(['gardens', 'journal', 'photos', 'plants']);
		for (const link of links(content)) {
			const event = normalClick();
			link.props.onClick(event);
			expect(event.preventDefault).not.toHaveBeenCalled();
		}
		expect(close).toHaveBeenCalledTimes(4);
		for (const event of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) links(content)[0].props.onClick({ button: 0, ...event });
		expect(close).toHaveBeenCalledTimes(4);
		expect(nodes(content).some(({ props }) => props.onKeyDown || props.onCancel || props['data-bs-toggle'])).toBe(false);
		view.cleanup();
	});

	it.each([320, 375, 576, 767])('renders only the compact phone strip and shared Drawer at %ipx', (width) => {
		const view = mount(width);
		const tree = view.render();
		const panel = drawer(tree);
		expect(tree.props.class).toBe('standard-sidebar standard-sidebar--small');
		expect(links(tree)).toHaveLength(0);
		expect(nodes(tree).filter(({ type }) => type === AppDrawer)).toHaveLength(1);
		expect(panel.props).toMatchObject({ id: 'standard-navigation-drawer', title: 'Navigation', placement: 'start', style: { '--app-drawer-width': '300px' } });
		const supplied = { ref: { current: null }, type: 'button', onClick: vi.fn(), 'aria-controls': panel.props.id, 'aria-expanded': true, hidden: true };
		const strip = panel.props.renderTrigger(supplied);
		const button = nodes(strip).find(({ type }) => type === 'button');
		expect(button.ref).toBe(supplied.ref);
		const { ref, ...nativeProps } = supplied;
		expect(button.props).toMatchObject(nativeProps);
		expect(nodes(button).find(({ type }) => type === 'span').props.children).toBe('Navigation');
		expect(nodes(strip).find(({ props }) => props.class === 'standard-navigation__current').props.children).toBe('Gardens');
		expect(nodes(strip).some(({ type }) => type === 'a')).toBe(false);
		expect(nodes(tree).some(({ props }) => props.class?.includes('standard-navigation--icons') || props.class === 'standard-sidebar__toggle')).toBe(false);
		const content = panel.props.children({ close: vi.fn() });
		expect(ids(content)).toEqual(['gardens', 'journal', 'photos', 'plants']);
		const primaryList = nodes(content).find(({ type }) => type === 'ul');
		expect(primaryList.props.children).toHaveLength(4);
		expect(ids(primaryList.props.children[0])).toEqual(['gardens']);
		view.cleanup();
	});

	it.each([
		...routeCatalog.map((route) => [route.path, ({ photos: 'Gallery', plants: 'PlantDB' })[route.id] ?? route.label]),
		['/gardens/new', 'Gardens'], ['/gardens/garden-1', 'Gardens'], ['/gardens/garden-1/edit', 'Gardens'],
		['/gardens/new/wizard/draft-1', 'Gardens'], ['/notes/new/draft-1', 'Notes'], ['/missing-destination', 'Navigation'],
	])('identifies %s with the noninteractive phone label %s', (path, expected) => {
		hooks.path = path;
		const view = mount(375);
		const strip = drawer(view.render()).props.renderTrigger({});
		const indicator = nodes(strip).find(({ props }) => props.class === 'standard-navigation__current');
		expect(indicator.type).toBe('span');
		expect(indicator.props.children).toBe(expected);
		expect(indicator.props.title).toBe(expected);
		expect(indicator.props.href).toBeUndefined();
		view.cleanup();
	});

	it('keeps the Drawer stable within each presentation and remounts only across its breakpoints', () => {
		const view = mount(320);
		expect(drawer(view.render()).key).toBe('small');
		expect(drawer(view.resize(767)).key).toBe('small');
		expect(drawer(view.resize(768)).key).toBe('medium');
		expect(drawer(view.resize(1023)).key).toBe('medium');
		expect(drawer(view.resize(1024))).toBeUndefined();
		expect(drawer(view.resize(1023)).key).toBe('medium');
		expect(drawer(view.resize(767)).key).toBe('small');
		view.cleanup();
	});

	it('disposes or remounts the Drawer and focuses visible controls across breakpoints', () => {
		const view = mount(900);
		view.doc.activeElement = { insideNavigation: true, closest: () => ({ dataset: { standardDestination: 'templates' } }) };
		expect(drawer(view.resize(1024))).toBeUndefined();
		view.flush();
		expect(view.focus).toHaveBeenLastCalledWith('gardens', { preventScroll: true });
		view.doc.activeElement = { insideNavigation: true, closest: () => ({ dataset: { standardDestination: 'templates' } }) };
		expect(drawer(view.resize(900))).toBeDefined();
		view.flush();
		expect(view.focus).toHaveBeenLastCalledWith('gardens', { preventScroll: true });
		view.doc.activeElement = { insideNavigation: true, closest: () => null };
		const small = view.resize(767);
		expect(drawer(small).key).toBe('small');
		view.flush();
		expect(view.phoneTrigger.focus).toHaveBeenCalledWith({ preventScroll: true });
		view.cleanup();
	});

	it('chooses the visible iconbar instead of links inside its closed Drawer', () => {
		const view = mount(1280);
		const visibleFocus = vi.fn();
		const hiddenFocus = vi.fn();
		view.root.querySelector.mockReturnValue({ querySelectorAll: () => [{ dataset: { standardDestination: 'gardens' }, focus: visibleFocus }] });
		view.root.querySelectorAll = () => [{ dataset: { standardDestination: 'templates' }, focus: hiddenFocus }];
		view.doc.activeElement = { insideNavigation: true, closest: () => ({ dataset: { standardDestination: 'templates' } }) };
		view.resize(900);
		view.flush();
		expect(visibleFocus).toHaveBeenCalledWith({ preventScroll: true });
		expect(hiddenFocus).not.toHaveBeenCalled();
		view.cleanup();
	});

	it('does not steal workspace focus on resize and removes media listeners on unmount', () => {
		const view = mount(900);
		view.resize(1280);
		view.flush();
		expect(view.focus).not.toHaveBeenCalled();
		view.cleanup();
		expect([...view.media.values()].every(({ listeners }) => listeners.size === 0)).toBe(true);
	});

	it('falls back to the logo if Standard navigation and its invoking control are removed', () => {
		const view = mount(900);
		view.doc.activeElement = { insideNavigation: true };
		view.cleanup();
		view.root.isConnected = false;
		view.flush();
		expect(view.logo.focus).toHaveBeenCalledWith({ preventScroll: true });
	});

	it('leaves the independent legacy Home navigation configuration unchanged', () => {
		expect(navigationGroups.map(({ id }) => id)).toEqual(['home', 'activities', 'workspaces', 'settings', 'other']);
		expect(primaryActionIds).toEqual(['plants', 'harvest', 'photos', 'tasks', 'calendar', 'notes']);
		expect(secondaryDestinationIds).toEqual(['wishlist', 'gardens', 'journal', 'search', 'templates', 'locations', 'settings', 'help', 'about']);
	});
});
