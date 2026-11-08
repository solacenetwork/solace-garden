import { ValidationError } from './errors.js';
import { validateGardenTypeSelection } from './gardenTypeValidation.js';
import { validateLocationId } from './locationValidation.js';
import { validateRecordId } from './validation.js';

const TEMPLATE_FIELDS = Object.freeze([
	'id', 'name', 'configuration', 'createdAt', 'updatedAt',
]);
const CONFIGURATION_FIELDS = Object.freeze([
	'name', 'description', 'locationId', 'typeIds', 'layoutMediaId',
]);
const CREATION_FIELDS = Object.freeze([
	'gardenId', 'name', 'createdAt', 'updatedAt',
]);

export function templateError(code, message, field = 'template') {
	return new ValidationError(code, message, { field });
}

function validatePlainRecord(record, allowedFields, code, message, field) {
	if (!record || Object.getPrototypeOf(record) !== Object.prototype) {
		throw templateError(code, message, field);
	}
	for (const key of Object.keys(record)) {
		if (!allowedFields.includes(key)) {
			throw templateError(
				'UNSUPPORTED_TEMPLATE_FIELD',
				`${key} is not supported here.`,
				key,
			);
		}
	}
}

export function normalizeTemplateName(name) {
	if (typeof name !== 'string' || !name.trim()) {
		throw templateError(
			'INVALID_TEMPLATE_NAME',
			'Template name must contain text.',
			'name',
		);
	}
	return name.trim();
}

function normalizeSuggestedName(name) {
	if (typeof name !== 'string' || !name.trim()) {
		throw templateError(
			'INVALID_TEMPLATE_CONFIGURATION',
			'Suggested Garden name must contain text.',
			'configuration.name',
		);
	}
	return name.trim();
}

function normalizeDescription(description) {
	if (description === null) return null;
	if (typeof description !== 'string') {
		throw templateError(
			'INVALID_TEMPLATE_CONFIGURATION',
			'Description must be text or null.',
			'configuration.description',
		);
	}
	return description.trim() || null;
}

function validateTimestamp(value, field) {
	if (
		typeof value !== 'string' ||
		!Number.isFinite(Date.parse(value)) ||
		new Date(value).toISOString() !== value
	) {
		throw templateError(
			'INVALID_TIMESTAMP',
			`${field} must be a UTC ISO timestamp.`,
			field,
		);
	}
	return value;
}

export function validateTemplateCreationRequest(request) {
	validatePlainRecord(
		request,
		CREATION_FIELDS,
		'INVALID_TEMPLATE',
		'Template creation requires a plain record.',
		'template',
	);
	validateRecordId(request.gardenId, 'gardenId');
	if (normalizeTemplateName(request.name) !== request.name) {
		throw templateError(
			'INVALID_TEMPLATE_NAME',
			'Template name must be trimmed before persistence.',
			'name',
		);
	}
	validateTimestamp(request.createdAt, 'createdAt');
	validateTimestamp(request.updatedAt, 'updatedAt');
	return request;
}

export function normalizeTemplateConfiguration(configuration, gardenTypes) {
	validatePlainRecord(
		configuration,
		CONFIGURATION_FIELDS,
		'INVALID_TEMPLATE_CONFIGURATION',
		'Template configuration must be a plain record.',
		'configuration',
	);
	for (const field of CONFIGURATION_FIELDS) {
		if (!Object.hasOwn(configuration, field)) {
			throw templateError(
				'INVALID_TEMPLATE_CONFIGURATION',
				`Template configuration requires ${field}.`,
				`configuration.${field}`,
			);
		}
	}
	validateLocationId(configuration.locationId);
	if (configuration.layoutMediaId !== null) {
		throw templateError(
			'UNSUPPORTED_TEMPLATE_MEDIA',
			'Layout media must remain null until Gallery support is available.',
			'configuration.layoutMediaId',
		);
	}
	return {
		name: normalizeSuggestedName(configuration.name),
		description: normalizeDescription(configuration.description),
		locationId: configuration.locationId,
		typeIds: validateGardenTypeSelection(configuration.typeIds, gardenTypes),
		layoutMediaId: null,
	};
}

export function validateTemplateRecord(record, gardenTypes) {
	validatePlainRecord(
		record,
		TEMPLATE_FIELDS,
		'INVALID_TEMPLATE',
		'Template must be a plain record.',
		'template',
	);
	for (const field of TEMPLATE_FIELDS) {
		if (!Object.hasOwn(record, field)) {
			throw templateError('INVALID_TEMPLATE', `Template requires ${field}.`, field);
		}
	}
	validateRecordId(record.id);
	if (normalizeTemplateName(record.name) !== record.name) {
		throw templateError(
			'INVALID_TEMPLATE_NAME',
			'Template name must be normalized before persistence.',
			'name',
		);
	}
	const configuration = normalizeTemplateConfiguration(record.configuration, gardenTypes);
	if (JSON.stringify(configuration) !== JSON.stringify(record.configuration)) {
		throw templateError(
			'INVALID_TEMPLATE_CONFIGURATION',
			'Template configuration must be normalized before persistence.',
			'configuration',
		);
	}
	validateTimestamp(record.createdAt, 'createdAt');
	validateTimestamp(record.updatedAt, 'updatedAt');
	return record;
}
