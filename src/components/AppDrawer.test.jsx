import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Follow the existing hook-slot convention; Bootstrap's real dialog behavior is
// exercised separately in the browser, while these tests cover our lifecycle.
const hooks = vi.hoisted(() => ({ slots: [], index: 0, effects: [], instances: [] }));
vi.mock('preact/hooks', () => ({
	useRef(initial) {
		const index = hooks.index++;
		return hooks.slots[index] ??= { current: initial };
	},
	useState(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = initial;
		return [hooks.slots[index], (value) => { hooks.slots[index] = value; }];
	},
	useEffect(effect) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) {
			hooks.slots[index] = true;
			hooks.effects.push(effect);
		}
	},
}));
vi.mock('bootstrap/js/dist/drawer.js', () => ({
	default: class Drawer {
		constructor(element) {
			this.show = vi.fn(() => {
				element.dispatchEvent(new Event('show.bs.drawer'));
				element.open = true;
			});
			this.hide = vi.fn();
			this.dispose = vi.fn(() => { element.open = false; });
			hooks.instances.push(this);
		}
	},
}));

import { AppDrawer } from './AppDrawer.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
function mount(props = {}) {
	const dialog = new EventTarget();
	dialog.open = false;
	dialog.ownerDocument = { activeElement: null };
	dialog.contains = vi.fn(() => true);
	vi.spyOn(dialog, 'removeEventListener');
	const trigger = { isConnected: true, focus: vi.fn() };
	const closeControl = { focus: vi.fn() };
	let cleanup;
	const render = () => {
		hooks.index = 0;
		return AppDrawer({ id: 'info', title: 'Information panel', children: 'Panel content', ...props });
	};
	const tree = render();
	nodes(tree).find(({ type }) => type === 'dialog').ref.current = dialog;
	nodes(tree).find(({ type }) => type === 'button').ref.current = trigger;
	nodes(tree).find(({ props }) => props.class === 'btn-close app-drawer__icon-close').ref.current = closeControl;
	for (const effect of hooks.effects.splice(0)) cleanup = effect();
	return {
		render, dialog, trigger, closeControl, cleanup,
		instance: hooks.instances.at(-1),
		open: () => nodes(render()).find(({ type }) => type === 'button').props.onClick({ currentTarget: trigger }),
		emit: (name) => dialog.dispatchEvent(new Event(`${name}.bs.drawer`)),
		close: () => nodes(render()).find(({ props }) => props.class === 'btn-close app-drawer__icon-close').props.onClick(),
	};
}

