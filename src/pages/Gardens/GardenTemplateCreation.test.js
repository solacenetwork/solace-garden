import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGardenDraftsService, gardenInputFromDraftFields } from '../../services/gardenDrafts.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardensService } from '../../services/gardens.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import { applyTemplateToGardenDraft } from './FullGardenCreation.jsx';

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
		const first = await drafts.create();
		const secondDrafts = createGardenDraftsService(storage.repositories.drafts, {
			now: () => CREATED,
			randomUUID: () => SECOND_DRAFT,
		});
		const second = await secondDrafts.create();
		const autosave = { stop: async () => {} };

		const firstApplication = await applyTemplateToGardenDraft({
			templateId: template.id, draft: first, currentFields: first.fields,
			autosave, drafts, templates,
		});
		const secondApplication = await applyTemplateToGardenDraft({
			templateId: template.id, draft: second, currentFields: second.fields,
			autosave, drafts: secondDrafts, templates,
		});
		expect(await templates.removePermanently(template.id)).toBe(true);

		const firstGarden = await gardens.createFromDraft(
			gardenInputFromDraftFields(firstApplication.fields),
			first.id,
		);
		const secondGarden = await gardens.createFromDraft(
			gardenInputFromDraftFields(secondApplication.fields),
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
});
