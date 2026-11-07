import { StorageError, ValidationError } from '../errors.js';
import { validateRecordId } from '../validation.js';
import { validateGardenTypeSelection } from '../gardenTypeValidation.js';
import {
	GARDEN_EDITABLE_FIELDS, gardenError, validateGardenFields, validateGardenRecord,
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
	return Object.freeze({
		async list() {
			return run('list Gardens', async () => (await gardens.toArray()).map(copy));
		},
		async getById(id) {
			validateRecordId(id);
			return run('get Garden', async () => copy(await gardens.get(id)));
		},
		async create(record) {
			validateGardenFields(record, [...GARDEN_EDITABLE_FIELDS, 'status', 'isClosed',
				'icon', 'color', 'thumbnailMediaId', 'layoutMediaId', 'createdAt', 'updatedAt']);
			const garden = { ...record, typeIds: Array.isArray(record.typeIds) ? [...record.typeIds] : record.typeIds, id: randomUUID() };
			validateGardenRecord(garden, { creating: true });
			return run('create Garden', () => database.transaction('rw', gardens, locations, types, async () => {
				await checkReferences(garden);
				await gardens.add(garden);
				return copy(garden);
			}));
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
	});
}
