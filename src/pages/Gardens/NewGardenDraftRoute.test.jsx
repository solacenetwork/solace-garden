import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440010';
const DRAFT_ID = '550e8400-e29b-41d4-a716-446655440011';
const TEMPLATE_CONFIGURATION = {
	name: 'Template Garden',
	description: 'Copied details',
	locationId: 'default-location',
	typeIds: ['container'],
	layoutMediaId: null,
};

const harness = vi.hoisted(() => ({
	effects: [],
	query: {},
	repositories: null,
	route: vi.fn(),
	state: undefined,
}));

vi.mock('preact-iso', () => ({
	useLocation: () => ({ query: harness.query, route: harness.route }),
}));

vi.mock('preact/hooks', () => ({
	useEffect: (effect) => harness.effects.push(effect),
	useMemo: (factory) => factory(),
	useRef: (initial) => ({ current: initial }),
	useState: (initial) => {
		const initialValue = typeof initial === 'function' ? initial() : initial;
		return [harness.state ?? initialValue, (next) => {
			harness.state = typeof next === 'function' ? next(harness.state ?? initialValue) : next;
		}];
	},
}));

vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: harness.repositories }),
}));

import { NewGardenDraftRoute } from './FullGardenCreation.jsx';

function text(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node !== 'object') return String(node);
	if (Array.isArray(node)) return node.map(text).join(' ');
	if (typeof node.type === 'function') return text(node.type(node.props));
	return text(node.props?.children);
}

async function start(mode) {
	NewGardenDraftRoute({ mode });
	for (const effect of harness.effects.splice(0)) effect();
	for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

beforeEach(() => {
	harness.effects = [];
	harness.query = {};
	harness.route.mockReset();
	harness.state = undefined;
	harness.repositories = {
		drafts: {
			add: vi.fn(async (record) => ({ ...record, id: DRAFT_ID })),
		},
		gardens: {},
		gardenTemplates: {
			resolveConfiguration: vi.fn(async () => ({
				configuration: TEMPLATE_CONFIGURATION,
				locationResolution: { fallbackOccurred: false },
			})),
		},
		gardenTypes: {},
		locations: {},
	};
});

describe('new Garden draft route navigation', () => {
	it.each([
		['wizard', '?step=identity', 'identity'],
		['advanced', '', null],
	])('initializes a selected Template once for %s before entering the editor', async (
		mode,
		expectedSearch,
		currentStepId,
	) => {
		harness.query = { source: 'template', id: TEMPLATE_ID };
		await start(mode);

		expect(harness.repositories.drafts.add).toHaveBeenCalledWith(expect.objectContaining({
			id: expect.any(String),
			preferredEditor: mode,
			sourceTemplateId: TEMPLATE_ID,
			currentStepId,
			fields: expect.objectContaining({
				name: 'Template Garden',
				description: 'Copied details',
				locationId: 'default-location',
				typeIds: ['container'],
			}),
		}));
		expect(harness.route).toHaveBeenCalledWith(
			`/gardens/new/${mode}/${DRAFT_ID}${expectedSearch}`,
			true,
		);
	});

	it('shows the recoverable draft error without creating a scratch draft when the Template is missing', async () => {
		harness.query = { source: 'template', id: TEMPLATE_ID };
		harness.repositories.gardenTemplates.resolveConfiguration.mockResolvedValue(null);
		await start('wizard');

		expect(harness.repositories.drafts.add).not.toHaveBeenCalled();
		expect(harness.route).not.toHaveBeenCalled();
		const errorView = NewGardenDraftRoute({ mode: 'wizard' });
		expect(text(errorView)).toContain('Garden draft could not be opened');
		expect(text(errorView)).toContain('That Template is no longer available');
		expect(text(errorView)).toContain('Back to Gardens');
	});

	it('keeps ordinary Advanced creation URLs unchanged', async () => {
		await start('advanced');
		expect(harness.route).toHaveBeenCalledWith(`/gardens/new/advanced/${DRAFT_ID}`, true);
	});
});
