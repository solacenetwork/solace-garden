import { ValidationError } from './errors.js';
import { validateRecordId } from './validation.js';

export const DEFAULT_LOCATION_ID = 'system-default-location';

const LOCATION_FIELDS = new Set([
	'id',
	'name',
	'hardinessZone',
	'isSystemDefault',
	'createdAt',
	'updatedAt',
]);

const HARDINESS_ZONE_PATTERN = /^(?:[1-9]|1[0-3])[ab]$/;

function validationError(code, message, field) {
	return new ValidationError(code, message, { field });
}

function validatePlainRecord(record, operation) {
	if (
		record === null ||
		typeof record !== 'object' ||
		Array.isArray(record) ||
		Object.getPrototypeOf(record) !== Object.prototype
	) {
		throw validationError(
			'INVALID_LOCATION',
			`${operation} requires a plain Location record.`,
			'location',
		);
	}

	for (const field of Object.keys(record)) {
		if (!LOCATION_FIELDS.has(field)) {
			throw validationError(
				'UNSUPPORTED_LOCATION_FIELD',
				`${field} is not a supported Location field.`,
				field,
			);
		}
	}
}

export function validateLocationId(id) {
	if (id === DEFAULT_LOCATION_ID) {
		return id;
	}
	return validateRecordId(id);
}

export function normalizeLocationName(name) {
	if (typeof name !== 'string' || name.trim().length === 0) {
		throw validationError(
			'INVALID_LOCATION_NAME',
			'Location name must contain something other than whitespace.',
			'name',
		);
	}
	return name.trim();
}

export function normalizeHardinessZone(zone) {
	if (zone === null || (typeof zone === 'string' && zone.trim().length === 0)) {
		return null;
	}

	if (typeof zone !== 'string') {
		throw validationError(
			'INVALID_HARDINESS_ZONE',
			'Hardiness zone must be empty or a USDA zone from 1a through 13b.',
			'hardinessZone',
		);
	}

	const normalized = zone.trim().toLowerCase();
	if (!HARDINESS_ZONE_PATTERN.test(normalized)) {
		throw validationError(
			'INVALID_HARDINESS_ZONE',
			'Hardiness zone must be empty or a USDA zone from 1a through 13b.',
			'hardinessZone',
		);
	}
	return normalized;
}

function validateTimestamp(value, field) {
	if (typeof value !== 'string' || value.length === 0) {
		throw validationError(
			'INVALID_TIMESTAMP',
			`${field} must be a non-empty string.`,
			field,
		);
	}
}

export function validateNewLocation(record) {
	validatePlainRecord(record, 'create');
	validateLocationId(record.id);

	if (normalizeLocationName(record.name) !== record.name) {
		throw validationError(
			'INVALID_LOCATION_NAME',
			'Location name must be trimmed before persistence.',
			'name',
		);
	}
	if (normalizeHardinessZone(record.hardinessZone) !== record.hardinessZone) {
		throw validationError(
			'INVALID_HARDINESS_ZONE',
			'Hardiness zone must be normalized before persistence.',
			'hardinessZone',
		);
	}
	if (typeof record.isSystemDefault !== 'boolean') {
		throw validationError(
			'INVALID_LOCATION_SYSTEM_STATE',
			'Location system identity must be true or false.',
			'isSystemDefault',
		);
	}
	if (
		(record.id === DEFAULT_LOCATION_ID) !== record.isSystemDefault
	) {
		throw validationError(
			'INVALID_LOCATION_SYSTEM_STATE',
			'The protected Location identity does not match its reserved ID.',
			'isSystemDefault',
		);
	}
	validateTimestamp(record.createdAt, 'createdAt');
	validateTimestamp(record.updatedAt, 'updatedAt');
}

export function validateLocationChanges(changes) {
	validatePlainRecord(changes, 'update');
	if (Object.keys(changes).length === 0) {
		throw validationError(
			'EMPTY_CHANGES',
			'Location update requires at least one changed field.',
			'location',
		);
	}

	for (const field of ['id', 'isSystemDefault', 'createdAt']) {
		if (Object.hasOwn(changes, field)) {
			throw validationError(
				'IMMUTABLE_LOCATION_FIELD',
				`${field} cannot be changed.`,
				field,
			);
		}
	}
	if (Object.hasOwn(changes, 'name')) {
		if (normalizeLocationName(changes.name) !== changes.name) {
			throw validationError(
				'INVALID_LOCATION_NAME',
				'Location name must be trimmed before persistence.',
				'name',
			);
		}
	}
	if (Object.hasOwn(changes, 'hardinessZone')) {
		if (normalizeHardinessZone(changes.hardinessZone) !== changes.hardinessZone) {
			throw validationError(
				'INVALID_HARDINESS_ZONE',
				'Hardiness zone must be normalized before persistence.',
				'hardinessZone',
			);
		}
	}
	if (Object.hasOwn(changes, 'updatedAt')) {
		validateTimestamp(changes.updatedAt, 'updatedAt');
	}
}
