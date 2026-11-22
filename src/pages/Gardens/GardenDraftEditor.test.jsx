import { beforeEach, describe, expect, it, vi } from 'vitest';

// Exercise editor event handlers with persistent hook slots, without a browser.
const hooks = vi.hoisted(() => ({
	slots: [], index: 0, effects: [], route: vi.fn(),
	path: '/gardens/new/wizard/draft', query: { step: 'identity' },
}));
vi.mock('preact-iso', () => ({
	useLocation: () => ({ path: hooks.path, query: hooks.query, route: hooks.route }),
}));
vi.mock('preact/hooks', () => {
	function slot(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = initial();
		return index;
	}
	return {
		useState(initial) {
			const index = slot(() => initial);
			return [hooks.slots[index], (value) => {
				hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
			}];
		},
		useRef: (initial) => hooks.slots[slot(() => ({ current: initial }))],
		useMemo: (factory) => hooks.slots[slot(factory)],
		useEffect(effect) { slot(() => { hooks.effects.push(effect); return true; }); },
	};
});

import { GardenDraftEditor } from './FullGardenCreation.jsx';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import { GardenTemplateSelection } from './GardenTemplateSelection.jsx';
import { GardenFields } from '../../components/GardenFields.jsx';
import { WizardStepper } from '../../components/WizardStepper.jsx';
import { loadGardenDrafts } from './viewModel.js';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
function button(tree, label) {
	return nodes(tree).find((node) => node.type === 'button' && [node.props.children].flat().join('') === label);
}
const template = {
	id: 'source', name: 'Saved Template',
	configuration: { name: 'Original template name', locationId: 'home', typeIds: [] },
};
const fields = {
	name: 'Edited after application', subtitle: 'Keep subtitle', description: 'Keep description',
	locationId: 'home', typeIds: [], startDate: '2026-04-01', endDate: '',
};

function editor({
	mode = 'wizard',
	templates = [template],
	sourceTemplateId = template.id,
	currentStepId = mode === 'wizard' ? 'identity' : null,
	saveDraft,
} = {}) {
	let draft = { id: 'draft', createdAt: 'created', preferredEditor: mode, sourceTemplateId, currentStepId, fields };
	let renderedDraft = draft;
	const workspace = {
		drafts: { save: vi.fn(async (record) => {
			const saved = saveDraft ? await saveDraft(record) : record;
			draft = saved;
			return saved;
		}) },
		templates: { list: vi.fn(async () => templates), resolveConfiguration: vi.fn() },
	};
	const references = { locations: [{ id: 'home', name: 'Home' }], types: [] };
	function render() {
		hooks.index = 0;
		return GardenDraftEditor({ draft: renderedDraft, references, workspace, mode });
	}
	async function mount() {
		const tree = render();
		for (const effect of hooks.effects.splice(0)) effect();
		await Promise.resolve();
		return tree;
	}
	return {
		render, mount, workspace,
		get draft() { return draft; },
		switchMode(nextMode, draftSnapshot = draft) {
			mode = nextMode;
			renderedDraft = draftSnapshot;
			hooks.slots = [];
			hooks.effects = [];
		},
	};
}
function selector(tree) {
	const node = nodes(tree).find((node) => node.type === GardenTemplateSelection);
	return GardenTemplateSelection(node.props);
}

function creationBreadcrumb(tree) {
	const node = nodes(tree).find(({ type }) => type === GardenCreationBreadcrumb);
	return { node, tree: GardenCreationBreadcrumb(node.props) };
}

beforeEach(() => {
	hooks.slots = [];
	hooks.effects = [];
	hooks.route.mockReset();
	hooks.path = '/gardens/new/wizard/draft';
	hooks.query = { step: 'identity' };
});

