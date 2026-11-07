import {
	GARDEN_EDITABLE_FIELDS, normalizeGardenFields, validateGardenFields,
} from '../storage/gardenValidation.js';

export function createGardensService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		list() { return repository.list(); },
		getById(id) { return repository.getById(id); },
		async create(input) {
			validateGardenFields(input, GARDEN_EDITABLE_FIELDS);
			const timestamp = now();
			return repository.create({
				subtitle: null, description: null, typeIds: [], startDate: null, endDate: null, notes: null,
				...normalizeGardenFields({ name: input.name, locationId: input.locationId, ...input }),
				status: 'planned', isClosed: false,
				icon: null, color: null, thumbnailMediaId: null, layoutMediaId: null,
				createdAt: timestamp, updatedAt: timestamp,
			});
		},
		async update(id, changes) {
			validateGardenFields(changes, GARDEN_EDITABLE_FIELDS, { requireChanges: true });
			return repository.update(id, { ...normalizeGardenFields(changes), updatedAt: now() });
		},
	});
}
