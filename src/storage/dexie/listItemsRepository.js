import { StorageError, ValidationError } from '../errors.js';
import {
	validateListItemChanges,
	validateListItemKind,
	validateListItemOrder,
	validateNewListItem,
} from '../listItemValidation.js';
import { validateRecordId } from '../validation.js';

function copyRecord(record) {
	return record ? { ...record } : null;
}

function throwStorageError(operation, error) {
	if (error instanceof ValidationError || error instanceof StorageError) {
		throw error;
	}

	throw new StorageError(operation, error);
}

function sortByOrder(records) {
	return records.sort((first, second) =>
		first.sortOrder - second.sortOrder ||
		String(first.createdAt ?? '').localeCompare(String(second.createdAt ?? '')),
	);
}

export function createListItemsRepository(database, {
	randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
	const table = database.table('listItems');
	const gardens = database.table('gardens');

	async function validateGardenReference(gardenId) {
		if (gardenId === null || gardenId === undefined) {
			return;
		}

		let garden;
		try {
			garden = await gardens.get(gardenId);
		} catch (error) {
			throwStorageError('validate list item garden association', error);
		}

		if (!garden) {
			throw new ValidationError(
				'GARDEN_NOT_FOUND',
				'The selected garden does not exist.',
				{ field: 'gardenId' },
			);
		}
	}

	return Object.freeze({
		async getById(id) {
			validateRecordId(id);
			try {
				return copyRecord(await table.get(id));
			} catch (error) {
				throwStorageError('get list item', error);
			}
		},

		async list(kind) {
			validateListItemKind(kind);
			try {
				const records = await table.where('kind').equals(kind).toArray();
				return sortByOrder(records).map(copyRecord);
			} catch (error) {
				throwStorageError('list items', error);
			}
		},

		async create(record) {
			const listItem = {
				...record,
				id: record?.id ?? randomUUID(),
			};
			validateNewListItem(listItem);
			try {
				await database.transaction('rw', table, gardens, async () => {
					await validateGardenReference(listItem.gardenId);
					await table.add(listItem);
				});
				return copyRecord(listItem);
			} catch (error) {
				throwStorageError('create list item', error);
			}
		},

		async update(id, changes) {
			validateRecordId(id);

			try {
				return await database.transaction('rw', table, gardens, async () => {
					const current = await table.get(id);
					if (!current) {
						return false;
					}

					validateListItemChanges(changes, current.kind);
					if (Object.hasOwn(changes, 'gardenId')) {
						await validateGardenReference(changes.gardenId);
					}

					return (await table.update(id, { ...changes })) === 1;
				});
			} catch (error) {
				throwStorageError('update list item', error);
			}
		},

		async remove(id) {
			validateRecordId(id);
			try {
				return (await table.where(':id').equals(id).delete()) === 1;
			} catch (error) {
				throwStorageError('remove list item', error);
			}
		},

		async reorder(kind, ids, updatedAt) {
			validateListItemKind(kind);
			validateListItemOrder(ids);
			validateListItemChanges({ sortOrder: 0, updatedAt }, kind);

			try {
				return await database.transaction('rw', table, async () => {
					const current = sortByOrder(
						await table.where('kind').equals(kind).toArray(),
					);
					const currentIds = new Set(current.map(({ id }) => id));

					if (
						current.length !== ids.length ||
						ids.some((id) => !currentIds.has(id))
					) {
						throw new ValidationError(
							'INVALID_LIST_ITEM_ORDER',
							'Reordering requires every item from the active list exactly once.',
							{ field: 'ids' },
						);
					}

					const byId = new Map(current.map((record) => [record.id, record]));
					const reordered = ids.map((id, sortOrder) => ({
						...byId.get(id),
						sortOrder,
						updatedAt,
					}));
					await table.bulkPut(reordered);
					return reordered.map(copyRecord);
				});
			} catch (error) {
				throwStorageError('reorder list items', error);
			}
		},
	});
}