describe('Wizard applied Template progression', () => {
	it('renders the five production steps with the URL-selected stable ID', async () => {
		hooks.query = { step: 'types' };
		const view = editor({ currentStepId: 'details' });
		await view.mount();
		const stepper = nodes(view.render()).find(({ type }) => type === WizardStepper);
		expect(stepper.props.steps.map(({ id }) => id)).toEqual([
			'identity', 'details', 'types', 'dates', 'options',
		]);
		expect(stepper.props.activeStepId).toBe('types');
	});

	it('canonicalizes a resumed persisted step with replace history', async () => {
		hooks.query = {};
		const view = editor({ currentStepId: 'dates' });
		await view.mount();
		expect(hooks.route).toHaveBeenCalledWith(
			'/gardens/new/wizard/draft?step=dates',
			true,
		);
		expect(view.workspace.drafts.save).not.toHaveBeenCalled();
	});

	it('persists a browser-restored URL step without pushing another history entry', async () => {
		hooks.query = { source: 'template', id: 'template-id', step: 'options' };
		const view = editor({ currentStepId: 'details' });
		await view.mount();
		await vi.waitFor(() => expect(view.workspace.drafts.save).toHaveBeenCalledWith(
			expect.objectContaining({ currentStepId: 'options', fields }),
		));
		expect(hooks.route).not.toHaveBeenCalled();
	});

	it('keeps the confirmed step authoritative when a navigation save fails', async () => {
		let attempt = 0;
		const view = editor({
			saveDraft: async (record) => {
				attempt += 1;
				if (attempt === 1) throw new Error('simulated write failure');
				return record;
			},
		});
		await view.mount();
		await button(view.render(), 'Continue').props.onClick();
		expect(hooks.route).not.toHaveBeenCalled();

		const gardenFields = nodes(view.render()).find(({ type }) => type === GardenFields);
		gardenFields.props.onChange('name', 'Updated after failed navigation');
		await vi.waitFor(() => expect(view.workspace.drafts.save).toHaveBeenCalledTimes(2));
		expect(view.workspace.drafts.save).toHaveBeenLastCalledWith(expect.objectContaining({
			currentStepId: 'identity',
			fields: expect.objectContaining({ name: 'Updated after failed navigation' }),
		}));
	});

	it.each([
		[{ step: 'retired-step' }, 'details'],
		[{}, 'retired-step'],
	])('recovers an invalid URL or persisted step by replacing it without discarding fields', async (query, currentStepId) => {
		hooks.query = query;
		const view = editor({ currentStepId });
		await view.mount();
		const tree = view.render();
		const recovery = button(tree, 'Return to First Step');
		expect(recovery).toBeDefined();
		expect(view.workspace.drafts.save).not.toHaveBeenCalled();
		await recovery.props.onClick();
		expect(view.workspace.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			fields,
			currentStepId: 'identity',
		}));
		expect(hooks.route).toHaveBeenCalledWith(
			'/gardens/new/wizard/draft?step=identity',
			true,
		);
	});

	it.each([
		['wizard', 'Guided Wizard'],
		['advanced', 'Advanced Form'],
	])('preserves the %s draft before breadcrumb navigation', async (mode, current) => {
		const view = editor({ mode });
		await view.mount();
		const breadcrumb = creationBreadcrumb(view.render());
		expect(breadcrumb.node.props.current).toBe(current);
		const createGardenLink = nodes(breadcrumb.tree).find(
			({ type, props }) => type === 'a' && props.href === '/gardens/new',
		);
		const event = { button: 0, preventDefault: vi.fn() };
		await createGardenLink.props.onClick(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(view.workspace.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			id: 'draft', fields, sourceTemplateId: 'source', preferredEditor: mode,
		}));
		expect(hooks.route).toHaveBeenCalledWith('/gardens/new');
	});

	it.each([false, true])('continues with edited fields without reapplying (deleted source: %s)', async (deleted) => {
		const view = editor({ templates: deleted ? [] : [template] });
		await view.mount();
		const tree = view.render();
		const selection = selector(tree);
		expect(nodes(selection).filter((node) => node.type === 'button')).toHaveLength(0);
		if (deleted) expect(JSON.stringify(selection)).toContain('Source Template unavailable');
		else {
			expect(JSON.stringify(selection)).toContain('Applied');
			expect(nodes(selection).filter((node) => node.type === 'input').map((node) => node.props.checked)).toEqual([false, true]);
		}
		const next = button(tree, 'Continue');
		expect(next.props.disabled).toBe(false);
		next.props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
		expect(view.workspace.drafts.save).not.toHaveBeenCalled();
	});

	it.each(['source', null])('requires applying a new selection and persists only the applied association (source: %s)', async (sourceTemplateId) => {
		const other = { ...template, id: 'other' };
		const view = editor({ templates: [template, other], sourceTemplateId });
		await view.mount();
		const choices = nodes(selector(view.render())).filter((node) => node.type === 'input');
		choices[2].props.onChange();
		const tree = view.render();
		expect(button(tree, 'Continue').props.disabled).toBe(true);
		expect(JSON.stringify(selector(tree))).toContain('Apply Template');
		await button(tree, 'Switch to Advanced').props.onClick();
		expect(view.draft).toMatchObject({ sourceTemplateId, fields, preferredEditor: 'advanced' });
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});

	it('preserves fields and source across Advanced → Wizard → Advanced, and continues normally', async () => {
		const view = editor({ mode: 'advanced' });
		await view.mount();
		await button(view.render(), 'Switch to Wizard').props.onClick();
		expect(view.draft).toMatchObject({ fields, sourceTemplateId: 'source', preferredEditor: 'wizard' });
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new/wizard/draft?step=identity');
		view.switchMode('wizard');
		await view.mount();
		const tree = view.render();
		expect(nodes(selector(tree)).filter((node) => node.type === 'input')[1].props.checked).toBe(true);
		expect(button(tree, 'Continue').props.disabled).toBe(false);
		await button(tree, 'Continue').props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		await button(view.render(), 'Switch to Advanced').props.onClick();
		expect(view.draft).toMatchObject({ fields, sourceTemplateId: 'source', preferredEditor: 'advanced' });
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});

	it.each([
		['advanced', 'wizard'],
		['wizard', 'advanced'],
	])('does not let a stale %s route snapshot overwrite a switch to %s', async (fromMode, toMode) => {
		const view = editor({ mode: fromMode });
		await view.mount();
		const staleSnapshot = { ...view.draft };

		await button(view.render(), `Switch to ${toMode === 'wizard' ? 'Wizard' : 'Advanced'}`).props.onClick();
		expect(view.draft).toMatchObject({
			fields, sourceTemplateId: 'source', preferredEditor: toMode,
		});

		// Reproduce the route transition regression: the new editor mounts in the
		// selected mode while GardenDraftRoute still has its previous snapshot.
		view.switchMode(toMode, staleSnapshot);
		await view.mount();
		await button(view.render(), 'Back to Gardens').props.onClick();

		expect(view.draft).toMatchObject({
			fields, sourceTemplateId: 'source', preferredEditor: toMode,
		});
		const draftCards = await loadGardenDrafts({ drafts: { list: async () => [view.draft] } });
		expect(draftCards.drafts[0].href).toBe(`/gardens/new/${toMode}/draft`);
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens');
	});

	it('clears the association for Start from Scratch while keeping fields and allowing Continue', async () => {
		const view = editor();
		await view.mount();
		const selectionNode = nodes(view.render()).find((node) => node.type === GardenTemplateSelection);
		await selectionNode.props.onSelect(null);
		expect(view.draft).toMatchObject({ sourceTemplateId: null, fields });
		const tree = view.render();
		expect(button(tree, 'Continue').props.disabled).toBe(false);
		button(tree, 'Continue').props.onClick();
		expect(nodes(view.render()).find((node) => node.type === GardenFields).props.fields).toEqual(fields);
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});
});
