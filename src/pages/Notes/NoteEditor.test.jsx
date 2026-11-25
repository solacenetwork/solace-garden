import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ slots: [], index: 0, effects: [], route: vi.fn() }));

vi.mock('preact-iso', () => ({ useLocation: () => ({ route: hooks.route }) }));
vi.mock('preact/hooks', () => {
	function slot(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = initial();
		return index;
	}
	return {
		useState(initial) {
			const index = slot(() => (typeof initial === 'function' ? initial() : initial));
			return [hooks.slots[index], (value) => {
				hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
			}];
		},
		useRef: (initial) => hooks.slots[slot(() => ({ current: initial }))],
		useMemo: (factory) => hooks.slots[slot(factory)],
		useEffect(effect) { hooks.effects.push(effect); },
	};
});

import { GardenAssociationSelector } from '../../components/GardenAssociationSelector.jsx';
import { consumeNoteDraftReturnContext } from '../../services/noteDraftNavigation.js';
import { NoteEditor, revealNoteFeedback } from './index.jsx';

const DRAFT_ID = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const NOTE_ID = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const GARDEN_ID = '210b8b0f-030c-4220-9374-8b78f461b474';
const MISSING_GARDEN_ID = '7f5e4b36-3b6e-4d4d-9abf-31e035330001';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}

function nodeText(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node !== 'object') return String(node);
	if (Array.isArray(node)) return node.map(nodeText).join('');
	return nodeText(node.props?.children);
}

function button(tree, label) {
	return nodes(tree).find((node) => node.type === 'button' && nodeText(node).trim() === label);
}

function createDrafts(initial = null, { failSave = false, failRemove = false } = {}) {
	let stored = initial;
	return {
		save: vi.fn(async (input) => {
			if (failSave) throw new Error('draft save failed');
			stored = {
				id: input.id, kind: 'note', subjectId: input.noteId, isNew: input.noteId === null,
				text: input.text, gardenId: input.gardenId,
				createdAt: input.createdAt ?? 'created', updatedAt: 'updated',
			};
			return stored;
		}),
		remove: vi.fn(async () => {
			if (failRemove) throw new Error('draft remove failed');
			stored = null;
			return true;
		}),
		getById: vi.fn(async (id) => stored?.id === id ? stored : null),
		get stored() { return stored; },
	};
}

function editor({
	record = null,
	draft = null,
	drafts = createDrafts(draft),
	notes = { create: vi.fn(async () => ({ id: NOTE_ID })), update: vi.fn(async () => ({})) },
	isFreshRoute = false,
	gardens = [{ id: GARDEN_ID, name: 'Garden', status: 'active' }],
} = {}) {
	const props = {
		record, draft, requestedDraftId: DRAFT_ID, isFreshRoute, notes, drafts,
		gardens, locations: [],
	};
	return {
		drafts, notes,
		render() { hooks.index = 0; return NoteEditor(props); },
	};
}

async function runEffects() {
	for (const effect of hooks.effects.splice(0)) effect();
	await Promise.resolve();
}

beforeEach(() => {
	hooks.slots = [];
	hooks.index = 0;
	hooks.effects = [];
	hooks.route.mockReset();
	consumeNoteDraftReturnContext();
	vi.stubGlobal('confirm', vi.fn(() => true));
});

