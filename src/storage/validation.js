import { ValidationError } from './errors.js';

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NOTE_FIELDS = new Set([
	'id',
	'text',
	'gardenId',
	'createdAt',
	'updatedAt',
]);

function validationError(code, message, field) {
	return new ValidationError(code, message, { field });
}

export function validateRecordId(id, field = 'id') {
	if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
		throw validationError(
			'INVALID_RECORD_ID',
			`${field} must be a valid UUID.`,
			field,
		);
	}

	return id;
}

function validateRecordObject(record, operation) {
	if (
		record === null ||
		typeof record !== 'object' ||
		Array.isArray(record) ||
		Object.getPrototypeOf(record) !== Object.prototype
	) {
		throw validationError(
			'INVALID_RECORD',
			`${operation} requires a plain note record.`,
			'note',
		);
	}

	for (const field of Object.keys(record)) {
		if (!NOTE_FIELDS.has(field)) {
			throw validationError(
				'UNSUPPORTED_NOTE_FIELD',
				`${field} is not a supported note field.`,
				field,
			);
		}
	}
}

function validateText(text) {
	if (typeof text !== 'string' || text.trim().length === 0) {
		throw validationError(
			'INVALID_NOTE_TEXT',
			'text must contain something other than whitespace.',
			'text',
		);
	}
}

function validateGardenId(gardenId) {
	if (gardenId !== null) {
		validateRecordId(gardenId, 'gardenId');
	}
}

function validateTimestamp(value, field) {
	if (typeof value !== 'string' || value.length === 0) {
		throw validationError(
			'INVALID_TIMESTAMP',
			`${field} must be a non-empty string when provided.`,
			field,
		);
	}
}

export function validateNewNote(record) {
	validateRecordObject(record, 'create');
	validateRecordId(record.id);
	validateText(record.text);
	if (Object.hasOwn(record, 'gardenId')) {
		validateGardenId(record.gardenId);
	}
	if (Object.hasOwn(record, 'createdAt')) {
		validateTimestamp(record.createdAt, 'createdAt');
	}
	if (Object.hasOwn(record, 'updatedAt')) {
		validateTimestamp(record.updatedAt, 'updatedAt');
	}
}

export function validateNoteChanges(changes) {
	validateRecordObject(changes, 'update');

	if (Object.keys(changes).length === 0) {
		throw validationError(
			'EMPTY_CHANGES',
			'update requires at least one changed field.',
			'note',
		);
	}

	if (Object.hasOwn(changes, 'id')) {
		throw validationError(
			'IMMUTABLE_RECORD_ID',
			'id cannot be changed.',
			'id',
		);
	}

	if (Object.hasOwn(changes, 'text')) {
		validateText(changes.text);
	}
	if (Object.hasOwn(changes, 'gardenId')) {
		validateGardenId(changes.gardenId);
	}
	if (Object.hasOwn(changes, 'createdAt')) {
		validateTimestamp(changes.createdAt, 'createdAt');
	}
	if (Object.hasOwn(changes, 'updatedAt')) {
		validateTimestamp(changes.updatedAt, 'updatedAt');
	}
}

