import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	index: 0,
	slots: [],
	effects: [],
	repositories: null,
}));

function dependenciesChanged(previous, next) {
	return !previous || previous.length !== next.length || next.some((value, index) => value !== previous[index]);
}

vi.mock('preact/hooks', () => ({
	useState(initial) {
		const index = harness.index++;
		if (!harness.slots[index]) {
			harness.slots[index] = { value: typeof initial === 'function' ? initial() : initial };
		}
		return [harness.slots[index].value, (value) => {
			harness.slots[index].value = typeof value === 'function'
				? value(harness.slots[index].value)
				: value;
		}];
	},
	useMemo(factory, dependencies) {
		const index = harness.index++;
		const slot = harness.slots[index];
		if (!slot || dependenciesChanged(slot.dependencies, dependencies)) {
			harness.slots[index] = { value: factory(), dependencies };
		}
		return harness.slots[index].value;
	},
	useRef(initial) {
		const index = harness.index++;
		if (!harness.slots[index]) harness.slots[index] = { value: { current: initial } };
		return harness.slots[index].value;
	},
	useEffect(effect, dependencies) {
		const index = harness.index++;
		const slot = harness.slots[index];
		if (!slot || dependenciesChanged(slot.dependencies, dependencies)) {
			harness.effects.push({ effect, index });
			harness.slots[index] = { ...slot, dependencies };
		}
	},
}));

vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: harness.repositories }),
}));

vi.mock('preact-iso', () => ({ useLocation: () => ({ route: vi.fn() }) }));

import { GardenDraftEditor, GardenDraftRoute } from './FullGardenCreation.jsx';

async function flushEffects() {
	for (const { effect, index } of harness.effects.splice(0)) {
		harness.slots[index].cleanup?.();
		harness.slots[index].cleanup = effect();
	}
	await Promise.resolve();
	await Promise.resolve();
}

function render(mode) {
	harness.index = 0;
	return GardenDraftRoute({ params: { draftId: 'draft' }, mode });
}

beforeEach(() => {
	harness.index = 0;
	harness.slots = [];
	harness.effects = [];
});

describe('Garden draft route editor changes', () => {
	it('fails invalid production configuration visibly with basic diagnostics', () => {
		harness.repositories = {
			drafts: { getById: vi.fn() },
			locations: { list: vi.fn() },
			gardenTypes: { list: vi.fn() },
			gardens: {},
			gardenTemplates: {},
		};
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const tree = GardenDraftRoute({
				params: { draftId: 'draft' },
				mode: 'wizard',
				wizardDefinition: [
					{ id: 'identity', order: 10, title: 'Identity', stepperLabel: 'Identity' },
				],
			});
			expect(JSON.stringify(tree)).toContain('Garden Wizard is unavailable');
			expect(JSON.stringify(tree)).toContain('No draft fields were changed');
			expect(consoleError).toHaveBeenCalledWith(
				'[Garden Wizard] Invalid production step configuration.',
				expect.objectContaining({ name: 'WizardDefinitionError' }),
			);
			expect(harness.repositories.drafts.getById).not.toHaveBeenCalled();
		} finally {
			consoleError.mockRestore();
		}
	});

	it('reloads the persisted draft before mounting the newly selected editor', async () => {
		let draft = {
			id: 'draft', kind: 'garden', subjectId: null, isNew: true,
			preferredEditor: 'advanced', sourceTemplateId: 'template',
			currentStepId: null,
			fields: { name: 'Flower Garden 2027', typeIds: [] },
			createdAt: 'created', updatedAt: 'first-save',
		};
		const getById = vi.fn(async () => ({ ...draft, fields: { ...draft.fields, typeIds: [] } }));
		harness.repositories = {
			drafts: { getById },
			locations: { list: vi.fn(async () => []) },
			gardenTypes: { list: vi.fn(async () => []) },
			gardens: {},
			gardenTemplates: {},
		};

		expect(render('advanced').type).not.toBe(GardenDraftEditor);
		await flushEffects();
		let editor = render('advanced');
		expect(editor.type).toBe(GardenDraftEditor);
		expect(editor.props.draft.preferredEditor).toBe('advanced');

		draft = { ...draft, preferredEditor: 'wizard', currentStepId: 'details', updatedAt: 'second-save' };
		const transition = render('wizard');
		expect(transition.type).not.toBe(GardenDraftEditor);
		await flushEffects();
		editor = render('wizard');
		expect(editor.type).toBe(GardenDraftEditor);
		expect(editor.props.draft).toMatchObject({
			preferredEditor: 'wizard', sourceTemplateId: 'template',
			currentStepId: 'details',
			fields: { name: 'Flower Garden 2027' },
		});
		expect(getById).toHaveBeenCalledTimes(2);
	});
});
