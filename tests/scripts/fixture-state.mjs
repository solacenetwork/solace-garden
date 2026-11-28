import { basename, relative, resolve } from 'node:path';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import {
	CONFIG_VERSION,
	CONTROL_DATABASE_NAME,
	CONTROL_DATABASE_VERSION,
	CONTROL_STORE_NAME,
	GARDEN_DATABASE_VERSION,
	GARDEN_INDEXES,
	GARDEN_STORES,
	MAIN_CONFIG_ID,
} from '../../src/storage/dexie/constants.js';
import { isGardenDatabaseName } from '../../src/storage/dexie/databaseNames.js';

export const APP_ORIGIN = 'http://localhost:5173';
export const DEFAULT_FIXTURE_FILENAME = 'sample-garden.json';
export const DEFAULT_PROFILE_PATH = resolve('tests/.chrome-fixture-profile');

const FIXTURE_DIRECTORY = resolve('tests/fixtures');
const NAMED_PROFILE_DIRECTORY = resolve('tests/.chrome-fixture-profiles');
const FILENAME_PATTERN = /^[a-z0-9][a-z0-9._-]*\.json$/i;
const PROFILE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;
const GARDEN_STATUSES = new Set(['planned', 'active', 'completed', 'archived']);
const DRAFT_EDITORS = new Set(['quickstart', 'wizard', 'advanced']);

export function parseArguments(argv, { allowProfile = false } = {}) {
	let fixtureFilename;
	let profileName = null;

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--profile' && allowProfile) {
			if (profileName !== null || !argv[index + 1]) {
				throw new Error('--profile requires one profile name.');
			}
			profileName = argv[index + 1];
			index += 1;
			continue;
		}
		if (argument.startsWith('-')) {
			throw new Error(`Unknown option: ${argument}`);
		}
		if (fixtureFilename !== undefined) {
			throw new Error('Specify at most one fixture filename.');
		}
		fixtureFilename = argument;
	}

	return {
		fixturePath: resolveFixturePath(fixtureFilename ?? DEFAULT_FIXTURE_FILENAME),
		profilePath: allowProfile ? resolveProfilePath(profileName) : undefined,
	};
}

export function resolveFixturePath(filename) {
	if (
		typeof filename !== 'string' ||
		!FILENAME_PATTERN.test(filename) ||
		basename(filename) !== filename
	) {
		throw new Error('Fixture filename must be a simple .json filename without a path.');
	}

	const fixturePath = resolve(FIXTURE_DIRECTORY, filename);
	if (relative(FIXTURE_DIRECTORY, fixturePath).startsWith('..')) {
		throw new Error('Fixture path must remain inside tests/fixtures/.');
	}
	return fixturePath;
}

function resolveProfilePath(profileName) {
	if (profileName === null) return DEFAULT_PROFILE_PATH;
	if (typeof profileName !== 'string' || !PROFILE_PATTERN.test(profileName)) {
		throw new Error('Profile name may contain only letters, numbers, hyphens, and underscores.');
	}
	return resolve(NAMED_PROFILE_DIRECTORY, profileName);
}

export async function readAndValidateFixture(fixturePath) {
	let fixture;
	try {
		fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
	} catch (error) {
		throw new Error(`Could not read fixture ${fixturePath}: ${error.message}`, { cause: error });
	}
	return validateStorageState(fixture);
}

