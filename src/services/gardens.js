import {
	GARDEN_EDITABLE_FIELDS, gardenError, normalizeGardenFields, validateGardenDateOrder, validateGardenFields,
} from '../storage/gardenValidation.js';

const GARDEN_CREATION_FIELDS = [...GARDEN_EDITABLE_FIELDS, 'status'];
const GARDEN_CREATION_STATUSES = ['planned', 'active'];

function newGardenRecord(input, timestamp) {
	validateGardenFields(input, GARDEN_CREATION_FIELDS);
	const status = input.status ?? 'planned';
	if (!GARDEN_CREATION_STATUSES.includes(status)) {
		throw gardenError('INVALID_GARDEN_STATUS', 'New Garden status must be Planned or Active.', 'status');
	}
	const record = {
		subtitle: null, description: null, typeIds: [], startDate: null, endDate: null, notes: null,
		icon: null, color: null,
		...normalizeGardenFields(input),
		status, isClosed: false,
		thumbnailMediaId: null, layoutMediaId: null,
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
		removePermanently(id) {
			return repository.removePermanently(id, now());
		},
	});
}
