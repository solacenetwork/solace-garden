import { describe, expect, it, vi } from 'vitest';
import { NotesWorkspaceView } from './index.jsx';

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

function props(overrides = {}) {
	return {
		state: { status: 'ready', notes: [], drafts: [], gardens: [] },
		filter: '',
		preference: { notes: true, gardens: {} },
		deletingId: null,
		onDelete: vi.fn(),
		onFilter: vi.fn(),
		onClearFilter: vi.fn(),
		onToggleNotes: vi.fn(),
		onToggleGarden: vi.fn(),
		...overrides,
	};
}

describe('NotesWorkspaceView', () => {
	it('keeps the application Notes accordion expanded and present for an empty collection', () => {
		const tree = NotesWorkspaceView(props());
		const details = nodes(tree).find((node) => node.type === 'details');
		expect(details.props.open).toBe(true);
		expect(text(details)).toContain('Notes');
		expect(text(details)).toContain('No application-level Notes yet');
		expect(text(tree)).not.toContain('Unassigned Notes');
		expect(nodes(tree).some((node) => node.type === 'h2' && text(node) === 'Gardens')).toBe(false);
	});

	it('renders UUID-keyed independent Garden accordions collapsed with counts and existing Note actions', () => {
		const onDelete = vi.fn();
		const garden = { id: 'garden-uuid', name: 'A Garden With a Long Name', status: 'archived' };
		const note = { id: 'note-uuid', gardenId: garden.id, text: 'Saved content', updatedAt: '2026-11-24T12:00:00.000Z' };
		const tree = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [note], drafts: [], gardens: [garden] }, onDelete,
		}));
		expect(nodes(tree).filter((node) => node.type === 'h2').map(text)).toEqual(['Gardens']);
		const gardenAccordion = nodes(tree).find((node) => node.props?.['data-notes-group'] === garden.id);
		expect(gardenAccordion).toBeTruthy();
		expect(nodes(gardenAccordion).find((node) => node.type === 'details').props.open).toBe(false);
		expect(text(gardenAccordion)).toContain(garden.name);
		expect(nodes(gardenAccordion).find((node) => node.props?.['aria-label'] === '1 Note')).toBeTruthy();
		expect(nodes(gardenAccordion).find((node) => node.props?.href === `/notes/${note.id}`)).toBeTruthy();
		const deleteButton = nodes(gardenAccordion).find((node) => node.type === 'button');
		deleteButton.props.onClick();
		expect(onDelete).toHaveBeenCalledWith(note);
	});

	it('temporarily opens matching groups and restores ordinary preferences when cleared', () => {
		const garden = { id: 'garden-uuid', name: 'Kitchen Garden', status: 'active' };
		const note = { id: 'note-uuid', gardenId: garden.id, text: 'Basil', updatedAt: '2026-11-24T12:00:00.000Z' };
		const onToggleGarden = vi.fn();
		const filtered = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [note], drafts: [], gardens: [garden] },
			filter: 'kitchen', preference: { notes: false, gardens: { [garden.id]: false } }, onToggleGarden,
		}));
		const filteredDetails = nodes(filtered).find((node) => node.props?.open === true);
		expect(filteredDetails).toBeTruthy();
		filteredDetails.props.onToggle({ currentTarget: { open: true } });
		expect(onToggleGarden).not.toHaveBeenCalled();

		const restored = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [note], drafts: [], gardens: [garden] },
			preference: { notes: false, gardens: { [garden.id]: false } },
		}));
		expect(nodes(restored).filter((node) => node.type === 'details').every((node) => node.props.open === false)).toBe(true);
	});

	it('filters drafts without changing their independent resume destinations and offers a clear no-results state', () => {
		const drafts = [
			{ id: 'new-draft', subjectId: null, isNew: true, text: 'New seed idea', updatedAt: '2026-11-24T12:00:00.000Z' },
			{ id: 'existing-draft', subjectId: 'saved-note', isNew: false, text: 'Revise pruning', updatedAt: '2026-11-23T12:00:00.000Z' },
		];
		const state = { status: 'ready', notes: [], drafts, gardens: [] };
		const visible = NotesWorkspaceView(props({ state, filter: 'pruning' }));
		expect(nodes(visible).filter((node) => node.props?.href).map(({ props: nodeProps }) => nodeProps.href)).toEqual(['/notes/saved-note']);
		expect(text(visible)).toContain('Unfinished drafts');

		const onClearFilter = vi.fn();
		const empty = NotesWorkspaceView(props({ state, filter: 'nothing here', onClearFilter }));
		expect(text(empty)).toContain('No matching Notes');
		const clear = nodes(empty).find((node) => node.type === 'button' && text(node) === 'Clear filter');
		clear.props.onClick();
		expect(onClearFilter).toHaveBeenCalledOnce();
	});

	it('retains the deleting action state', () => {
		const note = { id: 'note-uuid', gardenId: null, text: 'Delete safely', updatedAt: '2026-11-24T12:00:00.000Z' };
		const tree = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [note], drafts: [], gardens: [] }, deletingId: note.id,
		}));
		const button = nodes(tree).find((node) => node.type === 'button');
		expect(button.props.disabled).toBe(true);
		expect(text(button)).toContain('Deleting…');
	});
});
