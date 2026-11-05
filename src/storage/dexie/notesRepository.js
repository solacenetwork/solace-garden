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

			try {
				return (await table.update(id, { ...changes })) === 1;
			} catch (error) {
				throwStorageError('update note', error);
			}
		},

		async remove(id) {
			validateRecordId(id);

			try {
				return (await table.where(':id').equals(id).delete()) === 1;
			} catch (error) {
				throwStorageError('remove note', error);
			}
		},
	};

	return Object.freeze({
		...methods,

		// This deliberately supports atomic work within Notes only. Future domain
		// services can add explicit multi-store transactions when a real workflow
		// requires them, without exposing a Dexie transaction to callers.
		async runAtomic(operation) {
			if (typeof operation !== 'function') {
				throw new ValidationError(
					'INVALID_TRANSACTION_OPERATION',
					'runAtomic requires an operation function.',
				);
			}

			try {
				return await database.transaction('rw', table, () => operation(methods));
			} catch (error) {
				throwStorageError('atomic notes', error);
			}
		},
	});
}