beforeEach(() => {
	hooks.slots = [];
	hooks.effects = [];
	hooks.instances = [];
	vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42));
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('AppDrawer', () => {
	it.each([undefined, null, '', 'invalid', 'bottom', 'top', 'start', 'end'])(
		'resolves placement %s safely without changing the shared instance lifecycle', (placement) => {
			const view = mount({ placement });
			const expected = ['top', 'start', 'end'].includes(placement) ? placement : 'bottom';
			const dialog = nodes(view.render()).find(({ type }) => type === 'dialog');
			expect(dialog.props.class).toBe(`drawer drawer-${expected} app-drawer app-drawer--${expected}`);
			expect(dialog.props['aria-labelledby']).toBe('info-title');
			expect(nodes(view.render()).find(({ type }) => type === 'h2').props.id).toBe('info-title');
			view.open();
			view.emit('shown');
			view.close();
			expect(view.instance.show).toHaveBeenCalledWith(view.trigger);
			expect(view.instance.hide).toHaveBeenCalledOnce();
			expect(hooks.instances).toHaveLength(1);
			view.cleanup();
			expect(view.instance.dispose).toHaveBeenCalledOnce();
		},
	);

	it('preserves the Information trigger, content, accessible close and footer', () => {
		const view = mount();
		const all = nodes(view.render());
		expect(all.find(({ type }) => type === 'span').props.children).toBe('Information');
		expect(all.find(({ props }) => props.class === 'drawer-body app-drawer__body').props.children).toBe('Panel content');
		expect(all.find(({ props }) => props.class === 'btn-close app-drawer__icon-close').props['aria-label']).toBe('Close Information panel');
		const footerClose = all.find(({ props }) => props.class === 'app-button app-drawer__close');
		expect(footerClose.props.children).toBe('Close');
		view.open();
		view.emit('shown');
		footerClose.props.onClick();
		expect(view.instance.hide).toHaveBeenCalledOnce();
		view.cleanup();
	});

	it('forwards native trigger props and restores focus for a custom trigger', () => {
		const view = mount({
			renderTrigger: (props) => <button class="custom-trigger" {...props}>Open custom panel</button>,
			children: ({ close }) => <button class="custom-close" onClick={close}>Done</button>,
			style: { '--app-drawer-width': '280px' },
		});
		const trigger = () => nodes(view.render()).find(({ props }) => props.class === 'custom-trigger');
		expect(trigger().props).toMatchObject({ type: 'button', 'aria-controls': 'info', 'aria-expanded': false, hidden: false });
		expect(nodes(view.render()).find(({ type }) => type === 'dialog').props.style).toEqual({ '--app-drawer-width': '280px' });
		view.open();
		expect(trigger().props).toMatchObject({ 'aria-expanded': true, hidden: true });
		view.emit('shown');
		nodes(view.render()).find(({ props }) => props.class === 'custom-close').props.onClick();
		expect(view.instance.hide).toHaveBeenCalledOnce();
		expect(trigger().props.hidden).toBe(true);
		view.emit('hidden');
		expect(trigger().props).toMatchObject({ 'aria-expanded': false, hidden: false });
		requestAnimationFrame.mock.calls.at(-1)[0]();
		expect(view.trigger.focus).toHaveBeenCalledWith({ preventScroll: true });
		view.cleanup();
	});

	it('corrects initial focus only when native dialog focus stayed outside', () => {
		const view = mount();
		view.open();
		view.emit('shown');
		expect(view.closeControl.focus).not.toHaveBeenCalled();
		view.dialog.contains.mockReturnValue(false);
		view.emit('shown');
		expect(view.closeControl.focus).toHaveBeenCalledWith({ preventScroll: true });
		view.cleanup();
	});

	it('defers rapid close until the opening transition completes', () => {
		const view = mount();
		view.open();
		view.close();
		view.dialog.contains.mockReturnValue(false);
		expect(view.instance.hide).not.toHaveBeenCalled();
		view.emit('shown');
		expect(view.instance.hide).toHaveBeenCalledOnce();
		expect(view.closeControl.focus).not.toHaveBeenCalled();
		view.emit('hidden');
		view.open();
		view.emit('shown');
		expect(view.instance.hide).toHaveBeenCalledOnce();
		view.cleanup();
	});

	it('cancels pending focus restoration on reopen and unmount', () => {
		const view = mount();
		view.open();
		view.emit('shown');
		view.emit('hidden');
		view.open();
		expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
		view.emit('hidden');
		view.cleanup();
		expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
		expect(view.trigger.focus).not.toHaveBeenCalled();
	});

	it('does not focus a disconnected invoking element', () => {
		const view = mount();
		view.open();
		view.emit('hidden');
		view.trigger.isConnected = false;
		requestAnimationFrame.mock.calls.at(-1)[0]();
		expect(view.trigger.focus).not.toHaveBeenCalled();
		view.cleanup();
	});

	it('removes all application listeners and disposes while open', () => {
		const view = mount();
		view.open();
		view.cleanup();
		expect(view.dialog.open).toBe(false);
		for (const event of ['show', 'shown', 'hidden']) {
			expect(view.dialog.removeEventListener).toHaveBeenCalledWith(`${event}.bs.drawer`, expect.any(Function));
		}
		view.emit('shown');
		view.emit('hidden');
		expect(view.instance.hide).not.toHaveBeenCalled();
		expect(requestAnimationFrame).not.toHaveBeenCalled();
	});
});
