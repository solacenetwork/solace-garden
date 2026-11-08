import { StorageError, ValidationError } from '../errors.js';
import { validateGardenTypeSelection } from '../gardenTypeValidation.js';
import { validateGardenRecord } from '../gardenValidation.js';
import { DEFAULT_LOCATION_ID } from '../locationValidation.js';
import {
	normalizeTemplateConfiguration,
	templateError,
	validateTemplateCreationRequest,
	validateTemplateRecord,
} from '../templateValidation.js';
import { validateRecordId } from '../validation.js';

function copyConfiguration(configuration) {
	return { ...configuration, typeIds: [...configuration.typeIds] };
}

function copyTemplate(template) {
	return template
		? { ...template, configuration: copyConfiguration(template.configuration) }
		: null;
}

export function createGardenTemplatesRepository(database, {
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	const templates = database.table('gardenTemplates');
	const gardens = database.table('gardens');
	const locations = database.table('locations');
	const gardenTypes = database.table('gardenTypes');

	async function run(operation, action) {
		try {
			return await action();
		} catch (error) {
			if (error instanceof ValidationError || error instanceof StorageError) throw error;
			throw new StorageError(operation, error);
		}
	}

	async function validatedCatalog() {
		return gardenTypes.toArray();
	}

	async function validatedTemplate(record, catalog) {
		if (!record) return null;
		validateTemplateRecord(record, catalog);
		return copyTemplate(record);
	}

	return Object.freeze({
		async createFromGarden(request) {
			validateTemplateCreationRequest(request);
			return run('create Garden Template', () => database.transaction(
				'rw', templates, gardens, locations, gardenTypes, async () => {
					const garden = await gardens.get(request.gardenId);
					if (!garden) {
						throw templateError(
							'GARDEN_NOT_FOUND',
							'Template source Garden was not found.',
							'gardenId',
						);
					}
					validateGardenRecord(garden);
					if (!await locations.get(garden.locationId)) {
						throw templateError(
							'LOCATION_NOT_FOUND',
							'Template source Garden must reference an existing Location.',
							'locationId',
						);
					}
					const catalog = await validatedCatalog();
					validateGardenTypeSelection(garden.typeIds, catalog);
					const template = {
						id: randomUUID(),
						name: request.name,
						configuration: normalizeTemplateConfiguration({
							name: garden.name,
							description: garden.description,
							locationId: garden.locationId,
							typeIds: [...garden.typeIds],
							layoutMediaId: garden.layoutMediaId,
						}, catalog),
						createdAt: request.createdAt,
						updatedAt: request.updatedAt,
					};
					validateTemplateRecord(template, catalog);
					await templates.add(template);
					return copyTemplate(template);
				},
			));
		},

		async list() {
			return run('list Garden Templates', () => database.transaction(
				'r', templates, gardenTypes, async () => {
					const catalog = await validatedCatalog();
					return Promise.all((await templates.toArray()).map(
						(template) => validatedTemplate(template, catalog),
					));
				},
			));
		},

		async getById(id) {
			validateRecordId(id);
			return run('get Garden Template', () => database.transaction(
				'r', templates, gardenTypes, async () => validatedTemplate(
					await templates.get(id),
					await validatedCatalog(),
				),
			));
		},

		async resolveConfiguration(id) {
			validateRecordId(id);
			return run('resolve Garden Template', () => database.transaction(
				'r', templates, locations, gardenTypes, async () => {
					const template = await templates.get(id);
					if (!template) return null;
					const catalog = await validatedCatalog();
					validateTemplateRecord(template, catalog);
					const originalLocationId = template.configuration.locationId;
					const locationExists = Boolean(await locations.get(originalLocationId));
					if (!locationExists && !await locations.get(DEFAULT_LOCATION_ID)) {
						throw templateError(
							'DEFAULT_LOCATION_NOT_FOUND',
							'The fallback Location is unavailable.',
							'locationId',
						);
					}
					const resolvedLocationId = locationExists
						? originalLocationId
						: DEFAULT_LOCATION_ID;
					return {
						configuration: {
							...copyConfiguration(template.configuration),
							locationId: resolvedLocationId,
						},
						locationResolution: {
							fallbackOccurred: !locationExists,
							originalLocationId,
							resolvedLocationId,
						},
					};
				},
			));
		},

		async removePermanently(id) {
			validateRecordId(id);
			return run('permanently delete Garden Template', async () => (
				(await templates.where(':id').equals(id).delete()) === 1
			));
		},
	});
}
