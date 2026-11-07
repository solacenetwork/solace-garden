import { ValidationError } from './errors.js';

export const GARDEN_TYPE_DEFINITIONS = Object.freeze([
	Object.freeze({ id: 'in-ground', name: 'In-Ground', isSystem: true, sortOrder: 0 }),
	Object.freeze({ id: 'raised-bed', name: 'Raised Bed', isSystem: true, sortOrder: 1 }),
	Object.freeze({ id: 'container', name: 'Container', isSystem: true, sortOrder: 2 }),
	Object.freeze({ id: 'greenhouse', name: 'Greenhouse', isSystem: true, sortOrder: 3 }),
	Object.freeze({ id: 'hydroponic', name: 'Hydroponic', isSystem: true, sortOrder: 4 }),
	Object.freeze({ id: 'other', name: 'Other', isSystem: true, sortOrder: 5 }),
	Object.freeze({ id: 'indoor', name: 'Indoor', isSystem: true, sortOrder: 6 }),
	Object.freeze({ id: 'outdoor', name: 'Outdoor', isSystem: true, sortOrder: 7 }),
]);

const EXPECTED_BY_ID = new Map(
	GARDEN_TYPE_DEFINITIONS.map((definition) => [definition.id, definition]),
);
const GARDEN_TYPE_FIELDS = new Set([
	'id',
	'name',
	'description',
	'isSystem',
	'sortOrder',
]);

function validationError(code, message, field) {
	return new ValidationError(code, message, { field });
}

function validateDefinition(record) {
	if (
		record === null ||
		typeof record !== 'object' ||
		Array.isArray(record) ||
		Object.getPrototypeOf(record) !== Object.prototype
	) {
		throw validationError(
			'INVALID_GARDEN_TYPE_DEFINITION',
			'Garden Type definitions must be plain records.',
			'gardenType',
		);
	}

	for (const field of Object.keys(record)) {
		if (!GARDEN_TYPE_FIELDS.has(field)) {
			throw validationError(
				'UNSUPPORTED_GARDEN_TYPE_FIELD',
				`${field} is not a supported Garden Type field.`,
				field,
			);
		}
	}

	const expected = EXPECTED_BY_ID.get(record.id);
	if (!expected) {
		throw validationError(
			'UNKNOWN_GARDEN_TYPE',
			'An unknown Garden Type definition was found.',
			'id',
		);
	}
	if (
		record.name !== expected.name ||
		record.isSystem !== true ||
		record.sortOrder !== expected.sortOrder
	) {
		throw validationError(
			'CONFLICTING_GARDEN_TYPE_DEFINITION',
			`The ${expected.name} Garden Type definition does not match the built-in catalog.`,
			'id',
		);
	}
	if (
		Object.hasOwn(record, 'description') &&
		(typeof record.description !== 'string' || record.description.trim().length === 0)
	) {
		throw validationError(
			'INVALID_GARDEN_TYPE_DESCRIPTION',
			'Garden Type descriptions must contain text when provided.',
			'description',
		);
	}
}

export function validateGardenTypeCatalog(definitions, { allowMissing = false } = {}) {
	if (!Array.isArray(definitions)) {
		throw validationError(
			'INVALID_GARDEN_TYPE_CATALOG',
			'Garden Type definitions must be an array.',
			'gardenTypes',
		);
	}

	const ids = new Set();
	for (const definition of definitions) {
		validateDefinition(definition);
		if (ids.has(definition.id)) {
			throw validationError(
				'DUPLICATE_GARDEN_TYPE_DEFINITION',
				'Each Garden Type definition must appear exactly once.',
				'id',
			);
		}
		ids.add(definition.id);
	}

	if (!allowMissing && ids.size !== GARDEN_TYPE_DEFINITIONS.length) {
		throw validationError(
			'INCOMPLETE_GARDEN_TYPE_CATALOG',
			'All built-in Garden Type definitions are required.',
			'gardenTypes',
		);
	}
	return definitions;
}

export function validateGardenTypeSelection(typeIds, definitions) {
	validateGardenTypeCatalog(definitions);
	if (!Array.isArray(typeIds)) {
		throw validationError(
			'INVALID_GARDEN_TYPE_SELECTION',
			'Garden Type selections must be an array.',
			'typeIds',
		);
	}

	const availableIds = new Set(definitions.map(({ id }) => id));
	const selectedIds = new Set();
	for (const id of typeIds) {
		if (typeof id !== 'string' || !availableIds.has(id)) {
			throw validationError(
				'UNKNOWN_GARDEN_TYPE',
				'Garden Type selections may contain only built-in type IDs.',
				'typeIds',
			);
		}
		if (selectedIds.has(id)) {
			throw validationError(
				'DUPLICATE_GARDEN_TYPE',
				'Garden Type selections cannot contain duplicate IDs.',
				'typeIds',
			);
		}
		selectedIds.add(id);
	}
	return [...typeIds];
}