export function validateStorageState(state, { capture = false } = {}) {
	const errors = [];
	const warnings = [];
	const cookies = Array.isArray(state?.cookies) ? state.cookies : [];
	if (cookies.length > 0) {
		(capture ? warnings : errors).push(
			`Storage state contains ${cookies.length} cookie(s)${capture ? '; they will be excluded' : ''}.`,
		);
	}
	const origins = Array.isArray(state?.origins) ? state.origins : [];
	const matchingOrigins = origins.filter(({ origin }) => origin === APP_ORIGIN);
	if (matchingOrigins.length !== 1) {
		errors.push(`Expected exactly one ${APP_ORIGIN} storage origin; found ${matchingOrigins.length}.`);
	}
	if (origins.some(({ origin }) => origin !== APP_ORIGIN)) {
		(capture ? warnings : errors).push(
			`Storage state contains unrelated origin(s)${capture ? '; they will be excluded' : ''}.`,
		);
	}
	const origin = matchingOrigins[0];
	const databases = Array.isArray(origin?.indexedDB) ? origin.indexedDB : [];
	const databaseNames = databases.map(({ name }) => name);
	if (new Set(databaseNames).size !== databaseNames.length) {
		errors.push('Storage state contains duplicate IndexedDB database names.');
	}
	const control = databases.find(({ name }) => name === CONTROL_DATABASE_NAME);
	validateDatabaseSchema(control, {
		name: CONTROL_DATABASE_NAME,
		version: CONTROL_DATABASE_VERSION,
		stores: { [CONTROL_STORE_NAME]: {} },
	}, errors);

	const configurationStore = findStore(control, CONTROL_STORE_NAME);
	const configurations = records(configurationStore, errors, CONTROL_STORE_NAME);
	const configuration = configurations.find(({ id }) => id === MAIN_CONFIG_ID);
	if (!configuration) {
		errors.push('The control database does not contain the main configuration record.');
	} else {
		if (configuration.configVersion !== CONFIG_VERSION) {
			errors.push(`Configuration version must be ${CONFIG_VERSION}.`);
		}
		if (!isGardenDatabaseName(configuration.activeDatabase)) {
			errors.push('The configured active Garden database name is invalid.');
		}
		if (
			configuration.previousDatabase !== null &&
			!isGardenDatabaseName(configuration.previousDatabase)
		) {
			errors.push('The configured previous Garden database name is invalid.');
		}
		if (configuration.recoveryState !== null) {
			errors.push('Application storage initialization is incomplete.');
		}
	}
	if (configurations.length > 1) {
		warnings.push(`Control database contains ${configurations.length} configuration records; only "${MAIN_CONFIG_ID}" is active.`);
	}

	const activeDatabaseName = configuration?.activeDatabase;
	const activeDatabase = databases.find(({ name }) => name === activeDatabaseName);
	validateDatabaseSchema(activeDatabase, {
		name: activeDatabaseName ?? 'configured active Garden database',
		version: GARDEN_DATABASE_VERSION,
		stores: GARDEN_INDEXES,
	}, errors);

	const extraDatabases = databases.filter(({ name }) => (
		name !== CONTROL_DATABASE_NAME && name !== activeDatabaseName
	));
	if (extraDatabases.length > 0) {
		warnings.push(`Snapshot also contains ${extraDatabases.length} inactive or unrelated IndexedDB database(s): ${extraDatabases.map(({ name }) => name).join(', ')}.`);
	}

	const data = Object.fromEntries(Object.keys(GARDEN_STORES).map((storeName) => [
		storeName,
		records(findStore(activeDatabase, storeName), errors, storeName),
	]));
	validateRelationships(data, errors, warnings);

	if (errors.length > 0) {
		throw new Error(`Fixture validation failed:\n- ${errors.join('\n- ')}`);
	}

	return {
		activeDatabaseName,
		fixture: {
			cookies: [],
			origins: [{
				origin: APP_ORIGIN,
				localStorage: Array.isArray(origin.localStorage) ? origin.localStorage : [],
				indexedDB: databases,
			}],
		},
		summary: buildSummary(origin, activeDatabase, data),
		warnings,
	};
}

