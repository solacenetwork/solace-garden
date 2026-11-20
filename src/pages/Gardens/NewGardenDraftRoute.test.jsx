import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440010';
const DRAFT_ID = '550e8400-e29b-41d4-a716-446655440011';

const harness = vi.hoisted(() => ({
	effects: [],
	query: {},
	repositories: null,
	route: vi.fn(),
}));

vi.mock('preact-iso', () => ({
	useLocation: () => ({ query: harness.query, route: harness.route }),
}));

vi.mock('preact/hooks', () => ({
	useEffect: (effect) => harness.effects.push(effect),
	useMemo: (factory) => factory(),
	useRef: (initial) => ({ current: initial }),
	useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
}));

vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: harness.repositories }),
}));

import { NewGardenDraftRoute } from './FullGardenCreation.jsx';

async function start(mode) {
	NewGardenDraftRoute({ mode });
	for (const effect of harness.effects.splice(0)) effect();
	await Promise.resolve();
	await Promise.resolve();
}

beforeEach(() => {
	harness.effects = [];
	harness.query = {};
	harness.route.mockReset();
	harness.repositories = {
		drafts: {
			add: vi.fn(async (record) => ({ ...record, id: DRAFT_ID })),
		},
		gardens: {},
		gardenTemplates: {},
		gardenTypes: {},
		locations: {},
	};
});

describe('new Garden draft route navigation', () => {
	it('preserves a selected Template identifier without applying it to the draft', async () => {
		harness.query = { source: 'template', id: TEMPLATE_ID };
		await start('wizard');

		expect(harness.repositories.drafts.add).toHaveBeenCalledWith(expect.objectContaining({
			id: expect.any(String),
			preferredEditor: 'wizard',
			sourceTemplateId: null,
		}));
		expect(harness.route).toHaveBeenCalledWith(
			`/gardens/new/wizard/${DRAFT_ID}?source=template&id=${TEMPLATE_ID}`,
			true,
		);
	});

	it('keeps ordinary Advanced creation URLs unchanged', async () => {
		await start('advanced');
		expect(harness.route).toHaveBeenCalledWith(`/gardens/new/advanced/${DRAFT_ID}`, true);
	});
});
