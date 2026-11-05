import { GARDEN_DATABASE_PREFIX } from './constants.js';

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createGardenDatabaseName(randomUUID = () => crypto.randomUUID()) {
	return `${GARDEN_DATABASE_PREFIX}${randomUUID()}`;
}

export function isGardenDatabaseName(value) {
	return (
		typeof value === 'string' &&
		value.startsWith(GARDEN_DATABASE_PREFIX) &&
		UUID_PATTERN.test(value.slice(GARDEN_DATABASE_PREFIX.length))
	);
}