function validateDatabaseSchema(database, expected, errors) {
	if (!database) {
		errors.push(`Expected IndexedDB database "${expected.name}" was not found.`);
		return;
	}
	const nativeVersion = expected.version * 10;
	if (database.version !== nativeVersion) {
		errors.push(`Database "${database.name}" has version ${database.version}; expected ${nativeVersion}.`);
	}
	const actualStores = Array.isArray(database.stores) ? database.stores : [];
	const expectedStoreNames = Object.keys(expected.stores).sort();
	const actualStoreNames = actualStores.map(({ name }) => name).sort();
	if (JSON.stringify(actualStoreNames) !== JSON.stringify(expectedStoreNames)) {
		errors.push(`Database "${database.name}" stores are [${actualStoreNames.join(', ')}]; expected [${expectedStoreNames.join(', ')}].`);
		return;
	}

	for (const storeName of expectedStoreNames) {
		const store = findStore(database, storeName);
		if (store?.keyPath !== 'id' || store.autoIncrement !== false) {
			errors.push(`Store "${storeName}" must use the non-incrementing "id" key path.`);
		}
		const expectedIndexes = expected.stores[storeName];
		const actualIndexes = Array.isArray(store?.indexes) ? store.indexes : [];
		const expectedIndexNames = Object.keys(expectedIndexes).sort();
		const actualIndexNames = actualIndexes.map(({ name }) => name).sort();
		if (JSON.stringify(actualIndexNames) !== JSON.stringify(expectedIndexNames)) {
			errors.push(`Store "${storeName}" indexes are [${actualIndexNames.join(', ')}]; expected [${expectedIndexNames.join(', ')}].`);
			continue;
		}
		for (const [indexName, expectedIndex] of Object.entries(expectedIndexes)) {
			const actualIndex = actualIndexes.find(({ name }) => name === indexName);
			const actualKeyPath = actualIndex?.keyPathArray ?? actualIndex?.keyPath;
			if (
				JSON.stringify(actualKeyPath) !== JSON.stringify(expectedIndex.keyPath) ||
				actualIndex.multiEntry !== expectedIndex.multiEntry ||
				actualIndex.unique !== false
			) {
				errors.push(`Index "${storeName}.${indexName}" does not match the current schema.`);
			}
		}
	}
}

function findStore(database, storeName) {
	return database?.stores?.find(({ name }) => name === storeName);
}

function records(store, errors, label) {
	if (!store || !Array.isArray(store.records)) return [];
	const values = [];
	for (const [index, record] of store.records.entries()) {
		const value = record?.value;
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			errors.push(`Store "${label}" record ${index + 1} has no object value.`);
			continue;
		}
		values.push(value);
	}
	const ids = values.map(({ id }) => id);
	if (ids.some((id) => typeof id !== 'string')) {
		errors.push(`Store "${label}" contains a record without a string id.`);
	}
	if (new Set(ids).size !== ids.length) {
		errors.push(`Store "${label}" contains duplicate record ids.`);
	}
	return values;
}

