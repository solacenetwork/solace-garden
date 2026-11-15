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
const toggle = (tree) => nodes(tree).find(({ props }) => props.class === 'standard-sidebar__toggle');
function mount(width = 1280) {
	const media = new Map();
	const frames = new Map();
	let sequence = 0;
	let tree;
	const logo = { focus: vi.fn() };
	const doc = { activeElement: null, querySelector: vi.fn(() => logo) };
	const focus = vi.fn();
	const root = {
		ownerDocument: doc, isConnected: true, querySelector: vi.fn(() => null),
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
		render, doc, focus, media, root, logo,
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
	it('renders four ordered primary destinations, with Templates nested only under Gardens', () => {
		const view = mount();
		const tree = view.render();
		expect(ids(tree)).toEqual(['gardens', 'templates', 'journal', 'photos', 'plants']);
		expect(links(tree).map(({ props }) => props.href)).toEqual(['/gardens', '/templates', '/journal', '/photos', '/plants']);
		expect(links(tree).map(({ props }) => nodes(props.children).find(({ type }) => type === 'span').props.children)).toEqual(['Gardens', 'Templates', 'Journal', 'Gallery', 'PlantDB']);
		const list = nodes(tree).find(({ type }) => type === 'ul');
		expect(list.props.children).toHaveLength(4);
		expect(ids(list.props.children[0])).toEqual(['gardens', 'templates']);
		expect(nodes(tree).find(({ props }) => props.class === 'standard-navigation__secondary').type).toBe('ul');
		expect(drawer(tree)).toBeUndefined();
		view.cleanup();
	});

	it.each([
		['/gardens', 'gardens'], ['/gardens/new', 'gardens'], ['/gardens/new/wizard/draft-1', 'gardens'],
		['/gardens/new/advanced/draft-2', 'gardens'], ['/gardens/garden-1', 'gardens'], ['/gardens/garden-1/edit', 'gardens'],
		['/templates', 'templates'], ['/journal', 'journal'], ['/photos', 'photos'], ['/plants', 'plants'], ['/notes/new/draft-1', undefined],
	])('marks only the exact destination for %s', (path, expected) => {
		hooks.path = path;
		const view = mount();
		expect(links(view.render()).filter(({ props }) => props['aria-current'] === 'page').map(({ props }) => props['data-standard-destination'])).toEqual(expected ? [expected] : []);
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

	it('shares expanded content and delegates ordinary link dismissal without blocking routing', () => {
		const view = mount(900);
		const close = vi.fn();
		const content = drawer(view.render()).props.children({ close });
		expect(ids(content)).toEqual(['gardens', 'templates', 'journal', 'photos', 'plants']);
		for (const link of links(content)) {
			const event = normalClick();
			link.props.onClick(event);
			expect(event.preventDefault).not.toHaveBeenCalled();
		}
		expect(close).toHaveBeenCalledTimes(5);
		for (const event of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) links(content)[0].props.onClick({ button: 0, ...event });
		expect(close).toHaveBeenCalledTimes(5);
		expect(nodes(content).some(({ props }) => props.onKeyDown || props.onCancel || props['data-bs-toggle'])).toBe(false);
		view.cleanup();
	});

	it.each([375, 576, 767])('retains the temporary full-width collapsible navigation at %ipx', (width) => {
		const view = mount(width);
		expect(toggle(view.render()).props['aria-expanded']).toBe(false);
		toggle(view.render()).props.onClick();
		expect(toggle(view.render()).props['aria-expanded']).toBe(true);
		expect(ids(view.render())).toEqual(['gardens', 'templates', 'journal', 'photos', 'plants']);
		expect(drawer(view.render())).toBeUndefined();
		links(view.render())[1].props.onClick(normalClick());
		expect(toggle(view.render()).props['aria-expanded']).toBe(false);
		view.cleanup();
	});

	it('unmounts the medium Drawer and focuses the corresponding visible destination across breakpoints', () => {
		const view = mount(900);
		view.doc.activeElement = { insideNavigation: true, closest: () => ({ dataset: { standardDestination: 'templates' } }) };
		expect(drawer(view.resize(1024))).toBeUndefined();
		view.flush();
		expect(view.focus).toHaveBeenLastCalledWith('templates', { preventScroll: true });
		view.doc.activeElement = { insideNavigation: true, closest: () => ({ dataset: { standardDestination: 'templates' } }) };
		expect(drawer(view.resize(900))).toBeDefined();
		view.flush();
		expect(view.focus).toHaveBeenLastCalledWith('gardens', { preventScroll: true });
		view.doc.activeElement = { insideNavigation: true, closest: () => null };
		const small = view.resize(767);
		expect(drawer(small)).toBeUndefined();
		expect(toggle(small).props['aria-expanded']).toBe(true);
		view.flush();
		expect(view.focus).toHaveBeenLastCalledWith('gardens', { preventScroll: true });
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
