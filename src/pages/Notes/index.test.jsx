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
		preference: { drafts: false, notes: true, gardens: {} },
		deletingId: null,
		onDelete: vi.fn(),
		onFilter: vi.fn(),
		onClearFilter: vi.fn(),
		onDraftsUserToggle: vi.fn(),
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
			filter: 'kitchen', preference: { drafts: false, notes: false, gardens: { [garden.id]: false } }, onToggleGarden,
		}));
		const filteredDetails = nodes(filtered).find((node) => node.props?.open === true);
		expect(filteredDetails).toBeTruthy();
		filteredDetails.props.onToggle({ currentTarget: { open: true } });
		expect(onToggleGarden).not.toHaveBeenCalled();

		const restored = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [note], drafts: [], gardens: [garden] },
			preference: { drafts: false, notes: false, gardens: { [garden.id]: false } },
		}));
		expect(nodes(restored).filter((node) => node.type === 'details').every((node) => node.props.open === false)).toBe(true);
	});

	it('filters drafts without changing their independent resume destinations and offers a clear no-results state', () => {
		const drafts = [
			{ id: 'new-draft', subjectId: null, isNew: true, text: 'New seed idea', gardenId: null, updatedAt: '2026-11-24T12:00:00.000Z' },
			{ id: 'existing-draft', subjectId: 'saved-note', isNew: false, text: 'Revise pruning', gardenId: null, updatedAt: '2026-11-23T12:00:00.000Z' },
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

	it('renders recoverable drafts as a compact collapsed accordion with persisted ordinary toggles', () => {
		const onDraftsUserToggle = vi.fn();
		const drafts = [
			{ id: 'new-draft', subjectId: null, isNew: true, text: 'Newest draft', gardenId: null, updatedAt: '2026-11-24T12:00:00.000Z' },
			{ id: 'existing-draft', subjectId: 'saved-note', isNew: false, text: 'Older draft', gardenId: null, updatedAt: '2026-11-23T12:00:00.000Z' },
		];
		const tree = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [], drafts, gardens: [] }, onDraftsUserToggle,
		}));
		const accordion = nodes(tree).find((node) => node.props?.['data-notes-group'] === 'drafts');
		const details = nodes(accordion).find((node) => node.type === 'details');
		expect(details.props.open).toBe(false);
		expect(text(accordion)).toContain('Unfinished drafts');
		expect(nodes(accordion).find((node) => node.props?.['aria-label'] === '2 drafts')).toBeTruthy();
		expect(nodes(accordion).filter((node) => node.type === 'a' && node.props?.class?.includes('notes-draft-row')).map(({ props: rowProps }) => rowProps.href)).toEqual([
			'/notes/new/new-draft', '/notes/saved-note',
		]);
		const summary = nodes(accordion).find((node) => node.type === 'summary');
		summary.props.onClick({ currentTarget: { parentElement: { open: false } }, preventDefault: vi.fn() });
		expect(onDraftsUserToggle).toHaveBeenCalledWith(true);
	});

	it('lets an explicit collapse supersede contextual expansion without confusing it with automatic state', () => {
		const onDraftsUserToggle = vi.fn();
		const drafts = [
			{ id: 'target-draft', subjectId: null, isNew: true, text: 'Target', gardenId: null, updatedAt: '2026-11-24T12:00:00.000Z' },
			{ id: 'newer-draft', subjectId: null, isNew: true, text: 'Newer but not target', gardenId: null, updatedAt: '2026-11-25T12:00:00.000Z' },
		];
		const tree = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [], drafts, gardens: [] },
			highlightedDraftId: 'target-draft', contextualExpansionActive: true, onDraftsUserToggle,
		}));
		const accordion = nodes(tree).find((node) => node.props?.['data-notes-group'] === 'drafts');
		const details = nodes(accordion).find((node) => node.type === 'details');
		expect(details.props.open).toBe(true);
		const highlighted = nodes(accordion).filter((node) => node.props?.class?.includes('notes-draft-row--highlighted'));
		expect(highlighted).toHaveLength(1);
		expect(highlighted[0].props['data-draft-id']).toBe('target-draft');
		const summary = nodes(accordion).find((node) => node.type === 'summary');
		summary.props.onClick({ currentTarget: { parentElement: { open: true } }, preventDefault: vi.fn() });
		expect(onDraftsUserToggle).toHaveBeenCalledWith(false);

		const nonexistent = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [], drafts, gardens: [] }, highlightedDraftId: 'missing',
		}));
		expect(nodes(nonexistent).some((node) => node.props?.class?.includes('notes-draft-row--highlighted'))).toBe(false);
	});

	it('keeps filter-driven draft expansion locked without reporting a user preference', () => {
		const onDraftsUserToggle = vi.fn();
		const preventDefault = vi.fn();
		const draft = { id: 'draft', subjectId: null, isNew: true, text: 'Match me', gardenId: null, updatedAt: '2026-11-24T12:00:00.000Z' };
		const tree = NotesWorkspaceView(props({
			state: { status: 'ready', notes: [], drafts: [draft], gardens: [] },
			filter: 'match', onDraftsUserToggle,
		}));
		const accordion = nodes(tree).find((node) => node.props?.['data-notes-group'] === 'drafts');
		expect(nodes(accordion).find((node) => node.type === 'details').props.open).toBe(true);
		nodes(accordion).find((node) => node.type === 'summary').props.onClick({
			currentTarget: { parentElement: { open: true } }, preventDefault,
		});
		expect(preventDefault).toHaveBeenCalledOnce();
		expect(onDraftsUserToggle).not.toHaveBeenCalled();
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
