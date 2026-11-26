import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ slots: [], index: 0, pending: [], dialogs: [], tabs: new Map() }));
vi.mock('preact/hooks', () => ({
	useRef(initial) { return harness.slots[harness.index++] ??= { current: initial }; },
	useState(initial) {
		const index = harness.index++;
		if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? initial() : initial;
		return [harness.slots[index], (value) => {
			harness.slots[index] = typeof value === 'function' ? value(harness.slots[index]) : value;
		}];
	},
	useEffect(effect, dependencies) {
		const index = harness.index++;
		const previous = harness.slots[index];
		if (!previous || dependencies.some((value, dependency) => !Object.is(value, previous.dependencies[dependency]))) {
			harness.slots[index] = { dependencies, cleanup: previous?.cleanup };
			harness.pending.push(() => {
				harness.slots[index].cleanup?.();
				harness.slots[index].cleanup = effect();
			});
		}
	},
}));
vi.mock('bootstrap/js/dist/dialog.js', () => ({
	default: class Dialog {
		constructor(element) {
			this.element = element;
			this.show = vi.fn(async () => {
				element.open = true;
				element.dispatchEvent(new Event('shown.bs.dialog'));
			});
			this.hide = vi.fn(async () => {
				const event = new Event('hide.bs.dialog', { cancelable: true });
				element.dispatchEvent(event);
				if (event.defaultPrevented) return;
				element.open = false;
				element.dispatchEvent(new Event('hidden.bs.dialog'));
			});
			this.dispose = vi.fn();
			harness.dialogs.push(this);
		}
	},
}));
vi.mock('bootstrap/js/dist/tab.js', () => ({
	default: class Tab {
		static getOrCreateInstance(element) {
			if (!element) return null;
			if (!harness.tabs.has(element)) harness.tabs.set(element, new this(element));
			return harness.tabs.get(element);
		}
		constructor(element) {
			this.show = vi.fn(async () => element.dispatchEvent(new Event('shown.bs.tab')));
			this.dispose = vi.fn();
		}
	},
}));

import {
	createGardenIdentityDraft, GardenIdentityBadge, GardenIdentityDialogView,
	GardenIdentityModal, resetGardenIdentityDraft, validateGardenIdentityDraft,
} from './GardenIdentity.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props.children)];
}

function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ');
}

function dialog(overrides = {}) {
	return GardenIdentityDialogView({
		draftIcon: 'flower1',
		draftColor: '#287D46',
		customIcon: '',
		customColor: '',
		isCustomIcon: false,
		isCustomColor: false,
		activeType: 'color',
		...overrides,
	});
}

function mountModal(initialProps = {}) {
	const dialogElement = new EventTarget();
	dialogElement.open = false;
	const colorTab = new EventTarget();
	const iconTab = new EventTarget();
	let props = {
		open: true,
		type: 'color',
		icon: 'flower1',
		color: '#287D46',
		onSave: vi.fn(async () => true),
		onDismiss: vi.fn(),
		...initialProps,
	};
	const render = () => {
		harness.index = 0;
		const tree = GardenIdentityModal(props);
		const all = nodes(tree);
		all.find((node) => node.type === 'dialog').ref.current = dialogElement;
		all.find((node) => node.props?.id === 'garden-identity-color-tab').ref.current = colorTab;
		all.find((node) => node.props?.id === 'garden-identity-icon-tab').ref.current = iconTab;
		for (const effect of harness.pending.splice(0)) effect();
		return tree;
	};
	render();
	return {
		render,
		dialogElement,
		colorTab,
		iconTab,
		instance: harness.dialogs.at(-1),
		props: () => props,
		setProps(changes) { props = { ...props, ...changes }; return render(); },
		cleanup() { for (const slot of harness.slots) slot?.cleanup?.(); },
	};
}

beforeEach(() => {
	harness.slots = [];
	harness.index = 0;
	harness.pending = [];
	harness.dialogs = [];
	harness.tabs = new Map();
});

