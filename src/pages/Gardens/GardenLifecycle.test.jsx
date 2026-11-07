import { describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

import { GardenLifecycleView, LifecycleDialog } from './GardenLifecycle.jsx';

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

const garden = {
	id: 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01', name: 'Tomatoes', status: 'active',
	isClosed: false, notes: 'Existing notes',
};

describe('Garden lifecycle controls', () => {
	it('offers manual statuses and explicit close/archive actions for an open Garden', () => {
		const onStatusChange = vi.fn();
		const tree = GardenLifecycleView({
			garden, selectedStatus: 'completed', onStatusChange,
			onSaveStatus: vi.fn(), onClose: vi.fn(), onArchive: vi.fn(),
			closeOnComplete: false, onCloseOnCompleteChange: vi.fn(),
		});
		const select = nodes(tree).find((node) => node.type === 'select');
		expect(nodes(select).filter((node) => node.type === 'option').map((node) => node.props.value))
			.toEqual(['planned', 'active', 'completed', 'archived']);
		expect(text(tree)).toContain('Close Garden');
		expect(text(tree)).toContain('Archive Garden');
		expect(text(tree)).toContain('Close Garden after marking it Completed');
		select.props.onChange({ currentTarget: { value: 'planned' } });
		expect(onStatusChange).toHaveBeenCalledWith('planned');
	});

	it('replaces normal controls with Reopen or Unarchive for read-only Gardens', () => {
		const closed = GardenLifecycleView({ garden: { ...garden, status: 'completed', isClosed: true }, onReopen: vi.fn() });
		expect(text(closed)).toContain('Reopen Garden');
		expect(nodes(closed).some((node) => node.type === 'select')).toBe(false);
		const archived = GardenLifecycleView({ garden: { ...garden, status: 'archived', isClosed: true }, onUnarchive: vi.fn() });
		expect(text(archived)).toContain('Unarchive Garden');
		expect(nodes(archived).some((node) => node.type === 'select')).toBe(false);
	});

	it('uses an accessible native dialog and the shared limited Notes counter while closing', () => {
		const tree = LifecycleDialog({
			garden, kind: 'close', notes: '🌱', onNotesChange: vi.fn(),
			onCancel: vi.fn(), onConfirm: vi.fn(), busy: false,
		});
		const dialog = nodes(tree).find((node) => node.type === 'dialog');
		const textarea = nodes(tree).find((node) => node.type === 'textarea');
		expect(dialog.props['aria-labelledby']).toBe('garden-lifecycle-dialog-title');
		expect(textarea.props.maxLength).toBe(1000);
		expect(textarea.props['aria-describedby']).toBe('garden-close-notes-counter');
		expect(text(tree)).toContain('2 / 1,000 characters');
		expect(text(tree)).toContain('read-only');
		expect(text(tree)).toContain('reopen');
	});

	it('requires deliberate archive confirmation without a Notes editor', () => {
		const tree = LifecycleDialog({
			garden, kind: 'archive', notes: '', onCancel: vi.fn(), onConfirm: vi.fn(), busy: false,
		});
		expect(text(tree)).toContain('Archive Garden?');
		expect(text(tree)).toContain('closes it');
		expect(nodes(tree).some((node) => node.type === 'textarea')).toBe(false);
	});
});
