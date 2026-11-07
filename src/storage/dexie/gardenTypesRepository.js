import { StorageError, ValidationError } from '../errors.js';
import {
	GARDEN_TYPE_DEFINITIONS,
	validateGardenTypeCatalog,
} from '../gardenTypeValidation.js';

function copyDefinition(definition) {
	return definition ? { ...definition } : null;
}

function sortDefinitions(definitions) {
	return definitions.sort((first, second) => first.sortOrder - second.sortOrder);
}

function throwStorageError(operation, error) {
	if (error instanceof ValidationError || error instanceof StorageError) {
		throw error;
	}
	throw new StorageError(operation, error);
}

export async function seedGardenTypes(database) {
	const table = database.table('gardenTypes');
	try {
		return await database.transaction('rw', table, async () => {
			const existing = await table.toArray();
			validateGardenTypeCatalog(existing, { allowMissing: true });
			const existingIds = new Set(existing.map(({ id }) => id));
			const missing = GARDEN_TYPE_DEFINITIONS.filter(
				({ id }) => !existingIds.has(id),
			);
			if (missing.length > 0) {
				await table.bulkAdd(missing.map(copyDefinition));
			}

			const complete = await table.toArray();
			validateGardenTypeCatalog(complete);
			return sortDefinitions(complete).map(copyDefinition);
		});
	} catch (error) {
		throwStorageError('seed Garden Types', error);
	}
}

export function createGardenTypesRepository(database) {
	const table = database.table('gardenTypes');
	async function readCatalog(operation) {
		try {
			const definitions = await table.toArray();
			validateGardenTypeCatalog(definitions);
			return sortDefinitions(definitions).map(copyDefinition);
		} catch (error) {
			throwStorageError(operation, error);
		}
	}

	return Object.freeze({
		async list() {
			return readCatalog('list Garden Types');
		},

		async getById(id) {
			const definitions = await readCatalog('get Garden Type');
			return copyDefinition(definitions.find((definition) => definition.id === id));
		},
	});
}
