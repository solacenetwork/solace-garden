import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ slots: [], index: 0, pending: [] }));
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
import { HeaderSearch } from './HeaderSearch.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
function mount(wide = false) {
	let onChange;
	const media = { matches: wide, addEventListener: vi.fn((_, callback) => { onChange = callback; }), removeEventListener: vi.fn() };
	vi.stubGlobal('matchMedia', () => media);
	const doc = { activeElement: null };
	const trigger = { focus: vi.fn(() => { doc.activeElement = trigger; }) };
	const input = { focus: vi.fn(() => { doc.activeElement = input; }) };
	const panel = { ownerDocument: doc, contains: (element) => element === input };
	const render = () => {
		hooks.index = 0;
		const tree = HeaderSearch();
		for (const node of nodes(tree).filter((node) => node.ref)) node.ref.current = node.type === 'input' ? input : node.type === 'form' ? panel : trigger;
		for (const effect of hooks.pending.splice(0)) effect();
		return tree;
	};
	render();
	return {
		render, trigger, input, doc, media,
		resize(matches) { onChange({ matches }); return render(); },
		cleanup() { for (const slot of hooks.slots) slot?.cleanup?.(); },
	};
}
const form = (tree) => nodes(tree).find(({ type }) => type === 'form');
const field = (tree) => nodes(tree).find(({ type }) => type === 'input');
const button = (tree, name) => nodes(tree).find(({ props }) => props['aria-label'] === name);

beforeEach(() => { hooks.slots = []; hooks.index = 0; hooks.pending = []; });
afterEach(() => vi.unstubAllGlobals());

describe('HeaderSearch', () => {
	it('shows inline search at lg and cleans up the media listener', () => {
		const view = mount(true);
		expect(form(view.render()).props.hidden).toBe(false);
		expect(button(view.render(), 'Search').props.hidden).toBe(true);
		expect(button(view.render(), 'Close search').props.hidden).toBe(true);
		view.cleanup();
		expect(view.media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('opens, focuses, closes on Escape and preserves the query on reopen', () => {
		const view = mount();
		expect(form(view.render()).props.hidden).toBe(true);
		button(view.render(), 'Search').props.onClick();
		let tree = view.render();
		expect(form(tree).props.hidden).toBe(false);
		expect(view.input.focus).toHaveBeenCalled();
		field(tree).props.onInput({ currentTarget: { value: 'tomatoes' } });
		const event = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
		form(view.render()).props.onKeyDown(event);
		expect(form(view.render()).props.hidden).toBe(true);
		expect(view.trigger.focus).toHaveBeenCalled();
		expect(event.preventDefault).toHaveBeenCalled();
		button(view.render(), 'Search').props.onClick();
		tree = view.render();
		expect(field(tree).props.value).toBe('tomatoes');
		button(tree, 'Close search').props.onClick();
		expect(form(view.render()).props.hidden).toBe(true);
		view.cleanup();
	});

	it('keeps the same query and sensible focus across responsive presentations', () => {
		const view = mount(true);
		field(view.render()).props.onInput({ currentTarget: { value: 'beans' } });
		view.doc.activeElement = view.input;
		let tree = view.resize(false);
		expect(form(tree).props.hidden).toBe(false);
		expect(field(tree).props.value).toBe('beans');
		tree = view.resize(true);
		expect(field(tree).props.value).toBe('beans');
		expect(view.doc.activeElement).toBe(view.input);
		view.cleanup();
	});

	it('prevents submission and announces unavailability without navigation or storage', () => {
		const navigate = vi.fn();
		const write = vi.fn();
		vi.stubGlobal('location', { assign: navigate });
		vi.stubGlobal('indexedDB', { open: write });
		vi.stubGlobal('localStorage', { setItem: write });
		const view = mount(true);
		const event = { preventDefault: vi.fn() };
		field(view.render()).props.onInput({ currentTarget: { value: '<script>alert(1)</script> & tomatoes' } });
		form(view.render()).props.onSubmit(event);
		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(nodes(view.render()).find(({ props }) => props.role === 'status').props.children).toBe("Search isn't available yet.");
		expect(navigate).not.toHaveBeenCalled();
		expect(write).not.toHaveBeenCalled();
		expect(field(view.render()).props.value).toBe('<script>alert(1)</script> & tomatoes');
		field(view.render()).props.onInput({ currentTarget: { value: 'beans' } });
		expect(nodes(view.render()).some(({ props }) => props.role === 'status')).toBe(false);
		view.cleanup();
	});
});
