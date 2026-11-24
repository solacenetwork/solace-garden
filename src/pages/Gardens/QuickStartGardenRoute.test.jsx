import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
	slots: [],
	index: 0,
	effects: [],
	repositories: null,
	route: vi.fn(),
}));

vi.mock('preact-iso', () => ({
	useLocation: () => ({ route: hooks.route }),
}));

vi.mock('preact/hooks', () => {
	function slot(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = initial();
		return index;
	}
	return {
		useMemo(factory) { return hooks.slots[slot(factory)]; },
		useState(initial) {
			const index = slot(() => (typeof initial === 'function' ? initial() : initial));
			return [hooks.slots[index], (value) => {
				hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
			}];
		},
		useEffect(effect) { hooks.effects.push(effect); },
	};
});

vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: hooks.repositories }),
}));

import { QuickStartGarden, QuickStartGardenEditor } from './CreateGarden.jsx';

const DRAFT_ID = '550e8400-e29b-41d4-a716-446655440011';
const draft = {
	id: DRAFT_ID,
	kind: 'garden',
	subjectId: null,
	isNew: true,
	fields: {
		name: 'Recovered Quick Start', subtitle: 'Saved', icon: null, color: null,
		description: '', locationId: 'default-location', typeIds: ['in-ground'],
		startDate: '', endDate: '', status: 'planned', isClosed: false, saveAsTemplate: false,
	},
	sourceTemplateId: null,
	preferredEditor: 'quickstart',
	currentStepId: null,
	createdAt: '2026-11-24T12:00:00.000Z',
	updatedAt: '2026-11-24T12:00:00.000Z',
};

function render(params) {
	hooks.index = 0;
	return QuickStartGarden({ params });
}

async function runEffects() {
	for (const effect of hooks.effects.splice(0)) effect();
	for (let index = 0; index < 4; index += 1) await Promise.resolve();
}

beforeEach(() => {
	hooks.slots = [];
	hooks.index = 0;
	hooks.effects = [];
	hooks.route.mockReset();
	hooks.repositories = {
		drafts: {
			getById: vi.fn(async (id) => (id === DRAFT_ID ? draft : null)),
			add: vi.fn(),
		},
		gardens: {},
	};
});

describe('Quick Start draft routing', () => {
	it('opens a fresh editor without reading or creating a draft', async () => {
		let tree = render({});
		await runEffects();
		tree = render({});

		expect(tree.type).toBe(QuickStartGardenEditor);
		expect(tree.props.draft).toBeNull();
		expect(hooks.repositories.drafts.getById).not.toHaveBeenCalled();
		expect(hooks.repositories.drafts.add).not.toHaveBeenCalled();
	});

	it('recovers a selected Quick Start draft but resets to pristine for a later fresh flow', async () => {
		render({ draftId: DRAFT_ID });
		await runEffects();
		let tree = render({ draftId: DRAFT_ID });
		expect(tree.type).toBe(QuickStartGardenEditor);
		expect(tree.props.draft).toEqual(draft);

		await runEffects();
		render({});
		await runEffects();
		tree = render({});
		expect(tree.type).toBe(QuickStartGardenEditor);
		expect(tree.props.draft).toBeNull();
		expect(hooks.repositories.drafts.add).not.toHaveBeenCalled();
	});
});
