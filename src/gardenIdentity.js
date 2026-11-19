import bootstrapIconCodepoints from 'bootstrap-icons/font/bootstrap-icons.json';

export const DEFAULT_GARDEN_ICON = 'leaf-fill';
export const DEFAULT_GARDEN_COLOR = '#6B7280';

export const CURATED_GARDEN_ICONS = Object.freeze([
	'flower1',
	'tree-fill',
	'trash2-fill',
	'database-fill',
	'brightness-high-fill',
	'snow2',
	'star-fill',
	'bucket-fill',
	'cloud-fill',
	'cloud-rain-fill',
	'cloud-sun-fill',
	'droplet-fill',
	'flag-fill',
	'heart-fill',
	'house-fill',
	'bluesky',
]);

export const GARDEN_NUMBER_ICONS = Object.freeze([
	'1-circle-fill',
	'2-circle-fill',
	'3-circle-fill',
	'4-circle-fill',
	'5-circle-fill',
	'6-circle-fill',
	'7-circle-fill',
	'8-circle-fill',
	'9-circle-fill',
]);

export const GARDEN_COLOR_PALETTE = Object.freeze([
	{ name: 'Forest', value: '#287D46' },
	{ name: 'Sage', value: '#769B72' },
	{ name: 'Lime', value: '#91AC35' },
	{ name: 'Olive', value: '#777E38' },
	{ name: 'Gold', value: '#C99A27' },
	{ name: 'Orange', value: '#D77832' },
	{ name: 'Terracotta', value: '#B85D42' },
	{ name: 'Red', value: '#BD4851' },
	{ name: 'Rose', value: '#C36D82' },
	{ name: 'Pink', value: '#C67BAD' },
	{ name: 'Purple', value: '#8765B0' },
	{ name: 'Lavender', value: '#A38DCD' },
	{ name: 'Indigo', value: '#5668A9' },
	{ name: 'Blue', value: '#397CAD' },
	{ name: 'Teal', value: '#308F91' },
	{ name: 'Brown', value: '#916C4B' },
]);

const BOOTSTRAP_ICON_NAMES = new Set(Object.keys(bootstrapIconCodepoints));
const ICON_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export function normalizeBootstrapIconName(value) {
	if (value === null) return null;
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const normalized = trimmed.toLowerCase();
	return normalized.startsWith('bi-') ? normalized.slice(3) : normalized;
}

export function validateBootstrapIconName(value) {
	const name = normalizeBootstrapIconName(value);
	if (name === null) {
		return { name: null, isEmpty: true, isValid: true, error: '' };
	}
	const isValid = typeof name === 'string'
		&& ICON_NAME_PATTERN.test(name)
		&& BOOTSTRAP_ICON_NAMES.has(name);
	return {
		name: isValid ? name : null,
		isEmpty: false,
		isValid,
		error: isValid ? '' : 'Invalid Bootstrap icon',
	};
}

export function normalizeGardenColor(value) {
	if (value === null) return null;
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
	return prefixed.toUpperCase();
}

export function validateGardenColor(value) {
	const color = normalizeGardenColor(value);
	if (color === null) {
		return { color: null, isEmpty: true, isValid: true, error: '' };
	}
	const isValid = typeof color === 'string' && HEX_COLOR_PATTERN.test(color);
	return {
		color: isValid ? color : null,
		isEmpty: false,
		isValid,
		error: isValid ? '' : 'Enter a six-digit hexadecimal color',
	};
}

export function renderableGardenIcon(value) {
	return validateBootstrapIconName(value).name ?? DEFAULT_GARDEN_ICON;
}

export function renderableGardenColor(value) {
	return validateGardenColor(value).color ?? DEFAULT_GARDEN_COLOR;
}
