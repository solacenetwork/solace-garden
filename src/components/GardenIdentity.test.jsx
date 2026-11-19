import { describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));
vi.mock('bootstrap/js/dist/tab.js', () => ({ default: class Tab {} }));

import {
	createGardenIdentityDraft, GardenIdentityBadge, GardenIdentityDialogView,
	resetGardenIdentityDraft,
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

	it('uses Bootstrap 6 tabs, responsive fullscreen Dialog, and tab-specific Save labels', () => {
		const color = dialog();
		const root = nodes(color).find((node) => node.type === 'dialog');
		expect(root.props.class).toContain('md-down:dialog-fullscreen');
		expect(nodes(color).filter((node) => node.props?.['data-bs-toggle'] === 'tab')).toHaveLength(2);
		expect(text(color)).toContain('Save Color');
		expect(text(dialog({ activeType: 'icon' }))).toContain('Save Icon');
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
		expect(nodes(invalid).find((node) => node.type === 'button' && text(node).includes('Save Icon')).props.disabled).toBe(true);
	});

	it('routes Reset, Cancel, X, selections, and tab-specific saves through independent handlers', () => {
		const onReset = vi.fn();
		const onCancel = vi.fn();
		const onSubmit = vi.fn();
		const onSelectColor = vi.fn();
		const tree = dialog({ onReset, onCancel, onSubmit, onSelectColor });
		const all = nodes(tree);
		all.find((node) => node.type === 'button' && text(node) === 'Reset').props.onClick();
		all.find((node) => node.type === 'button' && text(node) === 'Cancel').props.onClick();
		all.find((node) => node.props?.class?.includes('garden-identity-dialog__close')).props.onClick();
		all.find((node) => node.props?.['aria-label'] === 'Forest, #287D46').props.onClick();
		nodes(tree).find((node) => node.type === 'form').props.onSubmit();
		expect(onReset).toHaveBeenCalledOnce();
		expect(onCancel).toHaveBeenCalledTimes(2);
		expect(onSelectColor).toHaveBeenCalledWith('#287D46');
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it('disables only the active invalid tab save and retains persistence errors', () => {
		const invalidColor = dialog({
			isCustomColor: true, customColor: '#12', draftColor: null,
			error: 'This Garden identity could not be saved. Your selection is still here.',
		});
		expect(nodes(invalidColor).find((node) => node.type === 'button' && text(node).includes('Save Color')).props.disabled).toBe(true);
		expect(text(invalidColor)).toContain('Your selection is still here');
		expect(nodes(invalidColor).some((node) => node.props?.role === 'alert')).toBe(true);
	});
});
