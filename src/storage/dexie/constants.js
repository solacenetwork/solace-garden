export const CONTROL_DATABASE_NAME = 'solace-config';
export const CONTROL_DATABASE_VERSION = 1;
export const CONTROL_STORE_NAME = 'configuration';
export const MAIN_CONFIG_ID = 'main';
export const CONFIG_VERSION = 1;

export const GARDEN_DATABASE_PREFIX = 'solace-garden-data-';
export const GARDEN_DATABASE_VERSION = 2;

export const GARDEN_STORES_V1 = Object.freeze({
	notes: 'id, gardenId, updatedAt',
	listItems: 'id, kind, gardenId, [kind+sortOrder]',
	locations: 'id, name',
	gardenTypes: 'id, name, sortOrder',
	gardens: 'id, name, locationId, *typeIds, status, updatedAt',
	gardenTemplates: 'id, name, updatedAt',
});

export const GARDEN_STORES = Object.freeze({
	...GARDEN_STORES_V1,
	drafts: 'id, kind, subjectId, updatedAt, [kind+subjectId]',
});

export const GARDEN_INDEXES = Object.freeze({
	notes: {
		gardenId: { keyPath: 'gardenId', multiEntry: false },
		updatedAt: { keyPath: 'updatedAt', multiEntry: false },
	},
	listItems: {
		kind: { keyPath: 'kind', multiEntry: false },
		gardenId: { keyPath: 'gardenId', multiEntry: false },
		'[kind+sortOrder]': {
			keyPath: ['kind', 'sortOrder'],
			multiEntry: false,
		},
	},
	locations: {
		name: { keyPath: 'name', multiEntry: false },
	},
	gardenTypes: {
		name: { keyPath: 'name', multiEntry: false },
		sortOrder: { keyPath: 'sortOrder', multiEntry: false },
	},
	gardens: {
		name: { keyPath: 'name', multiEntry: false },
		locationId: { keyPath: 'locationId', multiEntry: false },
		typeIds: { keyPath: 'typeIds', multiEntry: true },
		status: { keyPath: 'status', multiEntry: false },
		updatedAt: { keyPath: 'updatedAt', multiEntry: false },
	},
	gardenTemplates: {
		name: { keyPath: 'name', multiEntry: false },
		updatedAt: { keyPath: 'updatedAt', multiEntry: false },
	},
	drafts: {
		kind: { keyPath: 'kind', multiEntry: false },
		subjectId: { keyPath: 'subjectId', multiEntry: false },
		updatedAt: { keyPath: 'updatedAt', multiEntry: false },
		'[kind+subjectId]': {
			keyPath: ['kind', 'subjectId'],
			multiEntry: false,
		},
	},
});

