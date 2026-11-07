import {
	GARDEN_EDITABLE_FIELDS, normalizeGardenFields, validateGardenDateOrder, validateGardenFields,
} from '../storage/gardenValidation.js';

function newGardenRecord(input, timestamp) {
	validateGardenFields(input, GARDEN_EDITABLE_FIELDS);
	const record = {
		subtitle: null, description: null, typeIds: [], startDate: null, endDate: null, notes: null,
		...normalizeGardenFields({ name: input.name, locationId: input.locationId, ...input }),
		status: 'planned', isClosed: false,
		icon: null, color: null, thumbnailMediaId: null, layoutMediaId: null,
		createdAt: timestamp, updatedAt: timestamp,
	};
	validateGardenDateOrder(record);
	return record;
}

export function createGardensService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		list() { return repository.list(); },
		getById(id) { return repository.getById(id); },
		validate(input) { return newGardenRecord(input, now()); },
		async create(input) {
			return repository.create(newGardenRecord(input, now()));
		},
		async createFromDraft(input, draftId) {
			return repository.createFromDraft(newGardenRecord(input, now()), draftId);
		},
		async update(id, changes) {
			validateGardenFields(changes, GARDEN_EDITABLE_FIELDS, { requireChanges: true });
			return repository.update(id, { ...normalizeGardenFields(changes), updatedAt: now() });
		},
	});
}