describe('Note editor draft lifecycle', () => {
	it('keeps an untouched new Note pristine and returns without a draft handoff', async () => {
		const view = editor({ isFreshRoute: true });
		const tree = view.render();
		await button(tree, 'Back to Notes').props.onClick();
		expect(view.drafts.save).not.toHaveBeenCalled();
		expect(hooks.route).toHaveBeenCalledWith('/notes', true);
		expect(consumeNoteDraftReturnContext()).toBeNull();
	});

	it('establishes a complete new draft, replaces the URL, and hands off its exact UUID', async () => {
		const replaceState = vi.fn();
		vi.stubGlobal('history', { state: { retained: true }, replaceState });
		const view = editor({ isFreshRoute: true });
		const tree = view.render();
		const textarea = nodes(tree).find((node) => node.type === 'textarea');
		textarea.props.onInput({ currentTarget: { value: 'Recover me', setCustomValidity: vi.fn() } });
		await button(tree, 'Back to Notes').props.onClick();

		expect(view.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			id: DRAFT_ID, text: 'Recover me', gardenId: null,
		}));
		expect(replaceState).toHaveBeenCalledWith({ retained: true }, '', `/notes/new/${DRAFT_ID}`);
		expect(consumeNoteDraftReturnContext()).toEqual({ draftId: DRAFT_ID });
		expect(hooks.route).toHaveBeenCalledWith('/notes', true);
	});

	it('persists an association-only edit and atomically saves it with its draft', async () => {
		const record = { id: NOTE_ID, text: 'Saved text', gardenId: null };
		const notes = { update: vi.fn(async () => ({})) };
		const view = editor({ record, notes });
		const tree = view.render();
		const selector = nodes(tree).find((node) => node.type === GardenAssociationSelector);
		selector.props.onChange(GARDEN_ID);
		const form = nodes(view.render()).find((node) => node.type === 'form');
		await form.props.onSubmit({ preventDefault: vi.fn() });

		expect(view.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			noteId: NOTE_ID, text: 'Saved text', gardenId: GARDEN_ID,
		}));
		expect(notes.update).toHaveBeenCalledWith(
			NOTE_ID, { gardenId: GARDEN_ID }, { draftId: DRAFT_ID },
		);
		expect(hooks.route).toHaveBeenCalledWith('/notes', true);
	});

	it('recovers an explicitly cleared association and restores both fields on discard', async () => {
		const record = { id: NOTE_ID, text: 'Saved text', gardenId: GARDEN_ID };
		const draft = {
			id: DRAFT_ID, kind: 'note', subjectId: NOTE_ID, isNew: false,
			text: 'Draft text', gardenId: null, createdAt: 'created', updatedAt: 'updated',
		};
		const view = editor({ record, draft });
		let tree = view.render();
		expect(nodes(tree).find((node) => node.type === 'textarea').props.value).toBe('Draft text');
		expect(nodes(tree).find((node) => node.type === GardenAssociationSelector).props.value).toBeNull();

		await button(tree, 'Discard draft').props.onClick();
		tree = view.render();
		expect(nodes(tree).find((node) => node.type === 'textarea').props.value).toBe('Saved text');
		expect(nodes(tree).find((node) => node.type === GardenAssociationSelector).props.value).toBe(GARDEN_ID);
		expect(view.drafts.remove).toHaveBeenCalledWith(DRAFT_ID);
	});

	it('repairs a missing draft Garden to No Garden and persists the scoped recovery', async () => {
		const draft = {
			id: DRAFT_ID, kind: 'note', subjectId: null, isNew: true,
			text: 'Preserve this Note text', gardenId: MISSING_GARDEN_ID,
			createdAt: 'created', updatedAt: 'updated',
		};
		const view = editor({ draft, gardens: [] });
		const tree = view.render();
		expect(nodes(tree).find((node) => node.type === GardenAssociationSelector).props.value).toBeNull();
		expect(nodeText(tree)).toContain('The Garden previously associated with this draft no longer exists. You can select another Garden or leave this Note unlinked.');

		await runEffects();
		await button(tree, 'Back to Notes').props.onClick();
		expect(view.drafts.stored).toMatchObject({
			id: DRAFT_ID, text: 'Preserve this Note text', gardenId: null,
		});
		expect(consumeNoteDraftReturnContext()).toEqual({ draftId: DRAFT_ID });
	});

	it('disables both editable fields while an asynchronous operation is underway', async () => {
		let resolveUpdate;
		const notes = { update: vi.fn(() => new Promise((resolve) => { resolveUpdate = resolve; })) };
		const record = { id: NOTE_ID, text: 'Saved text', gardenId: null };
		const view = editor({ record, notes });
		let tree = view.render();
		const textarea = nodes(tree).find((node) => node.type === 'textarea');
		textarea.props.onInput({ currentTarget: { value: 'Changed text', setCustomValidity: vi.fn() } });
		tree = view.render();
		const submission = nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
		tree = view.render();
		expect(nodes(tree).find((node) => node.type === 'textarea').props.disabled).toBe(true);
		expect(nodes(tree).find((node) => node.type === GardenAssociationSelector).props.disabled).toBe(true);
		await vi.waitFor(() => expect(notes.update).toHaveBeenCalled());
		resolveUpdate({});
		await submission;
	});

	it('blocks navigation and does not claim recovery when persistence fails', async () => {
		const drafts = createDrafts(null, { failSave: true });
		const view = editor({ drafts });
		const tree = view.render();
		nodes(tree).find((node) => node.type === 'textarea').props.onInput({
			currentTarget: { value: 'Still only in memory', setCustomValidity: vi.fn() },
		});
		await button(tree, 'Back to Notes').props.onClick();
		expect(hooks.route).not.toHaveBeenCalled();
		expect(consumeNoteDraftReturnContext()).toBeNull();
	});

	it('does not finalize an allocated UUID when no draft was successfully persisted', async () => {
		const drafts = createDrafts(null, { failSave: true });
		const notes = { create: vi.fn(async () => ({ id: NOTE_ID })) };
		const view = editor({ drafts, notes });
		let tree = view.render();
		nodes(tree).find((node) => node.type === 'textarea').props.onInput({
			currentTarget: { value: 'Save authoritatively', setCustomValidity: vi.fn() },
		});
		tree = view.render();
		await nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
		expect(notes.create).toHaveBeenCalledWith(
			{ text: 'Save authoritatively', gardenId: null }, {},
		);
		expect(hooks.route).toHaveBeenCalledWith('/notes', true);
	});

	it('preserves editor values and retryable persistence when discard fails', async () => {
		const record = { id: NOTE_ID, text: 'Saved text', gardenId: null };
		const draft = {
			id: DRAFT_ID, kind: 'note', subjectId: NOTE_ID, isNew: false,
			text: 'Keep this draft', gardenId: GARDEN_ID, createdAt: 'created', updatedAt: 'updated',
		};
		const drafts = createDrafts(draft, { failRemove: true });
		const view = editor({ record, draft, drafts });
		await button(view.render(), 'Discard draft').props.onClick();
		const tree = view.render();
		expect(nodes(tree).find((node) => node.type === 'textarea').props.value).toBe('Keep this draft');
		expect(nodes(tree).find((node) => node.type === GardenAssociationSelector).props.value).toBe(GARDEN_ID);
		expect(hooks.route).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(drafts.save).toHaveBeenCalled());
	});

	it('keeps the latest recoverable draft when authoritative Save fails', async () => {
		const record = { id: NOTE_ID, text: 'Saved text', gardenId: null };
		const saveError = Object.assign(new Error('Selected Garden missing'), { field: 'gardenId' });
		const notes = { update: vi.fn(async () => { throw saveError; }) };
		const view = editor({ record, notes });
		let tree = view.render();
		nodes(tree).find((node) => node.type === GardenAssociationSelector).props.onChange(GARDEN_ID);
		tree = view.render();
		await nodes(tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
		expect(hooks.route).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(view.drafts.stored).toMatchObject({
			text: 'Saved text', gardenId: GARDEN_ID,
		}));
		expect(nodes(view.render()).find((node) => node.type === 'textarea').props.disabled).toBe(false);
	});
});

describe('Note Save validation feedback', () => {
	it('reveals and focuses the relevant field with reduced-motion behavior', () => {
		const focus = vi.fn();
		const scrollIntoView = vi.fn();
		const field = {
			getBoundingClientRect: () => ({ top: 900, bottom: 940 }), focus, scrollIntoView,
		};
		const documentObject = {
			getElementById: (id) => id === 'note-garden' ? field : null,
			querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 70 }) }),
		};
		expect(revealNoteFeedback('gardenId', {
			documentObject,
			viewport: { innerHeight: 800, matchMedia: () => ({ matches: true }) },
		})).toBe(true);
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center', inline: 'nearest' });
		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
	});
});
