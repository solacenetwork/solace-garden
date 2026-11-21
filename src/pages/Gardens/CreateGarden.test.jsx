import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGardensService } from '../../services/gardens.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import {
	CreateGardenLandingView,
	createQuickStartSubmitter,
	loadCreateGardenTemplates,
	QUICK_START_TYPE_IDS,
	QuickStartGardenView,
	TemplateMethodContents,
} from './CreateGarden.jsx';

const CREATED = '2026-11-07T18:30:00.000Z';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440010';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

function visibleText(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node !== 'object') return String(node);
	if (Array.isArray(node)) return node.map(visibleText).join(' ');
	if (typeof node.type === 'function') return visibleText(node.type(node.props));
	return visibleText(node.props?.children);
}

describe('Create Garden method landing page', () => {
	const callbacks = {
		onSelectTemplate: vi.fn(),
		onRetryTemplates: vi.fn(),
	};

	it('renders the four responsive method cards in the approved order', () => {
		const tree = CreateGardenLandingView({
			templateState: { status: 'ready', items: [] },
			selectedTemplateId: '',
			...callbacks,
		});
		const grid = nodes(tree).find(({ props }) => props.class === 'garden-create-methods');
		const cards = nodes(grid).filter(({ type }) => type === 'article');

		expect(cards.map(({ props }) => props['data-creation-method'])).toEqual([
			'quickstart', 'wizard', 'template', 'advanced',
		]);
		expect(cards.map((card) => nodes(card).find(({ type }) => type === 'h2').props.children)).toEqual([
			'Quick Start', 'Guided Wizard', 'From Template', 'Advanced Form',
		]);
		expect(tree.props.class).toContain('garden-create');
		expect(grid).toBeTruthy();
		expect(nodes(tree).some(({ props }) => props.class === 'gardens-back')).toBe(false);
	});

	it('uses dispatcher links for direct methods and keeps the Hub return link', () => {
		const tree = CreateGardenLandingView({
			templateState: { status: 'ready', items: [] },
			selectedTemplateId: '',
			...callbacks,
		});
		const hrefs = nodes(tree).filter(({ type }) => type === 'a').map(({ props }) => props.href);
		expect(hrefs).toEqual([
			'/gardens',
			'/gardens/new?type=quickstart',
			'/gardens/new?type=wizard',
			'/templates',
			'/gardens/new?type=advanced',
		]);
	});

	it('renders loading, error, empty, and ready Template selection states', () => {
		const loading = TemplateMethodContents({ state: { status: 'loading', items: [] } });
		expect(loading.props).toMatchObject({ role: 'status' });
		expect(visibleText(loading)).toContain('Loading Templates');

		const onRetry = vi.fn();
		const error = TemplateMethodContents({ state: { status: 'error', items: [] }, onRetry });
		expect(error.props.role).toBe('alert');
		nodes(error).find(({ type }) => type === 'button').props.onClick();
		expect(onRetry).toHaveBeenCalledOnce();

		const empty = TemplateMethodContents({ state: { status: 'ready', items: [] } });
		expect(visibleText(empty)).toContain('No saved Templates');
		expect(nodes(empty).find(({ type }) => type === 'a').props.href).toBe('/templates');

		const onSelect = vi.fn();
		const ready = TemplateMethodContents({
			state: { status: 'ready', items: [{
				id: TEMPLATE_ID,
				name: 'Summer setup',
				configuration: { name: 'Kitchen Garden' },
			}] },
			selectedId: TEMPLATE_ID,
			onSelect,
		});
		const select = nodes(ready).find(({ type }) => type === 'select');
		expect(visibleText(select)).toMatch(/Summer setup\s+—\s+Kitchen Garden/);
		select.props.onChange({ currentTarget: { value: TEMPLATE_ID } });
		expect(onSelect).toHaveBeenCalledWith(TEMPLATE_ID);
		expect(nodes(ready).filter(({ type }) => type === 'a').map(({ props }) => props.href)).toEqual([
			`/gardens/new?type=wizard&source=template&id=${TEMPLATE_ID}`,
			`/gardens/new?type=advanced&source=template&id=${TEMPLATE_ID}`,
		]);
	});

	it('disables Template actions until a saved Template is selected', () => {
		const tree = TemplateMethodContents({
			state: { status: 'ready', items: [{
				id: TEMPLATE_ID, name: 'Saved', configuration: { name: 'Garden' },
			}] },
			selectedId: '',
			onSelect: vi.fn(),
		});
		const actions = nodes(tree).filter(({ type }) => type === 'a');
		expect(actions.map(({ props }) => props.href)).toEqual([undefined, undefined]);
		expect(actions.every(({ props }) => props['aria-disabled'] === 'true' && props.tabIndex === -1)).toBe(true);
	});

	it('reads and sorts Templates without creating a Garden or draft', async () => {
		const createGarden = vi.fn();
		const createDraft = vi.fn();
		const templates = {
			list: vi.fn(async () => [
				{ id: `${TEMPLATE_ID.slice(0, -1)}2`, name: 'Zinnias', configuration: { name: 'Second' } },
				{ id: TEMPLATE_ID, name: 'Annuals', configuration: { name: 'First' } },
			]),
		};
		const state = await loadCreateGardenTemplates(templates);
		expect(state.items.map(({ name }) => name)).toEqual(['Annuals', 'Zinnias']);
		expect(templates.list).toHaveBeenCalledOnce();
		expect(createGarden).not.toHaveBeenCalled();
		expect(createDraft).not.toHaveBeenCalled();

		templates.list.mockRejectedValueOnce(new Error('offline'));
		expect(await loadCreateGardenTemplates(templates)).toEqual({ status: 'error', items: [] });
	});
});

