import {
	GARDEN_CREATION_POLICIES, GARDEN_EDITABLE_FIELDS, GARDEN_STATUSES, gardenError,
	normalizeGardenFields, validateGardenDateOrder, validateGardenFields, validateGardenLifecycle,
} from '../storage/gardenValidation.js';
import { normalizeTemplateName } from '../storage/templateValidation.js';

const GARDEN_CREATION_FIELDS = [...GARDEN_EDITABLE_FIELDS, 'status', 'isClosed'];
const GARDEN_CREATION_STATUSES = ['planned', 'active'];

function newGardenRecord(input, timestamp, creationPolicy = GARDEN_CREATION_POLICIES.ORDINARY) {
	const advanced = creationPolicy === GARDEN_CREATION_POLICIES.ADVANCED;
	validateGardenFields(input, GARDEN_CREATION_FIELDS);
	const status = input.status === undefined ? 'planned' : input.status;
	if (!(advanced ? GARDEN_STATUSES : GARDEN_CREATION_STATUSES).includes(status)) {
		throw gardenError('INVALID_GARDEN_STATUS', advanced
			? 'New Garden status must be Planned, Active, Completed, or Archived.'
			: 'New Garden status must be Planned or Active.', 'status');
	}
	const isClosed = input.isClosed === undefined ? false : input.isClosed;
	validateGardenLifecycle({ status, isClosed });
	if (!advanced && isClosed) {
		throw gardenError('INVALID_GARDEN_LIFECYCLE', 'New Gardens must be open.', 'isClosed');
	}
	const record = {
		subtitle: null, description: null, typeIds: [], startDate: null, endDate: null, notes: null,
		icon: null, color: null,
		...normalizeGardenFields({ name: input.name, locationId: input.locationId, ...input }),
		status, isClosed,
		thumbnailMediaId: null, layoutMediaId: null,
		createdAt: timestamp, updatedAt: timestamp,
	};
	validateGardenDateOrder(record);
	return record;
}

export function createGardensService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	function creationOperations(creationPolicy) {
		const repositoryOptions = { creationPolicy };
		return Object.freeze({
			validate(input) { return newGardenRecord(input, now(), creationPolicy); },
			async create(input) {
				return repository.create(newGardenRecord(input, now(), creationPolicy), repositoryOptions);
			},
			async createFromDraft(input, draftId) {
				return repository.createFromDraft(
					newGardenRecord(input, now(), creationPolicy), draftId, undefined, repositoryOptions,
				);
			},
			async createFromDraftWithTemplate(input, draftId, templateName) {
				const timestamp = now();
				return repository.createFromDraft(
					newGardenRecord(input, timestamp, creationPolicy),
					draftId,
					{ name: normalizeTemplateName(templateName), createdAt: timestamp, updatedAt: timestamp },
					repositoryOptions,
				);
			},
		});
	}
	const ordinary = creationOperations(GARDEN_CREATION_POLICIES.ORDINARY);
	const advanced = creationOperations(GARDEN_CREATION_POLICIES.ADVANCED);
	return Object.freeze({
		list() { return repository.list(); },
		getById(id) { return repository.getById(id); },
		validate: ordinary.validate,
		create: ordinary.create,
		createFromDraft: ordinary.createFromDraft,
		createFromDraftWithTemplate: ordinary.createFromDraftWithTemplate,
		advanced,
		async update(id, changes) {
			validateGardenFields(changes, GARDEN_EDITABLE_FIELDS, { requireChanges: true });
			return repository.update(id, { ...normalizeGardenFields(changes), updatedAt: now() });
		},
		removePermanently(id) {
			return repository.removePermanently(id, now());
		},
	});
}
