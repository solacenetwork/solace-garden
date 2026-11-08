import {
	normalizeTemplateName,
	templateError,
} from '../storage/templateValidation.js';
import { validateRecordId } from '../storage/validation.js';

function validateCreationInput(input) {
	if (!input || Object.getPrototypeOf(input) !== Object.prototype) {
		throw templateError(
			'INVALID_TEMPLATE',
			'Template creation requires a plain record.',
		);
	}
	for (const field of Object.keys(input)) {
		if (!['gardenId', 'name'].includes(field)) {
			throw templateError(
				'UNSUPPORTED_TEMPLATE_FIELD',
				`${field} cannot be supplied when creating a Template.`,
				field,
			);
		}
	}
	validateRecordId(input.gardenId, 'gardenId');
	return {
		gardenId: input.gardenId,
		name: normalizeTemplateName(input.name),
	};
}

export function createGardenTemplatesService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		list() {
			return repository.list();
		},

		getById(id) {
			return repository.getById(id);
		},

		async createFromGarden(input) {
			const timestamp = now();
			return repository.createFromGarden({
				...validateCreationInput(input),
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		},

		resolveConfiguration(id) {
			return repository.resolveConfiguration(id);
		},

		removePermanently(id) {
			return repository.removePermanently(id);
		},
	});
}
