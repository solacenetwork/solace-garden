import { StorageError, ValidationError } from '../errors.js';
import { validateRecordId } from '../validation.js';

function copyRecord(record) {
	if (!record) return null;
	return record.kind === 'garden'
		? { ...record, fields: { ...record.fields, typeIds: [...record.fields.typeIds] } }
		: { ...record };
}

const GARDEN_DRAFT_FIELDS = Object.freeze([
	'name', 'subtitle', 'description', 'locationId', 'typeIds', 'startDate', 'endDate',
]);
const GARDEN_DRAFT_CONTEXT_FIELDS = Object.freeze(['sourceTemplateId', 'preferredEditor']);

function preserveGardenDraftContext(draft, existing) {
	if (draft.kind !== 'garden') return draft;
	const saved = { ...draft };
	for (const field of GARDEN_DRAFT_CONTEXT_FIELDS) {
		if (!Object.hasOwn(saved, field) && Object.hasOwn(existing, field)) {
			saved[field] = existing[field];
		}
	}
	return saved;
}

function validateGardenDraftFields(fields) {
	if (!fields || Object.getPrototypeOf(fields) !== Object.prototype) {
		throw new ValidationError('INVALID_GARDEN_DRAFT_FIELDS', 'Garden draft fields are required.', { field: 'fields' });
	}
	const unsupported = Object.keys(fields).find((field) => !GARDEN_DRAFT_FIELDS.includes(field));
	if (unsupported || GARDEN_DRAFT_FIELDS.some((field) => !Object.hasOwn(fields, field))) {
		throw new ValidationError('INVALID_GARDEN_DRAFT_FIELDS', 'Garden draft fields do not match the creation form.', { field: unsupported ?? 'fields' });
	}
	for (const field of GARDEN_DRAFT_FIELDS.filter((field) => field !== 'typeIds')) {
		if (typeof fields[field] !== 'string') {
			throw new ValidationError('INVALID_GARDEN_DRAFT_FIELD', `${field} must be text.`, { field });
		}
	}
	if (!Array.isArray(fields.typeIds) || fields.typeIds.some((id) => typeof id !== 'string')) {
		throw new ValidationError('INVALID_GARDEN_DRAFT_FIELD', 'Garden draft typeIds must be an array of strings.', { field: 'typeIds' });
	}
}

function validateDraft(draft) {
	if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
		throw new ValidationError('INVALID_DRAFT', 'A draft record is required.');
	}
	const allowed = new Set([
		'id', 'kind', 'subjectId', 'isNew', 'createdAt', 'updatedAt',
		draft.kind === 'garden' ? 'fields' : 'text',
		...(draft.kind === 'garden' ? GARDEN_DRAFT_CONTEXT_FIELDS : []),
	]);
	const unsupported = Object.keys(draft).find((field) => !allowed.has(field));
	if (unsupported) {
		throw new ValidationError('UNSUPPORTED_DRAFT_FIELD', `${unsupported} is not supported for this draft.`, { field: unsupported });
	}

	validateRecordId(draft.id, 'draftId');
	if (!['note', 'garden'].includes(draft.kind)) {
		throw new ValidationError('INVALID_DRAFT_KIND', 'Draft kind is required.', { field: 'kind' });
	}
	if (draft.subjectId !== null) {
		validateRecordId(draft.subjectId, 'subjectId');
	}
	if (typeof draft.isNew !== 'boolean' || draft.isNew !== (draft.subjectId === null)) {
		throw new ValidationError('INVALID_DRAFT_IDENTITY', 'Draft identity is inconsistent.');
	}
	if (draft.kind === 'note') {
		if (typeof draft.text !== 'string' || Object.hasOwn(draft, 'fields')) {
			throw new ValidationError('INVALID_DRAFT_TEXT', 'Note draft text must be a string.', { field: 'text' });
		}
	} else {
		if (draft.subjectId !== null || draft.isNew !== true || Object.hasOwn(draft, 'text')) {
			throw new ValidationError('INVALID_GARDEN_DRAFT_IDENTITY', 'Garden drafts must describe a new Garden.');
		}
		validateGardenDraftFields(draft.fields);
		if (Object.hasOwn(draft, 'sourceTemplateId') && draft.sourceTemplateId !== null) {
			validateRecordId(draft.sourceTemplateId, 'sourceTemplateId');
		}
		if (Object.hasOwn(draft, 'preferredEditor') && !['wizard', 'advanced'].includes(draft.preferredEditor)) {
			throw new ValidationError('INVALID_GARDEN_DRAFT_EDITOR', 'Garden draft editor must be wizard or advanced.', { field: 'preferredEditor' });
		}
	}
	for (const field of ['createdAt', 'updatedAt']) {
		if (typeof draft[field] !== 'string' || draft[field].length === 0) {
			throw new ValidationError('INVALID_DRAFT_TIMESTAMP', `${field} is required.`, { field });
		}
	}
}

