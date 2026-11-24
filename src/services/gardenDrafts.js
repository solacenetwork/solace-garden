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
	isClosed: false,
	saveAsTemplate: false,
});

export function copyGardenDraftFields(fields = EMPTY_GARDEN_DRAFT_FIELDS) {
	return { ...fields, typeIds: [...fields.typeIds] };
}

export function gardenDraftFieldsEqual(left, right) {
	if (!left || !right) return false;
	return Object.keys(EMPTY_GARDEN_DRAFT_FIELDS).every((field) => (
		field === 'typeIds'
			? left.typeIds.length === right.typeIds.length
				&& left.typeIds.every((id, index) => id === right.typeIds[index])
			: Object.is(left[field], right[field])
	));
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
		isClosed: fields.isClosed,
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
			currentStepId = preferredEditor === 'wizard' ? 'identity' : null,
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
				currentStepId,
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

export function createGardenDraftPersistence({
	drafts,
	initialDraft = null,
	initialFields = initialDraft?.fields ?? EMPTY_GARDEN_DRAFT_FIELDS,
	preferredEditor,
	sourceTemplateId = initialDraft?.sourceTemplateId ?? null,
	currentStepId = initialDraft?.currentStepId ?? (preferredEditor === 'wizard' ? 'identity' : null),
	onEstablished = () => {},
}) {
	const baseline = copyGardenDraftFields(initialFields);
	let record = initialDraft;
	let savedSourceTemplateId = sourceTemplateId;
	let savedPreferredEditor = preferredEditor;
	let savedCurrentStepId = currentStepId;
	let stopped = false;
	let operationChain = Promise.resolve();

	function enqueue(operation) {
		const result = operationChain.catch(() => undefined).then(operation);
		operationChain = result;
		return result;
	}

	function persist(fields, context = {}) {
		const snapshot = copyGardenDraftFields(fields);
		const nextSourceTemplateId = Object.hasOwn(context, 'sourceTemplateId')
			? context.sourceTemplateId
			: savedSourceTemplateId;
		const nextPreferredEditor = context.preferredEditor ?? savedPreferredEditor;
		const nextCurrentStepId = context.currentStepId !== undefined
			? context.currentStepId
			: nextPreferredEditor === 'wizard' ? savedCurrentStepId : null;
		return enqueue(async () => {
			if (stopped) return record;
			if (!record) {
				if (gardenDraftFieldsEqual(snapshot, baseline) && !context.explicit) return null;
				record = await drafts.create({
					preferredEditor: nextPreferredEditor,
					initialFields: snapshot,
					sourceTemplateId: nextSourceTemplateId,
					currentStepId: nextCurrentStepId,
				});
				savedSourceTemplateId = record.sourceTemplateId;
				savedPreferredEditor = record.preferredEditor;
				savedCurrentStepId = record.currentStepId;
				onEstablished(record);
				return record;
			}
			record = await drafts.save({
				id: record.id,
				fields: snapshot,
				sourceTemplateId: nextSourceTemplateId,
				preferredEditor: nextPreferredEditor,
				currentStepId: nextCurrentStepId,
				createdAt: record.createdAt,
			});
			savedSourceTemplateId = record.sourceTemplateId;
			savedPreferredEditor = record.preferredEditor;
			savedCurrentStepId = record.currentStepId;
			return record;
		});
	}

	return Object.freeze({
		persist,
		getRecord() { return record; },
		async close() {
			stopped = true;
			await operationChain.catch(() => undefined);
		},
		async discard() {
			stopped = true;
			await operationChain.catch(() => undefined);
			if (!record) return false;
			return drafts.remove(record.id);
		},
	});
}
