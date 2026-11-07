import { StorageError, ValidationError } from '../errors.js';
import { validateRecordId } from '../validation.js';
import { validateGardenTypeSelection } from '../gardenTypeValidation.js';
import {
	GARDEN_EDITABLE_FIELDS, gardenError, validateGardenFields, validateGardenRecord,
	validateGardenLifecycle,
} from '../gardenValidation.js';

function copy(record) {
	return record ? { ...record, typeIds: [...record.typeIds] } : null;
}

export function createGardensRepository(database, {
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	const gardens = database.table('gardens');
	const locations = database.table('locations');
	const types = database.table('gardenTypes');
	const drafts = database.table('drafts');
	async function run(operation, action) {
		try { return await action(); } catch (error) {
			if (error instanceof ValidationError || error instanceof StorageError) throw error;
			throw new StorageError(operation, error);
		}
	}
	async function checkReferences(record) {
		if (!await locations.get(record.locationId)) {
			throw gardenError('LOCATION_NOT_FOUND', 'Garden must reference an existing Location.', 'locationId');
		}
		validateGardenTypeSelection(record.typeIds, await types.toArray());
	}
	function prepareCreate(record) {
		validateGardenFields(record, [...GARDEN_EDITABLE_FIELDS, 'status', 'isClosed',
			'icon', 'color', 'thumbnailMediaId', 'layoutMediaId', 'createdAt', 'updatedAt']);
		const garden = { ...record, typeIds: Array.isArray(record.typeIds) ? [...record.typeIds] : record.typeIds, id: randomUUID() };
		validateGardenRecord(garden, { creating: true });
		return garden;
	}
	async function persistCreate(garden) {
		await checkReferences(garden);
		await gardens.add(garden);
		return copy(garden);
	}
	function validateTimestamp(value) {
		if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) ||
			new Date(value).toISOString() !== value) {
			throw gardenError('INVALID_TIMESTAMP', 'updatedAt must be a UTC ISO timestamp.', 'updatedAt');
		}
	}
	async function transition(id, expected, updatedAt, operation, mutate) {
		validateRecordId(id);
		validateGardenLifecycle(expected, 'expectedLifecycle');
		validateTimestamp(updatedAt);
		return run(operation, () => database.transaction('rw', gardens, async () => {
			const existing = await gardens.get(id);
			if (!existing) return false;
			if (existing.status !== expected.status || existing.isClosed !== expected.isClosed) {
				throw gardenError('STALE_GARDEN_LIFECYCLE',
					'This Garden changed after the page was loaded. Reload it and try again.');
			}
			const garden = { ...existing, ...mutate(existing), updatedAt };
			validateGardenRecord(garden);
			await gardens.put(garden);
			return true;
		}));
	}
	return Object.freeze({
		async list() {
			return run('list Gardens', async () => (await gardens.toArray()).map(copy));
		},
		async getById(id) {
			validateRecordId(id);
			return run('get Garden', async () => copy(await gardens.get(id)));
		},
		async create(record) {
			const garden = prepareCreate(record);
			return run('create Garden', () => database.transaction('rw', gardens, locations, types, async () => {
				return persistCreate(garden);
			}));
		},
		async createFromDraft(record, draftId) {
			validateRecordId(draftId, 'draftId');
			const garden = prepareCreate(record);
			return run('create Garden from draft', () => database.transaction(
				'rw', gardens, locations, types, drafts, async () => {
					const draft = await drafts.get(draftId);
					if (!draft) {
						throw gardenError('GARDEN_DRAFT_NOT_FOUND', 'This Garden draft is no longer available.', 'draftId');
					}
					if (draft.kind !== 'garden' || draft.subjectId !== null || draft.isNew !== true) {
						throw gardenError('WRONG_DRAFT_KIND', 'This draft cannot create a Garden.', 'draftId');
					}
					const created = await persistCreate(garden);
					await drafts.delete(draftId);
					return created;
				},
			));
		},
		async update(id, changes) {
			validateRecordId(id);
			validateGardenFields(changes, [...GARDEN_EDITABLE_FIELDS, 'updatedAt'], { requireChanges: true });
			const patch = { ...changes, ...(Object.hasOwn(changes, 'typeIds') && Array.isArray(changes.typeIds)
				? { typeIds: [...changes.typeIds] } : {}) };
			return run('update Garden', () => database.transaction('rw', gardens, locations, types, async () => {
				const existing = await gardens.get(id);
				if (!existing) return false;
				if (existing.isClosed || existing.status === 'archived') {
					throw gardenError('GARDEN_READ_ONLY', 'Closed or archived Gardens cannot be edited.');
				}
				const garden = { ...existing, ...patch };
				validateGardenRecord(garden);
				await checkReferences(garden);
				await gardens.put(garden);
				return true;
			}));
		},
		async setStatus(id, status, expected, updatedAt) {
			if (!['planned', 'active'].includes(status)) {
				throw gardenError('INVALID_GARDEN_TRANSITION', 'That status requires a dedicated lifecycle operation.', 'status');
			}
			return transition(id, expected, updatedAt, 'change Garden status', (existing) => {
				if (existing.isClosed || existing.status === 'archived' || existing.status === status) {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden cannot move to that status.', 'status');
				}
				return { status };
			});
		},
		async complete(id, options, expected, updatedAt) {
			if (!options || Object.getPrototypeOf(options) !== Object.prototype ||
				typeof options.close !== 'boolean' ||
				Object.keys(options).some((key) => !['close', 'notes'].includes(key))) {
				throw gardenError('INVALID_GARDEN_TRANSITION', 'Complete options are invalid.');
			}
			return transition(id, expected, updatedAt, 'complete Garden', (existing) => {
				if (existing.isClosed || existing.status === 'archived' ||
					(existing.status === 'completed' && !options.close)) {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden cannot be completed.');
				}
				return {
					status: 'completed', isClosed: options.close,
					...(Object.hasOwn(options, 'notes') && options.notes !== undefined ? { notes: options.notes } : {}),
				};
			});
		},
		async close(id, options, expected, updatedAt) {
			if (!options || Object.getPrototypeOf(options) !== Object.prototype ||
				Object.keys(options).some((key) => key !== 'notes')) {
				throw gardenError('INVALID_GARDEN_TRANSITION', 'Close options are invalid.');
			}
			return transition(id, expected, updatedAt, 'close Garden', (existing) => {
				if (existing.isClosed || existing.status === 'archived') {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden cannot be closed.');
				}
				return {
					isClosed: true,
					...(Object.hasOwn(options, 'notes') && options.notes !== undefined ? { notes: options.notes } : {}),
				};
			});
		},
		async reopen(id, expected, updatedAt) {
			return transition(id, expected, updatedAt, 'reopen Garden', (existing) => {
				if (!existing.isClosed || existing.status === 'archived') {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden cannot be reopened.');
				}
				return { isClosed: false };
			});
		},
		async archive(id, expected, updatedAt) {
			return transition(id, expected, updatedAt, 'archive Garden', (existing) => {
				if (existing.status === 'archived') {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden is already archived.');
				}
				return { status: 'archived', isClosed: true };
			});
		},
		async unarchive(id, expected, updatedAt) {
			return transition(id, expected, updatedAt, 'unarchive Garden', (existing) => {
				if (existing.status !== 'archived' || !existing.isClosed) {
					throw gardenError('INVALID_GARDEN_TRANSITION', 'This Garden is not archived.');
				}
				return { status: 'completed', isClosed: false };
			});
		},
	});
}
