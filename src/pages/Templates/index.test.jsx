import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createGardensService } from '../../services/gardens.js';
import { createLocationsService } from '../../services/locations.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { DEFAULT_LOCATION_ID } from '../../storage/locationValidation.js';
import {
	createTemplateDeleteSubmitter,
	loadTemplatesPage,
	TemplateDeletionDialog,
	TemplatesPageView,
} from './index.jsx';

const CREATED = '2026-11-08T19:00:00.000Z';

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

describe('Templates management page', () => {
	let dependencies;
	let storage;
	let gardens;
	let templates;
	let locations;
	let types;

	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates, { now: () => CREATED });
		locations = createLocationsService(storage.repositories.locations, { now: () => CREATED });
		types = createGardenTypesService(storage.repositories.gardenTypes);
	});

	afterEach(async () => {
		storage.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	function readers() {
		return { templates, locations, types };
	}

	async function createTemplate({ templateName = 'Favorite', gardenName = 'Kitchen Garden', locationId = DEFAULT_LOCATION_ID } = {}) {
		const garden = await gardens.create({
			name: gardenName,
			description: 'Reusable details',
			locationId,
			typeIds: ['outdoor', 'raised-bed'],
		});
		return {
			garden,
			template: await templates.createFromGarden({ gardenId: garden.id, name: templateName }),
		};
	}

	it('renders loading, retryable errors, and an informative empty state', () => {
		const retry = vi.fn();
		expect(nodes(TemplatesPageView({ state: { status: 'loading', items: [] } }))
			.some((node) => node.props?.role === 'status')).toBe(true);
		const error = TemplatesPageView({ state: { status: 'error', items: [] }, onRetry: retry });
		expect(text(error)).toContain('could not be loaded');
		nodes(error).find((node) => node.type === 'button').props.onClick();
		expect(retry).toHaveBeenCalledOnce();
		const empty = TemplatesPageView({ state: { status: 'ready', items: [] } });
		expect(text(empty)).toContain('No Templates saved yet');
		expect(text(empty)).toContain('Save as Template');
		expect(nodes(empty).find((node) => node.props?.href === '/gardens')).toBeTruthy();
	});

	it('loads saved configuration with current Location and Garden Type labels after reopen', async () => {
		const { template } = await createTemplate();
		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates);
		locations = createLocationsService(storage.repositories.locations);
		types = createGardenTypesService(storage.repositories.gardenTypes);

		const state = await loadTemplatesPage(readers());
		expect(state).toMatchObject({
			status: 'ready',
			items: [{
				id: template.id,
				name: 'Favorite',
				locationName: 'Default',
				locationAvailable: true,
				typeNames: ['Outdoor', 'Raised Bed'],
			}],
		});
		const view = TemplatesPageView({ state, onRequestDelete: vi.fn() });
		for (const value of ['Favorite', 'Kitchen Garden', 'Default', 'Outdoor, Raised Bed', 'Reusable details']) {
			expect(text(view)).toContain(value);
		}
		expect(text(view)).not.toContain('Gallery');
	});

	it('keeps duplicate names as independent UUID-keyed cards and deletion targets', async () => {
		const first = await createTemplate({ templateName: 'Same name', gardenName: 'First Garden' });
		const second = await createTemplate({ templateName: 'Same name', gardenName: 'Second Garden' });
		const state = await loadTemplatesPage(readers());
		const onRequestDelete = vi.fn();
		const view = TemplatesPageView({ state, onRequestDelete });
		const cards = nodes(view).filter((node) => node.props?.class === 'template-card');
		expect(cards.map(({ key }) => key).sort()).toEqual([first.template.id, second.template.id].sort());
		expect(text(view).match(/Same name/g)).toHaveLength(2);
		const buttons = nodes(view).filter((node) => node.type === 'button');
		buttons[1].props.onClick({ currentTarget: { id: 'trigger' } });
		expect(onRequestDelete).toHaveBeenCalledWith(
			expect.objectContaining({ id: state.items[1].id }),
			expect.objectContaining({ id: 'trigger' }),
		);
	});

	it('shows a missing saved Location without resolving or mutating the Template', async () => {
		const custom = await locations.create({ name: 'Temporary allotment' });
		const { garden, template } = await createTemplate({ locationId: custom.id });
		await gardens.update(garden.id, { locationId: DEFAULT_LOCATION_ID });
		await locations.remove(custom.id);

		const state = await loadTemplatesPage(readers());
		expect(state.items[0]).toMatchObject({
			locationName: 'Saved Location unavailable',
			locationAvailable: false,
		});
		expect(text(TemplatesPageView({ state, onRequestDelete: vi.fn() })))
			.toContain('Saved Location unavailable');
		expect((await templates.getById(template.id)).configuration.locationId).toBe(custom.id);
	});

	it('uses an accessible confirmation that distinguishes duplicate names and explains effects', () => {
		const template = {
			id: 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01',
			name: 'Favorite',
			configuration: { name: 'Kitchen Garden' },
		};
		const onCancel = vi.fn();
		const tree = TemplateDeletionDialog({
			template, busy: false, error: '', onCancel, onConfirm: vi.fn(),
		});
		const copy = text(tree);
		expect(nodes(tree).find((node) => node.type === 'dialog').props['aria-describedby'])
			.toBe('template-deletion-description');
		for (const value of [template.name, template.configuration.name, template.id, 'Existing Gardens are unaffected', 'source Garden and other records will not be deleted']) {
			expect(copy).toContain(value);
		}
		nodes(tree).find((node) => node.props?.class === 'btn-outline').props.onClick();
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('permanently deletes only the selected Template and refresh data reflects removal', async () => {
		const { garden, template } = await createTemplate();
		const before = await gardens.getById(garden.id);
		const remove = createTemplateDeleteSubmitter({
			removeTemplate: (id) => templates.removePermanently(id),
		});
		expect(await remove(template.id)).toBe(true);
		expect((await loadTemplatesPage(readers())).items).toEqual([]);
		expect(await gardens.getById(garden.id)).toEqual(before);
	});

	it('blocks repeated deletion and safely permits retry after failure', async () => {
		let finish;
		const pending = new Promise((resolve) => { finish = resolve; });
		const removeTemplate = vi.fn()
			.mockReturnValueOnce(pending)
			.mockRejectedValueOnce(new Error('storage failed'))
			.mockResolvedValueOnce(true);
		const onDeleteError = vi.fn();
		const onDeleting = vi.fn();
		const remove = createTemplateDeleteSubmitter({ removeTemplate, onDeleteError, onDeleting });

		const first = remove('one');
		expect(await remove('one')).toBe(false);
		expect(removeTemplate).toHaveBeenCalledOnce();
		finish(true);
		expect(await first).toBe(true);
		expect(await remove('one')).toBe(false);
		expect(onDeleteError).toHaveBeenCalledWith(expect.stringContaining('Nothing else was changed'));
		expect(await remove('one')).toBe(true);
		expect(onDeleting.mock.calls.map(([value]) => value)).toEqual([
			true, false, true, false, true, false,
		]);
	});
});
