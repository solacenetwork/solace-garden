import { ValidationError } from './errors.js';
import { validateRecordId } from './validation.js';

export const LIST_ITEM_KINDS = Object.freeze(['task', 'wishlist']);

const LIST_ITEM_FIELDS = new Set([
	'id',
	'kind',
	'text',
	'completed',
	'sortOrder',
	'gardenId',
	'quantity',
	'notes',
	'url',
	'createdAt',
	'updatedAt',
]);

const WISHLIST_FIELDS = ['quantity', 'notes', 'url'];

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
			'INVALID_LIST_ITEM',
			`${operation} requires a plain list item record.`,
			'listItem',
		);
	}

	for (const field of Object.keys(record)) {
		if (!LIST_ITEM_FIELDS.has(field)) {
			throw validationError(
				'UNSUPPORTED_LIST_ITEM_FIELD',
				`${field} is not a supported list item field.`,
				field,
			);
		}
	}
}

export function validateListItemKind(kind) {
	if (!LIST_ITEM_KINDS.includes(kind)) {
		throw validationError(
			'INVALID_LIST_ITEM_KIND',
			'List item kind must be task or wishlist.',
			'kind',
		);
	}

	return kind;
}

function validateText(text) {
	if (typeof text !== 'string' || text.trim().length === 0 || text.length > 200) {
		throw validationError(
			'INVALID_LIST_ITEM_TEXT',
			'Item text must contain 1 to 200 characters.',
			'text',
		);
	}
}

function validateCompleted(completed) {
	if (typeof completed !== 'boolean') {
		throw validationError(
			'INVALID_LIST_ITEM_COMPLETION',
			'Completed state must be true or false.',
			'completed',
		);
	}
}

function validateSortOrder(sortOrder) {
	if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
		throw validationError(
			'INVALID_LIST_ITEM_ORDER',
			'sortOrder must be a non-negative integer.',
			'sortOrder',
		);
	}
}

function validateGardenId(gardenId) {
	if (gardenId !== null) {
		validateRecordId(gardenId, 'gardenId');
	}
}

function validateOptionalText(value, field, maximumLength) {
	if (value === null) {
		return;
	}

	if (
		typeof value !== 'string' ||
		value.trim().length === 0 ||
		value.length > maximumLength
	) {
		throw validationError(
			`INVALID_LIST_ITEM_${field.toUpperCase()}`,
			`${field} must be null or contain 1 to ${maximumLength} characters.`,
			field,
		);
	}
}

function validateUrl(url) {
	if (url === null) {
		return;
	}

	if (typeof url !== 'string' || url.length > 2048) {
		throw validationError(
			'INVALID_LIST_ITEM_URL',
			'Product URL must be a valid HTTP or HTTPS address.',
			'url',
		);
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(url);
	} catch {
		throw validationError(
			'INVALID_LIST_ITEM_URL',
			'Product URL must be a valid HTTP or HTTPS address.',
			'url',
		);
	}

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw validationError(
			'INVALID_LIST_ITEM_URL',
			'Product URL must use HTTP or HTTPS.',
			'url',
		);
	}

	const hostnameLabels = parsedUrl.hostname.replace(/\.$/, '').split('.');
	const suffix = hostnameLabels.at(-1);
	const hasPublicHostname =
		hostnameLabels.length >= 2 &&
		hostnameLabels.every((label) => label.length > 0) &&
		suffix.length >= 2 &&
		/[a-z]/i.test(suffix);

	if (!hasPublicHostname) {
		throw validationError(
			'INVALID_LIST_ITEM_URL',
			'Product URL must include a complete public hostname, such as example.com.',
			'url',
		);
	}
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

function validateKindSpecificFields(record, kind) {
	if (kind === 'task') {
		const unsupported = WISHLIST_FIELDS.find((field) => Object.hasOwn(record, field));
		if (unsupported) {
			throw validationError(
				'TASK_WISHLIST_FIELD',
				`${unsupported} is available only for Wish List items.`,
				unsupported,
			);
		}
		return;
	}

	if (Object.hasOwn(record, 'quantity')) {
		validateOptionalText(record.quantity, 'quantity', 100);
	}
	if (Object.hasOwn(record, 'notes')) {
		validateOptionalText(record.notes, 'notes', 1000);
	}
	if (Object.hasOwn(record, 'url')) {
		validateUrl(record.url);
	}
}

export function validateNewListItem(record) {
	validatePlainRecord(record, 'create');
	validateRecordId(record.id);
	validateListItemKind(record.kind);
	validateText(record.text);
	validateCompleted(record.completed);
	validateSortOrder(record.sortOrder);
	validateTimestamp(record.createdAt, 'createdAt');
	validateTimestamp(record.updatedAt, 'updatedAt');

	if (Object.hasOwn(record, 'gardenId')) {
		validateGardenId(record.gardenId);
	}

	validateKindSpecificFields(record, record.kind);
}

export function validateListItemChanges(changes, kind) {
	validatePlainRecord(changes, 'update');
	validateListItemKind(kind);

	if (Object.keys(changes).length === 0) {
		throw validationError(
			'EMPTY_CHANGES',
			'Update requires at least one changed field.',
			'listItem',
		);
	}

	for (const field of ['id', 'kind', 'createdAt']) {
		if (Object.hasOwn(changes, field)) {
			throw validationError(
				'IMMUTABLE_LIST_ITEM_FIELD',
				`${field} cannot be changed.`,
				field,
			);
		}
	}

	if (Object.hasOwn(changes, 'text')) {
		validateText(changes.text);
	}
	if (Object.hasOwn(changes, 'completed')) {
		validateCompleted(changes.completed);
	}
	if (Object.hasOwn(changes, 'sortOrder')) {
		validateSortOrder(changes.sortOrder);
	}
	if (Object.hasOwn(changes, 'gardenId')) {
		validateGardenId(changes.gardenId);
	}
	if (Object.hasOwn(changes, 'updatedAt')) {
		validateTimestamp(changes.updatedAt, 'updatedAt');
	}

	validateKindSpecificFields(changes, kind);
}

export function validateListItemOrder(ids) {
	if (!Array.isArray(ids) || new Set(ids).size !== ids.length) {
		throw validationError(
			'INVALID_LIST_ITEM_ORDER',
			'Reordering requires each item ID exactly once.',
			'ids',
		);
	}

	ids.forEach((id) => validateRecordId(id));
}
