import { ValidationError } from '../storage/errors.js';
import { DEFAULT_LOCATION_ID } from './locations.js';

export const EMPTY_GARDEN_DRAFT_FIELDS = Object.freeze({
	name: '',
	subtitle: '',
	description: '',
	locationId: DEFAULT_LOCATION_ID,
	typeIds: Object.freeze([]),
	startDate: '',
	endDate: '',
});

export function copyGardenDraftFields(fields = EMPTY_GARDEN_DRAFT_FIELDS) {
	return { ...fields, typeIds: [...fields.typeIds] };
}

export function gardenDraftFieldsFromTemplate(configuration, currentFields = EMPTY_GARDEN_DRAFT_FIELDS) {
	return {
		...copyGardenDraftFields(currentFields),
		name: configuration.name,
		description: configuration.description ?? '',
		locationId: configuration.locationId,
		typeIds: [...configuration.typeIds],
	};
}

export function gardenTemplateWouldOverwriteDraft(currentFields, templateFields) {
	const currentTypeIds = currentFields.typeIds ?? [];
	const templateTypeIds = templateFields.typeIds ?? [];
	return (
		(currentFields.name.trim() !== '' && currentFields.name !== templateFields.name)
		|| (currentFields.description.trim() !== '' && currentFields.description !== templateFields.description)
		|| (
			currentFields.locationId !== DEFAULT_LOCATION_ID
			&& currentFields.locationId !== templateFields.locationId
		)
		|| (
			currentTypeIds.length > 0
			&& (
				currentTypeIds.length !== templateTypeIds.length
				|| currentTypeIds.some((id, index) => id !== templateTypeIds[index])
			)
		)
	);
}

export function gardenInputFromDraftFields(fields) {
	return {
		name: fields.name,
		subtitle: fields.subtitle,
		description: fields.description,
		locationId: fields.locationId,
		typeIds: [...fields.typeIds],
		startDate: fields.startDate || null,
		endDate: fields.endDate || null,
	};
}

function requireGardenDraft(draft) {
	if (draft && (draft.kind !== 'garden' || draft.subjectId !== null || draft.isNew !== true)) {
		throw new ValidationError('WRONG_DRAFT_KIND', 'This is not a new Garden draft.', { field: 'kind' });
	}
	return draft;
}

export function createGardenDraftsService(repository, {
	now = () => new Date().toISOString(),
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	return Object.freeze({
		async create() {
			const timestamp = now();
			return repository.add({
				id: randomUUID(),
				kind: 'garden',
				subjectId: null,
				isNew: true,
				fields: copyGardenDraftFields(),
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		},

		async getById(id) {
			return requireGardenDraft(await repository.getById(id));
		},

		async list() {
			return (await repository.listByKind('garden'))
				.map(requireGardenDraft)
				.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
		},

		save({ id, fields, createdAt }) {
			return repository.saveExisting({
				id,
				kind: 'garden',
				subjectId: null,
				isNew: true,
				fields: copyGardenDraftFields(fields),
				createdAt: createdAt ?? now(),
				updatedAt: now(),
			}, 'garden');
		},

		remove(id) {
			return repository.remove(id, 'garden');
		},
	});
}