function validateRelationships(data, errors, warnings) {
	const ids = Object.fromEntries(Object.entries(data).map(([name, values]) => [
		name,
		new Set(values.map(({ id }) => id)),
	]));

	for (const garden of data.gardens) {
		if (!GARDEN_STATUSES.has(garden.status) || typeof garden.isClosed !== 'boolean') {
			errors.push(`Garden ${garden.id} has an invalid lifecycle.`);
		}
		if (garden.status === 'archived' && !garden.isClosed) {
			errors.push(`Archived Garden ${garden.id} must be closed.`);
		}
		if (!ids.locations.has(garden.locationId)) {
			errors.push(`Garden ${garden.id} references missing Location ${garden.locationId}.`);
		}
		if (!Array.isArray(garden.typeIds)) {
			errors.push(`Garden ${garden.id} does not have a Garden Type array.`);
		}
		for (const typeId of Array.isArray(garden.typeIds) ? garden.typeIds : []) {
			if (!ids.gardenTypes.has(typeId)) {
				errors.push(`Garden ${garden.id} references missing Garden Type ${typeId}.`);
			}
		}
	}

	for (const [label, values] of [['Note', data.notes], ['list item', data.listItems]]) {
		for (const value of values) {
			if (value.gardenId !== null && value.gardenId !== undefined && !ids.gardens.has(value.gardenId)) {
				errors.push(`${label} ${value.id} references missing Garden ${value.gardenId}.`);
			}
		}
	}

	for (const item of data.listItems) {
		if (!['task', 'wishlist'].includes(item.kind) || typeof item.completed !== 'boolean') {
			errors.push(`List item ${item.id} has an invalid kind or completion state.`);
		}
	}

	for (const draft of data.drafts) {
		if (draft.kind === 'note') {
			if (!Object.hasOwn(draft, 'gardenId')) {
				errors.push(`Note draft ${draft.id} has no Garden association field.`);
			}
			if (draft.isNew !== (draft.subjectId === null)) {
				errors.push(`Note draft ${draft.id} has an inconsistent draft identity.`);
			}
			if (draft.subjectId !== null && !ids.notes.has(draft.subjectId)) {
				errors.push(`Note draft ${draft.id} references missing Note ${draft.subjectId}.`);
			}
			if (Object.hasOwn(draft, 'gardenId') && draft.gardenId !== null && !ids.gardens.has(draft.gardenId)) {
				warnings.push(`Note draft ${draft.id} references a Garden that is no longer available and requires the supported recovery flow.`);
			}
		} else if (draft.kind === 'garden') {
			if (draft.subjectId !== null || draft.isNew !== true || !draft.fields || typeof draft.fields !== 'object') {
				errors.push(`Garden draft ${draft.id} has an invalid draft identity or fields.`);
			}
			if (!Array.isArray(draft.fields?.typeIds)) {
				errors.push(`Garden draft ${draft.id} does not have a Garden Type array.`);
			}
			if (!DRAFT_EDITORS.has(draft.preferredEditor)) {
				errors.push(`Garden draft ${draft.id} has an invalid preferred editor.`);
			}
			if (!Object.hasOwn(draft, 'sourceTemplateId')) {
				errors.push(`Garden draft ${draft.id} has no source Template field.`);
			}
			if (
				!Object.hasOwn(draft, 'currentStepId') ||
				(draft.preferredEditor === 'wizard'
					? typeof draft.currentStepId !== 'string' || draft.currentStepId.trim() === ''
					: draft.currentStepId !== null)
			) {
				errors.push(`Garden draft ${draft.id} has invalid Wizard step metadata.`);
			}
			if (Object.hasOwn(draft, 'sourceTemplateId') && draft.sourceTemplateId !== null && !ids.gardenTemplates.has(draft.sourceTemplateId)) {
				warnings.push(`Garden draft ${draft.id} references a Template that is no longer available.`);
			}
			if (draft.fields?.locationId && !ids.locations.has(draft.fields.locationId)) {
				warnings.push(`Garden draft ${draft.id} references a Location that is no longer available.`);
			}
			for (const typeId of Array.isArray(draft.fields?.typeIds) ? draft.fields.typeIds : []) {
				if (!ids.gardenTypes.has(typeId)) {
					errors.push(`Garden draft ${draft.id} references missing Garden Type ${typeId}.`);
				}
			}
		} else {
			errors.push(`Draft ${draft.id} has invalid kind ${draft.kind}.`);
		}
	}

	for (const template of data.gardenTemplates) {
		const configuration = template.configuration;
		if (!configuration || typeof configuration !== 'object') {
			errors.push(`Template ${template.id} has no configuration.`);
			continue;
		}
		if (!ids.locations.has(configuration.locationId)) {
			warnings.push(`Template ${template.id} references a deleted Location; the application will use its supported fallback.`);
		}
		if (!Array.isArray(configuration.typeIds)) {
			errors.push(`Template ${template.id} does not have a Garden Type array.`);
		}
		for (const typeId of Array.isArray(configuration.typeIds) ? configuration.typeIds : []) {
			if (!ids.gardenTypes.has(typeId)) {
				errors.push(`Template ${template.id} references missing Garden Type ${typeId}.`);
			}
		}
	}
}