function storageFailure(operation, error) {
	if (error instanceof ValidationError || error instanceof StorageError) {
		throw error;
	}
	throw new StorageError(operation, error);
}

export function createDraftsRepository(database) {
	const table = database.table('drafts');

	return Object.freeze({
		async getById(id) {
			validateRecordId(id, 'draftId');
			try {
				return copyRecord(await table.get(id));
			} catch (error) {
				storageFailure('get draft', error);
			}
		},

		async getForSubject(kind, subjectId) {
			validateRecordId(subjectId, 'subjectId');
			try {
				return copyRecord(await table.where('[kind+subjectId]').equals([kind, subjectId]).first());
			} catch (error) {
				storageFailure('get subject draft', error);
			}
		},

		async listByKind(kind) {
			try {
				return (await table.where('kind').equals(kind).toArray()).map(copyRecord);
			} catch (error) {
				storageFailure('list drafts', error);
			}
		},

		async save(draft) {
			validateDraft(draft);
			try {
				await table.put(copyRecord(draft));
				return copyRecord(draft);
			} catch (error) {
				storageFailure('save draft', error);
			}
		},

		async saveForKind(draft, expectedKind) {
			validateDraft(draft);
			try {
				return await database.transaction('rw', table, async () => {
					const existing = await table.get(draft.id);
					if (existing && existing.kind !== expectedKind) {
						throw new ValidationError('WRONG_DRAFT_KIND', `This is not a ${expectedKind} draft.`, { field: 'kind' });
					}
					const saved = copyRecord({
						...draft,
						...(existing ? { createdAt: existing.createdAt } : {}),
					});
					await table.put(saved);
					return copyRecord(saved);
				});
			} catch (error) {
				storageFailure('save draft kind', error);
			}
		},

		async add(draft) {
			validateDraft(draft);
			try {
				await table.add(copyRecord(draft));
				return copyRecord(draft);
			} catch (error) {
				storageFailure('create draft', error);
			}
		},

		async saveExisting(draft, expectedKind) {
			validateDraft(draft);
			try {
				return await database.transaction('rw', table, async () => {
					const existing = await table.get(draft.id);
					if (!existing) {
						throw new ValidationError('DRAFT_NOT_FOUND', 'This draft is no longer available.', { field: 'draftId' });
					}
					if (existing.kind !== expectedKind || draft.kind !== expectedKind) {
						throw new ValidationError('WRONG_DRAFT_KIND', `This is not a ${expectedKind} draft.`, { field: 'kind' });
					}
					const saved = copyRecord({
						...preserveGardenDraftContext(draft, existing),
						createdAt: existing.createdAt,
					});
					await table.put(saved);
					return copyRecord(saved);
				});
			} catch (error) {
				storageFailure('save existing draft', error);
			}
		},

		async remove(id, expectedKind) {
			validateRecordId(id, 'draftId');
			try {
				return await database.transaction('rw', table, async () => {
					const draft = await table.get(id);
					if (!draft) return false;
					if (expectedKind && draft.kind !== expectedKind) {
						throw new ValidationError('WRONG_DRAFT_KIND', `This is not a ${expectedKind} draft.`, { field: 'kind' });
					}
					await table.delete(id);
					return true;
				});
			} catch (error) {
				storageFailure('remove draft', error);
			}
		},
	});
}