describe('Garden identity UI', () => {
	it('renders selected values and null or invalid values with safe badge fallbacks', () => {
		const selected = GardenIdentityBadge({ icon: 'tree-fill', color: '#287D46' });
		expect(nodes(selected).find((node) => node.type === 'i').props.class).toBe('bi bi-tree-fill');
		expect(selected.props.style['--garden-identity-color']).toBe('#287D46');

		const fallback = GardenIdentityBadge({ icon: 'removed-name', color: 'bad' });
		expect(nodes(fallback).find((node) => node.type === 'i').props.class).toBe('bi bi-leaf-fill');
		expect(fallback.props.style['--garden-identity-color']).toBe('#6B7280');
	});

	it('initializes fresh independent drafts for the requested tab', () => {
		expect(createGardenIdentityDraft('flower1', '#287D46', 'icon')).toMatchObject({
			activeType: 'icon', draftIcon: 'flower1', draftColor: '#287D46',
			isCustomIcon: false, isCustomColor: false,
		});
		expect(createGardenIdentityDraft('alarm', '#abcdef', 'color')).toMatchObject({
			activeType: 'color', draftIcon: 'alarm', draftColor: '#ABCDEF',
			customIcon: 'alarm', customColor: '#ABCDEF', isCustomIcon: true, isCustomColor: true,
		});
	});

	it('resets only the active field while preserving the other draft field', () => {
		const iconDraft = createGardenIdentityDraft('flower1', '#287D46', 'icon');
		expect(resetGardenIdentityDraft(iconDraft)).toMatchObject({
			draftIcon: null, draftColor: '#287D46', customIcon: '', isCustomIcon: false,
		});
		const colorDraft = createGardenIdentityDraft('flower1', '#287D46', 'color');
		expect(resetGardenIdentityDraft(colorDraft)).toMatchObject({
			draftIcon: 'flower1', draftColor: null, customColor: '', isCustomColor: false,
		});
	});

	it('uses Bootstrap 6 tabs, responsive fullscreen Dialog, and one Save Identity action', () => {
		const color = dialog();
		const root = nodes(color).find((node) => node.type === 'dialog');
		expect(root.props.class).toContain('md-down:dialog-fullscreen');
		expect(nodes(color).filter((node) => node.props?.['data-bs-toggle'] === 'tab')).toHaveLength(2);
		expect(text(color)).toContain('Save Identity');
		expect(text(dialog({ activeType: 'icon' }))).toContain('Save Identity');
		expect(text(color)).not.toContain('Save Color');
		expect(text(color)).not.toContain('Save Icon');
	});

	it('keeps custom inputs hidden until selected and exposes accessible validation errors', () => {
		expect(nodes(dialog()).some((node) => node.props?.id === 'garden-identity-custom-icon')).toBe(false);
		const invalid = dialog({
			activeType: 'icon', isCustomIcon: true, customIcon: 'not-an-icon', draftIcon: null,
		});
		const input = nodes(invalid).find((node) => node.props?.id === 'garden-identity-custom-icon');
		expect(input.props.class).toContain('is-invalid');
		expect(input.props['aria-invalid']).toBe('true');
		expect(input.props['aria-describedby']).toBe('garden-identity-icon-error');
		expect(text(invalid)).toContain('Invalid Bootstrap icon');
		expect(nodes(invalid).find((node) => node.type === 'button' && text(node).includes('Save Identity')).props.disabled).toBe(true);
	});

	it('routes independent resets, Cancel, X, selections, and unified saves through their handlers', () => {
		const onResetColor = vi.fn();
		const onResetIcon = vi.fn();
		const onCancel = vi.fn();
		const onSubmit = vi.fn();
		const onSelectColor = vi.fn();

		const tree = dialog({
			onResetColor,
			onResetIcon,
			onCancel,
			onSubmit,
			onSelectColor,
		});

		const all = nodes(tree);

		all.find((node) => node.type === 'button' && text(node) === 'Reset Color').props.onClick();
		all.find((node) => node.type === 'button' && text(node) === 'Reset Icon').props.onClick();
		all.find((node) => node.type === 'button' && text(node) === 'Cancel').props.onClick();
		all.find((node) => node.props?.class?.includes('garden-identity-dialog__close')).props.onClick();
		all.find((node) => node.props?.['aria-label'] === 'Forest, #287D46').props.onClick();
		nodes(tree).find((node) => node.type === 'form').props.onSubmit();

		expect(onResetColor).toHaveBeenCalledOnce();
		expect(onResetIcon).toHaveBeenCalledOnce();
		expect(onCancel).toHaveBeenCalledTimes(2);
		expect(onSelectColor).toHaveBeenCalledWith('#287D46');
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it('requires both draft fields to be valid and retains persistence errors', () => {
		const invalidColor = dialog({
			isCustomColor: true, customColor: '#12', draftColor: null,
			error: 'This Garden identity could not be saved. Your selection is still here.',
		});
		expect(nodes(invalidColor).find((node) => node.type === 'button' && text(node).includes('Save Identity')).props.disabled).toBe(true);
		expect(text(invalidColor)).toContain('Your selection is still here');
		expect(nodes(invalidColor).some((node) => node.props?.role === 'alert')).toBe(true);
		expect(validateGardenIdentityDraft({
			draftIcon: 'flower1', draftColor: '#287D46', customIcon: '', customColor: '#12',
			isCustomIcon: false, isCustomColor: true,
		}).isValid).toBe(false);
	});

	it('shares color and icon drafts across tabs and saves both together', async () => {
		const onSave = vi.fn(async () => true);
		const view = mountModal({ onSave });
		let tree = view.render();
		nodes(tree).find((node) => node.props?.['aria-label'] === 'Blue, #397CAD').props.onClick();
		await harness.tabs.get(view.iconTab).show();
		tree = view.render();
		nodes(tree).find((node) => node.props?.['aria-label'] === 'Use tree-fill icon').props.onClick();
		tree = view.render();
		const preview = nodes(tree).find((node) => node.props?.['aria-label'] === 'Garden identity preview');
		expect(nodes(preview).find((node) => node.props?.class?.includes('garden-identity-badge')).props.style['--garden-identity-color']).toBe('#397CAD');
		nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
		await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith({ icon: 'tree-fill', color: '#397CAD' }));
		expect(view.instance.hide).toHaveBeenCalledOnce();
		view.cleanup();
	});

	it.each(['color', 'icon'])('opens the requested %s tab first', (type) => {
		const view = mountModal({ type });
		const requestedTab = type === 'icon' ? view.iconTab : view.colorTab;
		expect(harness.tabs.get(requestedTab).show).toHaveBeenCalledOnce();
		view.cleanup();
	});

	it('preserves either unchanged field and supports unchanged and default identities', async () => {
		for (const scenario of [
			{ initial: { icon: 'flower1', color: '#BD4851' }, select: 'Use tree-fill icon', expected: { icon: 'tree-fill', color: '#BD4851' } },
			{ initial: { icon: 'flower1', color: '#BD4851' }, select: 'Blue, #397CAD', expected: { icon: 'flower1', color: '#397CAD' } },
			{ initial: { icon: 'flower1', color: '#BD4851' }, expected: { icon: 'flower1', color: '#BD4851' } },
			{ initial: { icon: null, color: null }, select: 'Use tree-fill icon', expected: { icon: 'tree-fill', color: null } },
		]) {
			const onSave = vi.fn(async () => true);
			const view = mountModal({ ...scenario.initial, onSave });
			let tree = view.render();
			if (scenario.select) nodes(tree).find((node) => node.props?.['aria-label'] === scenario.select).props.onClick();
			tree = view.render();
			nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
			await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith(scenario.expected));
			view.cleanup();
			harness.slots = [];
			harness.pending = [];
			harness.dialogs = [];
			harness.tabs = new Map();
		}
	});

	it('resets the icon independently and cancel or dismissal discards all pending changes', async () => {
		const onSave = vi.fn(async () => true);
		const onDismiss = vi.fn();
		const view = mountModal({ icon: 'flower1', color: '#BD4851', onSave, onDismiss });
		let tree = view.render();
		nodes(tree).find((node) => node.props?.['aria-label'] === 'Blue, #397CAD').props.onClick();
		await harness.tabs.get(view.iconTab).show();
		tree = view.render();
		nodes(tree).find((node) => node.props?.['aria-label'] === 'Use tree-fill icon').props.onClick();
		tree = view.render();
		nodes(tree).find((node) => node.type === 'button' && text(node) === 'Reset Icon').props.onClick();
		await harness.tabs.get(view.colorTab).show();
		tree = view.render();
		const resetPreview = nodes(tree).find((node) => node.props?.['aria-label'] === 'Garden identity preview');
		expect(nodes(resetPreview).find((node) => node.type === 'i').props.class).toBe('bi bi-leaf-fill');
		expect(nodes(resetPreview).find((node) => node.props?.class?.includes('garden-identity-badge')).props.style['--garden-identity-color']).toBe('#397CAD');
		nodes(tree).find((node) => node.type === 'button' && text(node) === 'Cancel').props.onClick();
		expect(onDismiss).toHaveBeenCalledOnce();
		expect(onSave).not.toHaveBeenCalled();

		view.setProps({ open: false });
		view.setProps({ open: true });
		tree = view.render();
		const reopened = nodes(tree).find((node) => node.props?.['aria-label'] === 'Garden identity preview');
		expect(nodes(reopened).find((node) => node.type === 'i').props.class).toBe('bi bi-flower1');
		expect(nodes(reopened).find((node) => node.props?.class?.includes('garden-identity-badge')).props.style['--garden-identity-color']).toBe('#BD4851');
		await view.instance.hide();
		expect(onDismiss).toHaveBeenCalledTimes(2);
		view.cleanup();
	});

	it('keeps the shared draft open and intact when persistence fails', async () => {
		const onSave = vi.fn(async () => { throw new Error('storage failed'); });
		const view = mountModal({ onSave });
		let tree = view.render();
		nodes(tree).find((node) => node.props?.['aria-label'] === 'Blue, #397CAD').props.onClick();
		tree = view.render();
		nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
		await vi.waitFor(() => expect(text(view.render())).toContain('Your selection is still here'));
		expect(view.dialogElement.open).toBe(true);
		expect(view.instance.hide).not.toHaveBeenCalled();
		const preview = nodes(view.render()).find((node) => node.props?.['aria-label'] === 'Garden identity preview');
		expect(nodes(preview).find((node) => node.props?.class?.includes('garden-identity-badge')).props.style['--garden-identity-color']).toBe('#397CAD');
		view.cleanup();
	});
});
