import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

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

import { GardenDraftEditor, GardenFinalizationTemplateDialog } from './FullGardenCreation.jsx';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import {
	GardenAdvancedOptionsStep, GardenWizardDatesStep, GardenWizardDetailsStep,
	GardenWizardIdentityStep, GardenWizardTypesStep,
} from './gardenWizardSteps.jsx';
import { WizardStepper } from '../../components/WizardStepper.jsx';
import { loadGardenDrafts } from './viewModel.js';

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
const template = {
	id: 'source', name: 'Saved Template',
	configuration: { name: 'Original template name', locationId: 'home', typeIds: [] },
};
const fields = {
	name: 'Edited after application', subtitle: 'Keep subtitle', icon: null, color: null,
	description: 'Keep description', locationId: 'home', typeIds: [], startDate: '2026-04-01',
	endDate: '', status: 'planned', isClosed: false, saveAsTemplate: false,
};

function editor({
	mode = 'wizard',
	templates = [template],
	sourceTemplateId = template.id,
	currentStepId = mode === 'wizard' ? 'identity' : null,
	saveDraft,
	fieldValues = fields,
	createFromDraft = vi.fn(async () => ({ id: 'created-garden' })),
	createFromDraftWithTemplate = vi.fn(async () => ({ garden: { id: 'created-garden' }, template: { id: 'template' } })),
	advancedCreateFromDraft = createFromDraft,
	advancedCreateFromDraftWithTemplate = createFromDraftWithTemplate,
	draftId = 'draft',
} = {}) {
	let draft = { id: draftId, createdAt: draftId ? 'created' : null, preferredEditor: mode, sourceTemplateId, currentStepId, fields: fieldValues };
	let renderedDraft = draft;
	const workspace = {
		drafts: { save: vi.fn(async (record) => {
			const saved = saveDraft ? await saveDraft(record) : record;
			draft = saved;
			return saved;
		}) },
		templates: {
			getById: vi.fn(async (id) => templates.find((candidate) => candidate.id === id) ?? null),
			list: vi.fn(async () => templates),
			resolveConfiguration: vi.fn(),
		},
		locations: { list: vi.fn(async () => [{ id: 'home', name: 'Home' }]) },
		types: { list: vi.fn(async () => []) },
		gardens: {
			validate: vi.fn((input) => {
				if (!input.name.trim()) {
					const error = new Error('Garden name must contain text.');
					error.field = 'name';
					throw error;
				}
				return input;
			}),
			createFromDraft,
			createFromDraftWithTemplate,
			advanced: {
				validate: vi.fn((input) => input),
				createFromDraft: advancedCreateFromDraft,
				createFromDraftWithTemplate: advancedCreateFromDraftWithTemplate,
			},
		},
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

function creationForm(tree) {
	return nodes(tree).find((node) => node.type === 'form' && node.props.class === 'garden-full-create__form');
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

describe('Garden draft editor progression', () => {
	it('blocks Continue on the active invalid step, preserves fields, and focuses the invalid control', async () => {
		const focus = vi.fn();
		vi.stubGlobal('document', {
			getElementById: vi.fn(() => ({ focus })),
			querySelector: vi.fn(() => null),
		});
		try {
			const view = editor({ fieldValues: { ...fields, name: ' ' } });
			await view.mount();
			await button(view.render(), 'Continue').props.onClick();
			expect(hooks.route).not.toHaveBeenCalled();
			expect(view.workspace.drafts.save).not.toHaveBeenCalled();
			expect(focus).toHaveBeenCalledOnce();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('allows Back without validating the current step', async () => {
		hooks.query = { step: 'details' };
		const view = editor({ currentStepId: 'details', fieldValues: { ...fields, locationId: 'missing' } });
		await view.mount();
		await button(view.render(), 'Back').props.onClick();
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new/wizard/draft?step=identity', false);
		expect(view.workspace.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			fields: expect.objectContaining({ locationId: 'missing' }),
		}));
	});

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

		const gardenFields = nodes(view.render()).find(({ type }) => type === GardenWizardIdentityStep);
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

	it('identifies a fresh editor as pristine and does not offer draft discard', async () => {
		const view = editor({ mode: 'advanced', draftId: null, sourceTemplateId: null });
		await view.mount();
		const tree = view.render();

		expect(nodeText(tree)).toContain('Your progress will be saved locally after your first change.');
		expect(nodeText(tree)).toContain('Draft starts after your first change');
		expect(button(tree, 'Discard Draft')).toBeUndefined();
		expect(view.workspace.drafts.save).not.toHaveBeenCalled();
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

	it.each(['wizard', 'advanced'])('opens %s directly without the obsolete Template chooser', async (mode) => {
		const view = editor({ mode });
		await view.mount();
		const tree = view.render();
		const rendered = JSON.stringify(tree);
		expect(rendered).not.toContain('Choose how to start');
		expect(rendered).not.toContain('Start from Scratch');
		expect(rendered).not.toContain('Manage Templates');
		if (mode === 'wizard') {
			expect(nodes(tree).find((node) => node.type === WizardStepper)).toBeDefined();
			expect(nodes(tree).find((node) => node.type === GardenWizardIdentityStep).props.fields).toEqual(fields);
		} else {
			expect(rendered).toContain('Additional Options');
		}
		expect(view.workspace.templates.getById).toHaveBeenCalledWith(template.id);
		expect(view.workspace.templates.list).not.toHaveBeenCalled();
		expect(view.workspace.templates.resolveConfiguration).not.toHaveBeenCalled();
	});

	it('renders the Advanced form as five continuous sections in Wizard order', async () => {
		const view = editor({ mode: 'advanced' });
		await view.mount();
		const sections = nodes(creationForm(view.render())).filter(
			({ type, props }) => type === 'section' && props.class === 'garden-advanced__section',
		);
		expect(sections.map(({ props }) => nodes(props.children).find(({ type }) => type === 'h2')?.props.children))
			.toEqual(['Identity', 'Details', 'Garden Type', 'Dates', 'Additional Options']);
		expect(sections.map(({ props }) => nodes(props.children).find(({ type }) => typeof type === 'function')?.type))
			.toEqual([
				GardenWizardIdentityStep, GardenWizardDetailsStep, GardenWizardTypesStep,
				GardenWizardDatesStep, GardenAdvancedOptionsStep,
			]);
	});

	it('preserves a missing-source notice without restoring Template controls', async () => {
		const view = editor({ templates: [] });
		await view.mount();
		const rendered = JSON.stringify(view.render());
		expect(rendered).toContain('source Template is no longer available');
		expect(rendered).not.toContain('Choose how to start');
	});

	it.each([
		['wizard', 'Advanced'],
		['advanced', 'Wizard'],
	])('keeps Discard Draft but hides the editor switch in %s', async (mode, otherEditor) => {
		const view = editor({ mode });
		await view.mount();
		const tree = view.render();

		expect(button(tree, `Switch to ${otherEditor}`)).toBeUndefined();
		expect(button(tree, 'Discard Draft')).toBeDefined();
	});

	it.each([
		['advanced', 'wizard'],
		['wizard', 'advanced'],
	])('keeps the selected route authoritative over a stale %s snapshot when entering %s', async (staleMode, routeMode) => {
		const view = editor({ mode: staleMode });
		await view.mount();
		const staleSnapshot = { ...view.draft };

		// The selected route remains authoritative if its first render still has
		// the previous editor's draft snapshot during a route transition.
		view.switchMode(routeMode, staleSnapshot);
		await view.mount();
		await button(view.render(), 'Back to Gardens').props.onClick();

		expect(view.draft).toMatchObject({
			fields, sourceTemplateId: 'source', preferredEditor: routeMode,
		});
		const draftCards = await loadGardenDrafts({ drafts: { list: async () => [view.draft] } });
		expect(draftCards.drafts[0].href).toBe(`/gardens/new/${routeMode}/draft`);
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens');
	});

});

describe('Wizard finalization', () => {
	it('returns to an earlier invalid step, preserves the draft, and does not create a Garden', async () => {
		hooks.query = { step: 'options' };
		const createFromDraft = vi.fn();
		const view = editor({
			currentStepId: 'options', createFromDraft,
			fieldValues: { ...fields, name: ' ' },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });

		expect(createFromDraft).not.toHaveBeenCalled();
		expect(view.workspace.drafts.save).toHaveBeenCalledWith(expect.objectContaining({
			fields: expect.objectContaining({ name: ' ' }),
		}));
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new/wizard/draft?step=identity', false);
	});

	it('creates the complete Garden, consumes the draft through the service, and opens its detail route', async () => {
		hooks.query = { step: 'options' };
		const createFromDraft = vi.fn(async () => ({ id: 'new-garden' }));
		const view = editor({ currentStepId: 'options', createFromDraft });
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });

		expect(createFromDraft).toHaveBeenCalledWith(expect.objectContaining({
			name: fields.name, icon: null, color: null, status: 'planned',
		}), 'draft');
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new-garden');
	});

	it('opens Template confirmation and cancellation creates neither record', async () => {
		hooks.query = { step: 'options' };
		const createFromDraftWithTemplate = vi.fn();
		const view = editor({
			currentStepId: 'options', createFromDraftWithTemplate,
			fieldValues: { ...fields, saveAsTemplate: true },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });
		let dialog = nodes(view.render()).find((node) => node.type === GardenFinalizationTemplateDialog);
		expect(dialog.props.open).toBe(true);
		dialog.props.onCancel();
		dialog = nodes(view.render()).find((node) => node.type === GardenFinalizationTemplateDialog);
		expect(dialog.props.open).toBe(false);
		expect(createFromDraftWithTemplate).not.toHaveBeenCalled();
	});

	it('confirms the editable Template name through coordinated finalization', async () => {
		hooks.query = { step: 'options' };
		const createFromDraftWithTemplate = vi.fn(async () => ({ garden: { id: 'new-garden' }, template: { id: 'new-template' } }));
		const view = editor({
			currentStepId: 'options', createFromDraftWithTemplate,
			fieldValues: { ...fields, saveAsTemplate: true },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });
		const dialog = nodes(view.render()).find((node) => node.type === GardenFinalizationTemplateDialog);
		dialog.props.onConfirm('My edited Template name');
		await vi.waitFor(() => expect(createFromDraftWithTemplate).toHaveBeenCalledWith(
			expect.objectContaining({ name: fields.name }), 'draft', 'My edited Template name',
		));
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/new-garden');
	});

	it('keeps the draft and confirmation dialog recoverable when coordinated creation fails', async () => {
		hooks.query = { step: 'options' };
		const createFromDraftWithTemplate = vi.fn(async () => { throw new Error('simulated failure'); });
		const view = editor({
			currentStepId: 'options', createFromDraftWithTemplate,
			fieldValues: { ...fields, saveAsTemplate: true },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });
		nodes(view.render()).find((node) => node.type === GardenFinalizationTemplateDialog).props.onConfirm('Retryable Template');
		await vi.waitFor(() => expect(nodes(view.render()).find(
			(node) => node.type === GardenFinalizationTemplateDialog,
		).props.error).toContain('could not be created'));
		expect(hooks.route).not.toHaveBeenCalledWith('/gardens/created-garden');
		expect(view.draft.fields).toEqual({ ...fields, saveAsTemplate: true });
	});
});

describe('Advanced finalization', () => {
	it('identifies an invalid Archived closed-state combination and preserves the draft', async () => {
		const focus = vi.fn();
		vi.stubGlobal('document', { getElementById: vi.fn(() => ({ focus })) });
		try {
			const advancedCreate = vi.fn();
			const invalid = { ...fields, status: 'archived', isClosed: false };
			const view = editor({
				mode: 'advanced', fieldValues: invalid, advancedCreateFromDraft: advancedCreate,
			});
			await view.mount();
			await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });

			expect(advancedCreate).not.toHaveBeenCalled();
			expect(JSON.stringify(view.render())).toContain('Archived Gardens must be closed.');
			expect(view.draft.fields).toEqual(invalid);
			expect(focus).toHaveBeenCalledOnce();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('creates only the Garden through the Advanced policy when Save as Template is unchecked', async () => {
		const ordinaryCreate = vi.fn();
		const advancedCreate = vi.fn(async () => ({ id: 'advanced-garden' }));
		const view = editor({
			mode: 'advanced', createFromDraft: ordinaryCreate, advancedCreateFromDraft: advancedCreate,
			fieldValues: { ...fields, status: 'completed', isClosed: true },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });

		expect(advancedCreate).toHaveBeenCalledWith(expect.objectContaining({
			status: 'completed', isClosed: true,
		}), 'draft');
		expect(ordinaryCreate).not.toHaveBeenCalled();
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/advanced-garden');
	});

	it('opens shared Template confirmation and cancellation retains the Advanced draft', async () => {
		const advancedCreate = vi.fn();
		const advancedCreateWithTemplate = vi.fn();
		const selected = { ...fields, status: 'archived', isClosed: true, saveAsTemplate: true };
		const view = editor({
			mode: 'advanced', fieldValues: selected,
			advancedCreateFromDraft: advancedCreate,
			advancedCreateFromDraftWithTemplate: advancedCreateWithTemplate,
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });
		let dialog = nodes(view.render()).find(({ type }) => type === GardenFinalizationTemplateDialog);
		expect(dialog.props.open).toBe(true);
		dialog.props.onCancel();
		dialog = nodes(view.render()).find(({ type }) => type === GardenFinalizationTemplateDialog);

		expect(dialog.props.open).toBe(false);
		expect(advancedCreate).not.toHaveBeenCalled();
		expect(advancedCreateWithTemplate).not.toHaveBeenCalled();
		expect(view.draft.fields).toEqual(selected);
	});

	it('atomically finalizes the Advanced Garden and Template through the Advanced policy', async () => {
		const ordinaryCreateWithTemplate = vi.fn();
		const advancedCreateWithTemplate = vi.fn(async () => ({
			garden: { id: 'advanced-garden' }, template: { id: 'advanced-template' },
		}));
		const view = editor({
			mode: 'advanced', createFromDraftWithTemplate: ordinaryCreateWithTemplate,
			advancedCreateFromDraftWithTemplate: advancedCreateWithTemplate,
			fieldValues: { ...fields, status: 'archived', isClosed: true, saveAsTemplate: true },
		});
		await view.mount();
		await creationForm(view.render()).props.onSubmit({ preventDefault: vi.fn() });
		const dialog = nodes(view.render()).find(({ type }) => type === GardenFinalizationTemplateDialog);
		dialog.props.onConfirm('Historical Garden Template');

		await vi.waitFor(() => expect(advancedCreateWithTemplate).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'archived', isClosed: true }),
			'draft',
			'Historical Garden Template',
		));
		expect(ordinaryCreateWithTemplate).not.toHaveBeenCalled();
		expect(hooks.route).toHaveBeenLastCalledWith('/gardens/advanced-garden');
	});
});
