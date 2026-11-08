import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

import { createGardenLifecycleService } from '../../services/gardenLifecycle.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardensService } from '../../services/gardens.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { DEFAULT_LOCATION_ID } from '../../storage/locationValidation.js';
import { GardenDetailView } from './index.jsx';
import {
	createSaveTemplateSubmitter,
	savedTemplateConfirmation,
	SaveTemplateDialog,
	suggestedTemplateName,
} from './GardenSaveTemplate.jsx';

const CREATED = '2026-11-08T18:00:00.000Z';

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

describe('Save Garden as Template UI', () => {
	let dependencies;
	let storage;
	let gardens;
	let templates;

	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates, {
			now: () => CREATED,
		});
	});

	afterEach(async () => {
		storage.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	async function createGarden(name = 'Kitchen Garden') {
		return gardens.create({
			name,
			description: 'Keep this setup',
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['outdoor'],
		});
	}

	function submitter(overrides = {}) {
		return createSaveTemplateSubmitter({
			createTemplate: (input) => templates.createFromGarden(input),
			...overrides,
		});
	}

	it('suggests a name and renders an accessible Bootstrap 6 native Dialog', () => {
		const garden = { id: 'garden-id', name: 'Kitchen Garden' };
		const onCancel = vi.fn();
		const onSubmit = vi.fn();
		const onNameChange = vi.fn();
		const tree = SaveTemplateDialog({
			garden,
			name: suggestedTemplateName(garden.name),
			onNameChange,
			nameError: '',
			saveError: '',
			busy: false,
			onCancel,
			onSubmit,
		});
		const dialog = nodes(tree).find((node) => node.type === 'dialog');
		const input = nodes(tree).find((node) => node.type === 'input');
		expect(suggestedTemplateName(garden.name)).toBe('Kitchen Garden Template');
		expect(savedTemplateConfirmation('Kitchen setup')).toBe('Template “Kitchen setup” was saved.');
		expect(dialog.props.class).toContain('dialog');
		expect(dialog.props.class).toContain('dialog-scrollable');
		expect(dialog.props['aria-labelledby']).toBe('save-template-title');
		expect(input.props.value).toBe('Kitchen Garden Template');
		input.props.onInput({ currentTarget: { value: 'My setup' } });
		expect(onNameChange).toHaveBeenCalledWith('My setup');
		nodes(tree).find((node) => node.props?.class === 'btn-outline').props.onClick();
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('shows inline name and retryable storage errors without replacing the entered name', () => {
		const tree = SaveTemplateDialog({
			garden: { name: 'Garden' },
			name: 'Keep this name',
			onNameChange: vi.fn(),
			nameError: 'Enter a Template name.',
			saveError: 'This Template could not be saved. Your name was kept so you can try again.',
			busy: false,
			onCancel: vi.fn(),
			onSubmit: vi.fn(),
		});
		const input = nodes(tree).find((node) => node.type === 'input');
		expect(input.props.value).toBe('Keep this name');
		expect(input.props['aria-invalid']).toBe('true');
		expect(text(tree)).toContain('Enter a Template name.');
		expect(text(tree)).toContain('Your name was kept');
		expect(nodes(tree).filter((node) => node.props?.role === 'alert')).toHaveLength(2);
	});

	it('creates an independent snapshot from a normal Garden and leaves it unchanged', async () => {
		const garden = await createGarden();
		const before = await gardens.getById(garden.id);
		const created = await submitter()(garden.id, '  Favorite setup  ');
		expect(created).toMatchObject({
			name: 'Favorite setup',
			configuration: { name: garden.name, description: garden.description },
		});
		expect(await gardens.getById(garden.id)).toEqual(before);
	});

	it.each(['closed', 'archived'])('saves from a %s Garden and keeps the action visible', async (state) => {
		const garden = await createGarden(`${state} Garden`);
		const lifecycle = createGardenLifecycleService(storage.repositories.gardens, { now: () => CREATED });
		if (state === 'closed') {
			await lifecycle.close(garden.id, {}, { status: garden.status, isClosed: garden.isClosed });
		} else {
			await lifecycle.archive(garden.id, { status: garden.status, isClosed: garden.isClosed });
		}
		const source = await gardens.getById(garden.id);
		const created = await submitter()(source.id, `${state} snapshot`);
		expect(created.configuration.name).toBe(source.name);

		const action = { type: 'button', props: { children: 'Save as Template' } };
		const tree = GardenDetailView({
			state: {
				status: 'ready',
				garden: {
					...source, statusLabel: state, locationName: 'Default', typeNames: ['Outdoor'],
				},
				associations: { notes: [], tasks: [], wishlist: [] },
			},
			saveTemplate: action,
		});
		expect(nodes(tree)).toContain(action);
		expect(nodes(tree).some((node) => node.props?.href === `/gardens/${source.id}/edit`)).toBe(false);
	});

	it('validates blank names and permits cancellation without persistence', async () => {
		const garden = await createGarden();
		const onNameError = vi.fn();
		const createTemplate = vi.fn((input) => templates.createFromGarden(input));
		const submit = createSaveTemplateSubmitter({ createTemplate, onNameError });
		expect(await submit(garden.id, '   ')).toBeNull();
		expect(onNameError).toHaveBeenCalledWith('Enter a Template name.');
		expect(createTemplate).not.toHaveBeenCalled();
		expect(await templates.list()).toEqual([]);
	});

	it('blocks duplicate submissions, recovers from storage errors, and supports repeated saves', async () => {
		const garden = await createGarden();
		let finish;
		const pending = new Promise((resolve) => { finish = resolve; });
		const createTemplate = vi.fn()
			.mockReturnValueOnce(pending)
			.mockRejectedValueOnce(new Error('storage failed'))
			.mockImplementation((input) => templates.createFromGarden(input));
		const onSaveError = vi.fn();
		const onSaving = vi.fn();
		const submit = createSaveTemplateSubmitter({ createTemplate, onSaveError, onSaving });

		const first = submit(garden.id, 'First');
		expect(await submit(garden.id, 'Duplicate')).toBeNull();
		expect(createTemplate).toHaveBeenCalledOnce();
		finish({ id: 'first', name: 'First' });
		await first;
		expect(await submit(garden.id, 'Retry name')).toBeNull();
		expect(onSaveError).toHaveBeenCalledWith(expect.stringContaining('name was kept'));
		const saved = await submit(garden.id, 'Retry name');
		expect(saved.name).toBe('Retry name');
		expect(createTemplate).toHaveBeenCalledTimes(3);
		expect(onSaving.mock.calls.map(([value]) => value)).toEqual([
			true, false, true, false, true, false,
		]);
	});
});