describe('Quick Start Garden creation', () => {
	let dependencies, storage, gardens, navigate;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		navigate = vi.fn();
	});
	afterEach(async () => {
		storage?.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	function submitter(overrides = {}) {
		return createQuickStartSubmitter({
			createGarden: (input) => gardens.create(input),
			navigate,
			...overrides,
		});
	}

	function input(overrides = {}) {
		return { name: 'Garden', subtitle: '', icon: null, color: null, status: 'planned', ...overrides };
	}

	it('renders the expanded fields in order with safe defaults and chooser cancellation', () => {
		const tree = QuickStartGardenView({
			values: input({ name: '' }),
			onChange: vi.fn(),
			onSubmit: vi.fn(),
		});
		const form = nodes(tree).find(({ type }) => type === 'form');
		const sections = form.props.children.filter((child) => child && typeof child === 'object');
		expect(sections.slice(0, 6).map((child) => visibleText(child).trim().split(/\s+/).slice(0, 2).join(' '))).toEqual([
			'Garden Name', 'Subtitle (optional)', 'Icon (optional)', 'Color (optional)',
			'Thumbnail (optional)', 'Status Planned',
		]);
		const thumbnail = nodes(form).find(({ props }) => props.id === 'garden-thumbnail');
		expect(thumbnail.props).toMatchObject({ type: 'file', disabled: true });
		expect(visibleText(form)).toContain('Image uploads will be available later.');
		const radios = nodes(form).filter(({ props }) => props.name === 'garden-status');
		expect(radios.map(({ props }) => [props.value, props.checked])).toEqual([
			['planned', true], ['active', false],
		]);
		expect(nodes(form).find(({ type, props }) => type === 'a' && props.href === '/gardens/new')).toBeTruthy();
		expect(visibleText(form)).not.toContain('Guided Wizard');
		expect(visibleText(form)).not.toContain('Advanced Form');
	});

	it('creates, persists, and navigates to the exact Quick Start record', async () => {
		await storage.repositories.locations.update(DEFAULT_LOCATION_ID, { name: 'Renamed Home' });
		const garden = await submitter()(input({
			name: '  Kitchen Garden  ',
			subtitle: '  South beds  ',
			icon: 'flower1',
			color: '#287d46',
			status: 'active',
		}));

		expect(garden).toEqual({
			id: expect.stringMatching(/^[\da-f-]{36}$/),
			name: 'Kitchen Garden',
			subtitle: 'South beds',
			description: null,
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['in-ground'],
			status: 'active',
			isClosed: false,
			startDate: null,
			endDate: null,
			notes: null,
			icon: 'flower1',
			color: '#287D46',
			thumbnailMediaId: null,
			layoutMediaId: null,
			createdAt: CREATED,
			updatedAt: CREATED,
		});
		expect(await gardens.getById(garden.id)).toEqual(garden);
		expect(await storage.repositories.drafts.listByKind('garden')).toEqual([]);
		expect(navigate).toHaveBeenCalledOnce();
		expect(navigate).toHaveBeenCalledWith(`/gardens/${garden.id}`);
		expect(QUICK_START_TYPE_IDS).toEqual(['in-ground']);
	});

	it.each(['', '   ', '\n\t'])('rejects a blank name before persistence: %j', async (name) => {
		const onFieldError = vi.fn();
		const result = await submitter({ onFieldError })(input({ name }));
		expect(result).toBeNull();
		expect(onFieldError).toHaveBeenLastCalledWith('name', 'Enter a Garden name.');
		expect(await gardens.list()).toEqual([]);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('allows intentional duplicate names while assigning independent UUIDs', async () => {
		const submit = submitter();
		const first = await submit(input({ name: 'Same Name' }));
		const second = await submit(input({ name: 'Same Name' }));
		expect(second.id).not.toBe(first.id);
		expect((await gardens.list()).map(({ name }) => name)).toEqual(['Same Name', 'Same Name']);
	});

	it('blocks rapid duplicate submissions while the first save is pending', async () => {
		let finish;
		const pending = new Promise((resolve) => { finish = resolve; });
		const createGarden = vi.fn(() => pending);
		const onSaving = vi.fn();
		const submit = submitter({ createGarden, onSaving });

		const first = submit(input());
		const duplicate = submit(input());
		expect(createGarden).toHaveBeenCalledOnce();
		expect(await duplicate).toBeNull();
		finish({ id: '550e8400-e29b-41d4-a716-446655440001' });
		await first;
		expect(onSaving.mock.calls.map(([value]) => value)).toEqual([true, false]);
	});

	it('preserves the submitted identity and status after failure and permits a retry', async () => {
		const createGarden = vi.fn()
			.mockRejectedValueOnce(new Error('simulated storage failure'))
			.mockImplementation((input) => gardens.create(input));
		const onSaveError = vi.fn();
		const submit = submitter({ createGarden, onSaveError });

		const values = input({ name: 'Retry Garden', subtitle: 'Keep me', icon: 'tree-fill', color: '#397CAD', status: 'active' });
		expect(await submit(values)).toBeNull();
		expect(onSaveError).toHaveBeenLastCalledWith(expect.stringContaining('try again'));
		expect(navigate).not.toHaveBeenCalled();
		const garden = await submit(values);
		expect(garden).toMatchObject(values);
		expect(createGarden).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenCalledWith(`/gardens/${garden.id}`);
	});
});
