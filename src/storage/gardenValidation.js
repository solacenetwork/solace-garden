import { ValidationError } from './errors.js';
import { validateRecordId } from './validation.js';
import { validateLocationId } from './locationValidation.js';
import { GARDEN_TYPE_DEFINITIONS, validateGardenTypeSelection } from './gardenTypeValidation.js';

export const GARDEN_EDITABLE_FIELDS = Object.freeze([
	'name', 'subtitle', 'description', 'locationId', 'typeIds', 'startDate', 'endDate', 'notes',
]);
const VISUAL_FIELDS = ['icon', 'color', 'thumbnailMediaId', 'layoutMediaId'];
const RECORD_FIELDS = [...GARDEN_EDITABLE_FIELDS, ...VISUAL_FIELDS,
	'id', 'status', 'isClosed', 'createdAt', 'updatedAt'];

export function gardenError(code, message, field = 'garden') {
	return new ValidationError(code, message, { field });
}

export function validateGardenFields(record, allowed, { requireChanges = false } = {}) {
	if (!record || Object.getPrototypeOf(record) !== Object.prototype) {
		throw gardenError('INVALID_GARDEN', 'Garden input must be a plain record.');
	}
	for (const field of Object.keys(record)) {
		if (!allowed.includes(field)) {
			throw gardenError('UNSUPPORTED_GARDEN_FIELD', `${field} cannot be supplied or changed.`, field);
		}
	}
	if (requireChanges && Object.keys(record).length === 0) {
		throw gardenError('EMPTY_CHANGES', 'Garden update requires at least one changed field.');
	}
}

function optionalText(value, field) {
	if (value === null) return null;
	if (typeof value !== 'string') {
		throw gardenError('INVALID_GARDEN_TEXT', `${field} must be text or null.`, field);
	}
	if (field === 'notes' && value.length > 1000) {
		throw gardenError('GARDEN_NOTES_TOO_LONG', 'Garden Notes cannot exceed 1,000 characters.', field);
	}
	return value.trim() || null;
}

function date(value, field) {
	if (value === null) return null;
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		throw gardenError('INVALID_GARDEN_DATE', `${field} must be a real YYYY-MM-DD date or null.`, field);
	}
	const [year, month, day] = value.split('-').map(Number);
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
		throw gardenError('INVALID_GARDEN_DATE', `${field} must be a real calendar date.`, field);
	}
	return value;
}

export function normalizeGardenFields(input) {
	const result = {};
	for (const [field, value] of Object.entries(input)) {
		if (field === 'name') {
			if (typeof value !== 'string' || !value.trim()) {
				throw gardenError('INVALID_GARDEN_NAME', 'Garden name must contain text.', field);
			}
			result.name = value.trim();
		} else if (['subtitle', 'description', 'notes'].includes(field)) {
			result[field] = optionalText(value, field);
		} else if (['startDate', 'endDate'].includes(field)) {
			result[field] = date(value, field);
		} else if (field === 'typeIds') {
			result.typeIds = validateGardenTypeSelection(value, GARDEN_TYPE_DEFINITIONS);
		} else if (field === 'locationId') {
			validateLocationId(value);
			result.locationId = value;
		}
	}
	return result;
}

export function validateGardenRecord(record, { creating = false } = {}) {
	validateGardenFields(record, RECORD_FIELDS);
	validateRecordId(record.id);
	const normalized = normalizeGardenFields(Object.fromEntries(
		GARDEN_EDITABLE_FIELDS.map((field) => [field, record[field]]),
	));
	for (const field of GARDEN_EDITABLE_FIELDS) {
		if (JSON.stringify(normalized[field]) !== JSON.stringify(record[field])) {
			throw gardenError('INVALID_GARDEN', `${field} must be normalized before persistence.`, field);
		}
	}
	if (record.startDate && record.endDate && record.endDate < record.startDate) {
		throw gardenError('INVALID_GARDEN_DATE_ORDER', 'End date cannot precede start date.', 'endDate');
	}
	if (!['planned', 'active', 'completed', 'archived'].includes(record.status) ||
		typeof record.isClosed !== 'boolean' ||
		(creating && (record.status !== 'planned' || record.isClosed))) {
		throw gardenError('INVALID_GARDEN_LIFECYCLE', 'New Gardens must be Planned and open.');
	}
	for (const field of VISUAL_FIELDS) {
		if (creating && record[field] !== null) {
			throw gardenError('UNSUPPORTED_GARDEN_FIELD', `${field} must initially be null.`, field);
		}
	}
	for (const field of ['createdAt', 'updatedAt']) {
		const value = record[field];
		if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) ||
			new Date(value).toISOString() !== value) {
			throw gardenError('INVALID_TIMESTAMP', `${field} must be a UTC ISO timestamp.`, field);
		}
	}
}
