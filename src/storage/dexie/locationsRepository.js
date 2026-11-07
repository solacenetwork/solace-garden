import { StorageError, ValidationError } from '../errors.js';
import {
	DEFAULT_LOCATION_ID,
	validateLocationChanges,
	validateLocationId,
	validateNewLocation,
} from '../locationValidation.js';

function copyRecord(record) {
	return record ? { ...record } : null;
}

function throwStorageError(operation, error) {
	if (error instanceof ValidationError || error instanceof StorageError) {
		throw error;
	}
	throw new StorageError(operation, error);
}

function sortLocations(records) {
	return records.sort((first, second) =>
		Number(second.isSystemDefault) - Number(first.isSystemDefault) ||
		first.name.localeCompare(second.name),
	);
}

export function createLocationsRepository(database, {
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	const locations = database.table('locations');
	const gardens = database.table('gardens');

	return Object.freeze({
		async ensureSystemDefault(record) {
			validateNewLocation(record);
			if (record.id !== DEFAULT_LOCATION_ID || !record.isSystemDefault) {
				throw new ValidationError(
					'INVALID_LOCATION_SYSTEM_STATE',
					'The built-in Location must use its reserved identity.',
					{ field: 'isSystemDefault' },
				);
			}

			try {
				return await database.transaction('rw', locations, async () => {
					const allLocations = await locations.toArray();
					const existing = allLocations.find(({ id }) => id === DEFAULT_LOCATION_ID);
					const conflictingSystemLocation = allLocations.find(
						({ id, isSystemDefault }) => isSystemDefault && id !== DEFAULT_LOCATION_ID,
					);

					if (conflictingSystemLocation) {
						throw new ValidationError(
							'INVALID_LOCATION_SYSTEM_STATE',
							'An unexpected protected Location record already exists.',
							{ field: 'isSystemDefault' },
						);
					}
					if (existing) {
						validateNewLocation(existing);
						return copyRecord(existing);
					}

					await locations.add(record);
					return copyRecord(record);
				});
			} catch (error) {
				throwStorageError('seed default Location', error);
			}
		},

		async list() {
			try {
				return sortLocations(await locations.toArray()).map(copyRecord);
			} catch (error) {
				throwStorageError('list Locations', error);
			}
		},

		async getById(id) {
			validateLocationId(id);
			try {
				return copyRecord(await locations.get(id));
			} catch (error) {
				throwStorageError('get Location', error);
			}
		},

		async create(record) {
			const location = { ...record, id: record?.id ?? randomUUID() };
			validateNewLocation(location);
			try {
				await locations.add(location);
				return copyRecord(location);
			} catch (error) {
				throwStorageError('create Location', error);
			}
		},

		async update(id, changes) {
			validateLocationId(id);
			validateLocationChanges(changes);
			try {
				return (await locations.update(id, { ...changes })) === 1;
			} catch (error) {
				throwStorageError('update Location', error);
			}
		},

		async remove(id) {
			validateLocationId(id);
			try {
				return await database.transaction('rw', locations, gardens, async () => {
					const location = await locations.get(id);
					if (!location) {
						return false;
					}
					if (location.id === DEFAULT_LOCATION_ID || location.isSystemDefault) {
						throw new ValidationError(
							'PROTECTED_LOCATION',
							'The built-in Location cannot be deleted.',
							{ field: 'id' },
						);
					}
					if (await gardens.where('locationId').equals(id).count()) {
						throw new ValidationError(
							'LOCATION_IN_USE',
							'This Location is used by a Garden and cannot be deleted until every Garden is reassigned.',
							{ field: 'id' },
						);
					}

					return (await locations.where(':id').equals(id).delete()) === 1;
				});
			} catch (error) {
				throwStorageError('remove Location', error);
			}
		},
	});
}
