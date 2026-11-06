import { StorageError, ValidationError } from '../errors.js';
import {
	validateNewNote,
	validateNoteChanges,
	validateRecordId,
} from '../validation.js';

function copyRecord(record) {
	return record ? { ...record } : null;
}

function throwStorageError(operation, error) {
	// Validation failures describe caller input. Everything raised by Dexie or
	// IndexedDB is normalized to a storage failure without leaking adapter APIs.
	if (error instanceof ValidationError || error instanceof StorageError) {
		throw error;
	}

	throw new StorageError(operation, error);
}

export function createNotesRepository(database, {
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	const table = database.table('notes');
	const gardens = database.table('gardens');
	const drafts = database.table('drafts');

	async function validateGardenReference(gardenId) {
		if (gardenId === null || gardenId === undefined) {
			return;
		}

		let garden;
		try {
			garden = await gardens.get(gardenId);
		} catch (error) {
			throwStorageError('validate garden association', error);
		}

		if (!garden) {
			throw new ValidationError(
				'GARDEN_NOT_FOUND',
				'The selected garden does not exist.',
				{ field: 'gardenId' },
			);
		}
	}

	const methods = {
		async getById(id) {
			validateRecordId(id);

			try {
				return copyRecord(await table.get(id));
			} catch (error) {
				throwStorageError('get note', error);
			}
		},

		async list() {
			try {
				return (await table.toArray()).map(copyRecord);
			} catch (error) {
				throwStorageError('list notes', error);
			}
		},

		async create(record) {
			const note = {
				...record,
				id: record?.id ?? randomUUID(),
			};
			validateNewNote(note);
			if (note.gardenId !== null && note.gardenId !== undefined) {
				await validateGardenReference(note.gardenId);
			}

			try {
				await table.add(note);
				return copyRecord(note);
			} catch (error) {
				throwStorageError('create note', error);
			}
		},

		async update(id, changes) {
			validateRecordId(id);
			validateNoteChanges(changes);
			if (
				Object.hasOwn(changes, 'gardenId') &&
				changes.gardenId !== null
			) {
				await validateGardenReference(changes.gardenId);
			}

			try {
				return (await table.update(id, { ...changes })) === 1;
			} catch (error) {
				throwStorageError('update note', error);
			}
		},

		async remove(id) {
			validateRecordId(id);

			try {
				return await database.transaction('rw', table, drafts, async () => {
					const removed = (await table.where(':id').equals(id).delete()) === 1;
					if (removed) {
						await drafts.where('[kind+subjectId]').equals(['note', id]).delete();
					}
					return removed;
				});
			} catch (error) {
				throwStorageError('remove note', error);
			}
		},
	};

	return Object.freeze({
		...methods,

		async createFromDraft(record, draftId) {
			validateRecordId(draftId, 'draftId');
			try {
				return await database.transaction('rw', table, gardens, drafts, async () => {
					const created = await methods.create(record);
					await drafts.delete(draftId);
					return created;
				});
			} catch (error) {
				throwStorageError('create note from draft', error);
			}
		},

		async updateFromDraft(id, changes, draftId) {
			validateRecordId(draftId, 'draftId');
			try {
				return await database.transaction('rw', table, gardens, drafts, async () => {
					const updated = await methods.update(id, changes);
					if (updated) {
						await drafts.delete(draftId);
					}
					return updated;
				});
			} catch (error) {
				throwStorageError('update note from draft', error);
			}
		},

		// Garden reads are included so linked Notes can be validated in the same
		// transaction. The callback still exposes only storage-neutral Note methods.
		async runAtomic(operation) {
			if (typeof operation !== 'function') {
				throw new ValidationError(
					'INVALID_TRANSACTION_OPERATION',
					'runAtomic requires an operation function.',
				);
			}

			try {
				return await database.transaction(
					'rw',
					table,
					gardens,
					drafts,
					() => operation(methods),
				);
			} catch (error) {
				throwStorageError('atomic notes', error);
			}
		},
	});
}

