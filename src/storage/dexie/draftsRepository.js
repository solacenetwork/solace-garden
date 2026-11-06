import { StorageError, ValidationError } from '../errors.js';
import { validateRecordId } from '../validation.js';

function copyRecord(record) {
	return record ? { ...record } : null;
}

function validateDraft(draft) {
	if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
		throw new ValidationError('INVALID_DRAFT', 'A draft record is required.');
	}

	validateRecordId(draft.id, 'draftId');
	if (typeof draft.kind !== 'string' || draft.kind.length === 0) {
		throw new ValidationError('INVALID_DRAFT_KIND', 'Draft kind is required.', { field: 'kind' });
	}
	if (draft.subjectId !== null) {
		validateRecordId(draft.subjectId, 'subjectId');
	}
	if (typeof draft.isNew !== 'boolean' || draft.isNew !== (draft.subjectId === null)) {
		throw new ValidationError('INVALID_DRAFT_IDENTITY', 'Draft identity is inconsistent.');
	}
	if (typeof draft.text !== 'string') {
		throw new ValidationError('INVALID_DRAFT_TEXT', 'Draft text must be a string.', { field: 'text' });
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
				await table.put({ ...draft });
				return copyRecord(draft);
			} catch (error) {
				storageFailure('save draft', error);
			}
		},

		async remove(id) {
			validateRecordId(id, 'draftId');
			try {
				return (await table.where(':id').equals(id).delete()) === 1;
			} catch (error) {
				storageFailure('remove draft', error);
			}
		},
	});
}
