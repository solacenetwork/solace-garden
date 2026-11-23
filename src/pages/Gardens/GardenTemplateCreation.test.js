import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));
import { createGardenDraftsService, gardenInputFromDraftFields } from '../../services/gardenDrafts.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardensService } from '../../services/gardens.js';
import { createLocationsService, DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { initializeGardenDraft } from './FullGardenCreation.jsx';

const FIRST_DRAFT = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const SECOND_DRAFT = 'fe1cbe08-4384-4dfa-9357-4ed87eea0398';
const CREATED = '2026-11-08T18:00:00.000Z';

describe('Garden creation from a saved Template', () => {
	let dependencies;
	let storage;
	let drafts;
	let gardens;
	let templates;

	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		templates = createGardenTemplatesService(storage.repositories.gardenTemplates, { now: () => CREATED });
		drafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED,
			randomUUID: () => FIRST_DRAFT,
		});
	});

	afterEach(async () => {
		storage?.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	it('reuses one snapshot for independent Planned Gardens even when the Template is later deleted', async () => {
		const source = await gardens.create({
			name: 'Source Garden',
			description: 'Reusable details',
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['outdoor', 'container'],
		});
		const template = await templates.createFromGarden({ gardenId: source.id, name: 'Favorite' });
		const secondDrafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED,
			randomUUID: () => SECOND_DRAFT,
		});
		const first = await initializeGardenDraft({
			mode: 'wizard', templateId: template.id, drafts, templates,
		});
		const second = await initializeGardenDraft({
			mode: 'wizard', templateId: template.id, drafts: secondDrafts, templates,
		});
		expect(await templates.removePermanently(template.id)).toBe(true);

		const firstGarden = await gardens.createFromDraft(
			gardenInputFromDraftFields(first.fields),
			first.id,
		);
		const secondGarden = await gardens.createFromDraft(
			gardenInputFromDraftFields(second.fields),
			second.id,
		);

		expect(firstGarden).toMatchObject({
			name: 'Source Garden', description: 'Reusable details', status: 'planned', isClosed: false,
			locationId: DEFAULT_LOCATION_ID, typeIds: ['outdoor', 'container'],
		});
		expect(secondGarden).toMatchObject({ name: 'Source Garden', status: 'planned' });
		expect(new Set([source.id, firstGarden.id, secondGarden.id]).size).toBe(3);
		expect(await drafts.getById(first.id)).toBeNull();
		expect(await drafts.getById(second.id)).toBeNull();
		expect(await templates.getById(template.id)).toBeNull();
	});

	it('keeps an initialized draft authoritative after edits, reload, and source Template deletion', async () => {
		const source = await gardens.create({
			name: 'Template Name',
			description: 'Template description',
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['outdoor'],
		});
		const template = await templates.createFromGarden({ gardenId: source.id, name: 'Starting point' });
		const initialized = await initializeGardenDraft({
			mode: 'advanced', templateId: template.id, drafts, templates,
		});
		expect(initialized).toMatchObject({
			fields: {
				name: 'Template Name',
				description: 'Template description',
				locationId: DEFAULT_LOCATION_ID,
				typeIds: ['outdoor'],
			},
			sourceTemplateId: template.id,
			preferredEditor: 'advanced',
			currentStepId: null,
		});

		await drafts.save({
			id: initialized.id,
			fields: { ...initialized.fields, name: 'Gardener edit' },
		});
		await templates.removePermanently(template.id);
		storage.close();
		storage = await initializeDexieStorage({ dependencies });
		drafts = createGardenDraftsService(storage.repositories.drafts);

		expect(await drafts.getById(initialized.id)).toMatchObject({
			fields: { name: 'Gardener edit', description: 'Template description' },
			sourceTemplateId: template.id,
			preferredEditor: 'advanced',
		});
	});

	it('initializes with Default Location when the saved Template Location was deleted', async () => {
		const locations = createLocationsService(storage.repositories.locations, { now: () => CREATED });
		const custom = await locations.create({ name: 'Former plot' });
		const source = await gardens.create({
			name: 'Portable setup', locationId: custom.id, typeIds: ['container'],
		});
		const template = await templates.createFromGarden({ gardenId: source.id, name: 'Portable' });
		await gardens.update(source.id, { locationId: DEFAULT_LOCATION_ID });
		await locations.remove(custom.id);

		const initialized = await initializeGardenDraft({
			mode: 'wizard', templateId: template.id, drafts, templates,
		});
		expect(initialized).toMatchObject({
			fields: { locationId: DEFAULT_LOCATION_ID, typeIds: ['container'] },
			sourceTemplateId: template.id,
			preferredEditor: 'wizard',
			currentStepId: 'identity',
		});
		expect((await templates.getById(template.id)).configuration.locationId).toBe(custom.id);
	});
});