function buildSummary(origin, activeDatabase, data) {
	const byStatus = Object.fromEntries([...GARDEN_STATUSES].map((status) => [
		status,
		data.gardens.filter((garden) => garden.status === status).length,
	]));
	const gardenDrafts = data.drafts.filter(({ kind }) => kind === 'garden');
	const notes = associationCounts(data.notes);
	const tasks = associationCounts(data.listItems.filter(({ kind }) => kind === 'task'));
	const wishlist = associationCounts(data.listItems.filter(({ kind }) => kind === 'wishlist'));

	return {
		origin: origin.origin,
		activeDatabaseName: activeDatabase.name,
		activeDatabaseDexieVersion: GARDEN_DATABASE_VERSION,
		activeDatabaseVersion: activeDatabase.version,
		recordCounts: Object.fromEntries(Object.entries(data).map(([name, values]) => [name, values.length])),
		gardenStatus: byStatus,
		gardensOpen: data.gardens.filter(({ isClosed }) => !isClosed).length,
		gardensClosed: data.gardens.filter(({ isClosed }) => isClosed).length,
		gardenDrafts: Object.fromEntries([...DRAFT_EDITORS].map((editor) => [
			editor,
			gardenDrafts.filter(({ preferredEditor }) => preferredEditor === editor).length,
		])),
		noteDrafts: data.drafts.filter(({ kind }) => kind === 'note').length,
		notes,
		tasks: {
			...tasks,
			outstanding: data.listItems.filter(({ kind, completed }) => kind === 'task' && !completed).length,
			completed: data.listItems.filter(({ kind, completed }) => kind === 'task' && completed).length,
		},
		wishlist: {
			...wishlist,
			outstanding: data.listItems.filter(({ kind, completed }) => kind === 'wishlist' && !completed).length,
			purchased: data.listItems.filter(({ kind, completed }) => kind === 'wishlist' && completed).length,
		},
		localStorageEntries: Array.isArray(origin.localStorage) ? origin.localStorage.length : 0,
	};
}

function associationCounts(values) {
	return {
		associated: values.filter(({ gardenId }) => gardenId !== null && gardenId !== undefined).length,
		independent: values.filter(({ gardenId }) => gardenId === null || gardenId === undefined).length,
	};
}

export function printSummary(summary, warnings = []) {
	console.log(`Application origin: ${summary.origin}`);
	console.log(`Active database: ${summary.activeDatabaseName} (Dexie version ${summary.activeDatabaseDexieVersion}; native version ${summary.activeDatabaseVersion})`);
	console.log(`Records: ${Object.entries(summary.recordCounts).map(([name, count]) => `${name}=${count}`).join(', ')}`);
	console.log(`Gardens by status: ${Object.entries(summary.gardenStatus).map(([status, count]) => `${status}=${count}`).join(', ')}; open=${summary.gardensOpen}, closed=${summary.gardensClosed}`);
	console.log(`Garden drafts: ${Object.entries(summary.gardenDrafts).map(([editor, count]) => `${editor}=${count}`).join(', ')}; Note drafts=${summary.noteDrafts}`);
	console.log(`Notes: associated=${summary.notes.associated}, independent=${summary.notes.independent}`);
	console.log(`Tasks: outstanding=${summary.tasks.outstanding}, completed=${summary.tasks.completed}, associated=${summary.tasks.associated}, independent=${summary.tasks.independent}`);
	console.log(`Wish List: outstanding=${summary.wishlist.outstanding}, purchased=${summary.wishlist.purchased}, associated=${summary.wishlist.associated}, independent=${summary.wishlist.independent}`);
	console.log(`Catalogs: Locations=${summary.recordCounts.locations}, Garden Types=${summary.recordCounts.gardenTypes}, Templates=${summary.recordCounts.gardenTemplates}`);
	console.log(`localStorage entries: ${summary.localStorageEntries}`);
	for (const warning of warnings) console.warn(`Warning: ${warning}`);
}

export async function safeWriteFixture(fixturePath, fixture) {
	const temporaryPath = `${fixturePath}.${process.pid}.${Date.now()}.tmp`;
	try {
		await writeFile(temporaryPath, `${JSON.stringify(fixture, null, 2)}\n`, { flag: 'wx' });
		await rename(temporaryPath, fixturePath);
	} catch (error) {
		await unlink(temporaryPath).catch(() => undefined);
		throw error;
	}
}

export function displayPath(path) {
	return relative(resolve('.'), path) || '.';
}
