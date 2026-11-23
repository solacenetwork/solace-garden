import { createUUID } from '../utils/uuid.js';
import { ValidationError } from '../storage/errors.js';
import { DEFAULT_LOCATION_ID } from './locations.js';

export const EMPTY_GARDEN_DRAFT_FIELDS = Object.freeze({
	name: '',
	subtitle: '',
	icon: null,
	color: null,
	description: '',
	locationId: DEFAULT_LOCATION_ID,
	typeIds: Object.freeze([]),
	startDate: '',
	endDate: '',
	status: 'planned',
	saveAsTemplate: false,
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

export function gardenInputFromDraftFields(fields) {
	return {
		name: fields.name,
		subtitle: fields.subtitle,
		icon: fields.icon,
		color: fields.color,
		description: fields.description,
		locationId: fields.locationId,
		typeIds: [...fields.typeIds],
		startDate: fields.startDate || null,
		endDate: fields.endDate || null,
		status: fields.status,
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
	randomUUID = createUUID,
} = {}) {
	return Object.freeze({
		async create({
			preferredEditor = 'wizard',
			initialFields = EMPTY_GARDEN_DRAFT_FIELDS,
			sourceTemplateId = null,
		} = {}) {
			const timestamp = now();
			return requireGardenDraft(await repository.add({
				id: randomUUID(),
				kind: 'garden',
				subjectId: null,
				isNew: true,
				fields: copyGardenDraftFields(initialFields),
				sourceTemplateId,
				preferredEditor,
				currentStepId: preferredEditor === 'wizard' ? 'identity' : null,
				createdAt: timestamp,
				updatedAt: timestamp,
			}));
		},

		async getById(id) {
			return requireGardenDraft(await repository.getById(id));
		},

		async list() {
			return (await repository.listByKind('garden'))
				.map(requireGardenDraft)
				.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
		},

		async save({
			id,
			fields,
			sourceTemplateId,
			preferredEditor,
			currentStepId,
			createdAt,
		}) {
			return requireGardenDraft(await repository.saveExisting({
				id,
				kind: 'garden',
				subjectId: null,
				isNew: true,
				fields: copyGardenDraftFields(fields),
				...(sourceTemplateId !== undefined ? { sourceTemplateId } : {}),
				...(preferredEditor !== undefined ? { preferredEditor } : {}),
				...(currentStepId !== undefined
					? { currentStepId }
					: preferredEditor !== undefined
						? { currentStepId: preferredEditor === 'wizard' ? 'identity' : null }
						: {}),
				createdAt: createdAt ?? now(),
				updatedAt: now(),
			}, 'garden'));
		},

		remove(id) {
			return repository.remove(id, 'garden');
		},
	});
}
