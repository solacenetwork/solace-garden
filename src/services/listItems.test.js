import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTROL_DATABASE_NAME } from '../storage/dexie/constants.js';
import { createGardenDatabase } from '../storage/dexie/gardenDatabase.js';
import { initializeDexieStorage } from '../storage/dexie/initializeDexieStorage.js';
import { StorageError, ValidationError } from '../storage/index.js';
import { createListItemsService, resolveListKind } from './listItems.js';

const DATABASE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TASK_ONE = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const TASK_TWO = '3d18c8af-06ea-4b7d-8bd8-c450f3e2bd4d';
const TASK_THREE = '38c2bed1-0e03-4187-aefd-233ca7b037c2';
const WISH_ONE = 'fe1cbe08-4384-4dfa-9357-4ed87eea0398';
const WISH_TWO = 'be9a73ba-0199-481d-9563-cfbc8279921d';
const GARDEN_UUID = '210b8b0f-030c-4220-9374-8b78f461b474';
const CREATED_AT = '2026-11-06T14:00:00.000Z';
const UPDATED_AT = '2026-11-06T15:00:00.000Z';

describe('Tasks and Wish List service', () => {
	let indexedDB;
	let dependencies;
	let createdDatabases;

	beforeEach(() => {
		indexedDB = new IDBFactory();
		dependencies = { indexedDB, IDBKeyRange };
		createdDatabases = new Set([CONTROL_DATABASE_NAME]);
	});

	afterEach(async () => {
		await Promise.all(
			Array.from(createdDatabases, (databaseName) =>
				new Dexie(databaseName, dependencies).delete(),
			),
		);
	});

	async function initialize(itemIds = []) {
		const uuids = [DATABASE_UUID, ...itemIds];
		const storage = await initializeDexieStorage({
			dependencies,
			randomUUID: vi.fn(() => uuids.shift()),
		});

		expect(storage.status).toBe('ready');
		createdDatabases.add(storage.databaseName);
		return storage;
	}

	function createService(storage, times = [CREATED_AT]) {
		const timestamps = [...times];
		return createListItemsService(storage.repositories.listItems, {
			now: vi.fn(() => timestamps.shift() ?? UPDATED_AT),
		});
	}

	it('derives the active list exclusively from each workspace URL', () => {
		expect(resolveListKind('/tasks')).toBe('task');
		expect(resolveListKind('/wishlist')).toBe('wishlist');
		expect([
			resolveListKind('/tasks'),
			resolveListKind('/wishlist'),
			resolveListKind('/tasks'),
		]).toEqual(['task', 'wishlist', 'task']);
	});

	it('creates and keeps Task and Wish List records separate', async () => {
		const storage = await initialize([TASK_ONE, WISH_ONE]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT]);
		const task = await lists.create('task', { text: 'Turn the compost' });
		const wish = await lists.create('wishlist', {
			text: 'Garden twine',
			quantity: '2 rolls',
			notes: 'Natural fiber',
			url: 'https://example.com/twine',
		});

		expect(await lists.list('task')).toEqual([task]);
		expect(await lists.list('wishlist')).toEqual([wish]);
		expect(task).toMatchObject({ kind: 'task', completed: false, gardenId: null });
		expect(wish).toMatchObject({
			kind: 'wishlist',
			completed: false,
			quantity: '2 rolls',
			notes: 'Natural fiber',
			url: 'https://example.com/twine',
		});

		storage.close();
	});

	it('edits, completes, reopens, and deletes Tasks', async () => {
		const storage = await initialize([TASK_ONE]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT, UPDATED_AT]);
		const task = await lists.create('task', { text: 'Water seedlings' });

		expect(await lists.update(task.id, 'task', { text: 'Water tomato seedlings' })).toBe(true);
		expect(await lists.setCompleted(task.id, true)).toBe(true);
		expect(await lists.getById(task.id)).toMatchObject({
			text: 'Water tomato seedlings',
			completed: true,
		});
		expect(await lists.setCompleted(task.id, false)).toBe(true);
		expect((await lists.getById(task.id)).completed).toBe(false);
		expect(await lists.remove(task.id)).toBe(true);
		expect(await lists.list('task')).toEqual([]);

		storage.close();
	});

	it('edits and marks Wish List items purchased and unpurchased', async () => {
		const storage = await initialize([WISH_ONE]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT, UPDATED_AT]);
		const wish = await lists.create('wishlist', { text: 'Row cover' });

		expect(await lists.update(wish.id, 'wishlist', {
			text: 'Frost row cover',
			quantity: '20 feet',
			notes: 'Reusable fabric',
			url: 'https://example.com/row-cover',
		})).toBe(true);
		expect(await lists.setCompleted(wish.id, true)).toBe(true);
		expect(await lists.getById(wish.id)).toMatchObject({
			completed: true,
			quantity: '20 feet',
		});
		expect(await lists.setCompleted(wish.id, false)).toBe(true);
		expect(await lists.update(wish.id, 'wishlist', {
			quantity: null,
			notes: null,
			url: null,
		})).toBe(true);
		expect(await lists.getById(wish.id)).toMatchObject({
			completed: false,
			quantity: null,
			notes: null,
			url: null,
		});
		expect(await lists.remove(wish.id)).toBe(true);
		expect(await lists.list('wishlist')).toEqual([]);

		storage.close();
	});

	it('persists independent completion states after reopening storage', async () => {
		const storage = await initialize([TASK_ONE, TASK_TWO, WISH_ONE]);
		const lists = createService(storage, [
			CREATED_AT,
			CREATED_AT,
			CREATED_AT,
			UPDATED_AT,
			UPDATED_AT,
			UPDATED_AT,
		]);
		await lists.create('task', { text: 'First task' });
		await lists.create('task', { text: 'Second task' });
		await lists.create('wishlist', { text: 'Row cover' });
		await lists.setCompleted(TASK_ONE, true);
		await lists.setCompleted(TASK_TWO, true);
		await lists.setCompleted(TASK_ONE, false);
		await lists.setCompleted(WISH_ONE, true);

		const databaseName = storage.databaseName;
		storage.close();

		const reopened = await initializeDexieStorage({ dependencies });
		createdDatabases.add(reopened.databaseName);
		expect(reopened.databaseName).toBe(databaseName);
		const reopenedLists = createListItemsService(reopened.repositories.listItems);
		expect(await reopenedLists.getById(TASK_ONE)).toMatchObject({ completed: false });
		expect(await reopenedLists.getById(TASK_TWO)).toMatchObject({ completed: true });
		expect(await reopenedLists.getById(WISH_ONE)).toMatchObject({ completed: true });
		reopened.close();
	});

	it('rejects malformed Wish List fields without changing persisted data', async () => {
		const storage = await initialize([WISH_ONE, WISH_TWO]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT]);
		const original = await lists.create('wishlist', { text: 'Seed trays' });

		for (const url of ['not a URL', 'javascript:alert(1)', undefined]) {
			await expect(
				lists.update(original.id, 'wishlist', { url }),
			).rejects.toMatchObject({
				name: 'ValidationError',
				code: 'INVALID_LIST_ITEM_URL',
				field: 'url',
			});
		}
		await expect(
			lists.create('wishlist', { text: 'Bad quantity', quantity: '' }),
		).rejects.toBeInstanceOf(ValidationError);
		expect(await lists.getById(original.id)).toEqual(original);

		storage.close();
	});

	it('rejects Wish List-only fields on Tasks instead of silently dropping them', async () => {
		const storage = await initialize([TASK_ONE]);
		const lists = createService(storage);

		await expect(
			lists.create('task', { text: 'Buy compost', quantity: '2 bags' }),
		).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'TASK_WISHLIST_FIELD',
			field: 'quantity',
		});
		expect(await lists.list('task')).toEqual([]);

		storage.close();
	});

	it('keeps nullable and valid Garden associations without requiring Gardens', async () => {
		const storage = await initialize([TASK_ONE, TASK_TWO]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT]);
		const unlinked = await lists.create('task', { text: 'General task' });

		expect(unlinked.gardenId).toBeNull();

		const database = createGardenDatabase(storage.databaseName, dependencies);
		await database.open();
		await database.table('gardens').add({ id: GARDEN_UUID, name: 'Home', status: 'active' });
		database.close();

		const linked = await lists.create('task', {
			text: 'Garden-specific task',
			gardenId: GARDEN_UUID,
		});
		expect(linked.gardenId).toBe(GARDEN_UUID);
		expect(await lists.update(linked.id, 'task', { gardenId: null })).toBe(true);
		expect((await lists.getById(linked.id)).gardenId).toBeNull();

		storage.close();
	});

	it('persists reorder operations and keeps each list order independent', async () => {
		const storage = await initialize([
			TASK_ONE,
			TASK_TWO,
			TASK_THREE,
			WISH_ONE,
			WISH_TWO,
		]);
		const lists = createService(storage, [
			CREATED_AT,
			CREATED_AT,
			CREATED_AT,
			CREATED_AT,
			CREATED_AT,
			UPDATED_AT,
		]);
		await lists.create('task', { text: 'First task' });
		await lists.create('task', { text: 'Second task' });
		await lists.create('task', { text: 'Third task' });
		await lists.create('wishlist', { text: 'First wish' });
		await lists.create('wishlist', { text: 'Second wish' });

		await lists.reorder('task', [TASK_THREE, TASK_ONE, TASK_TWO]);
		expect((await lists.list('task')).map(({ id }) => id)).toEqual([
			TASK_THREE,
			TASK_ONE,
			TASK_TWO,
		]);
		expect((await lists.list('wishlist')).map(({ id }) => id)).toEqual([
			WISH_ONE,
			WISH_TWO,
		]);

		const databaseName = storage.databaseName;
		storage.close();
		const reopened = await initializeDexieStorage({ dependencies });
		expect(reopened.databaseName).toBe(databaseName);
		const reopenedLists = createListItemsService(reopened.repositories.listItems);
		expect((await reopenedLists.list('task')).map(({ id }) => id)).toEqual([
			TASK_THREE,
			TASK_ONE,
			TASK_TWO,
		]);
		reopened.close();
	});

	it('rolls back invalid reorders without changing either list', async () => {
		const storage = await initialize([TASK_ONE, TASK_TWO, WISH_ONE]);
		const lists = createService(storage, [CREATED_AT, CREATED_AT, CREATED_AT]);
		await lists.create('task', { text: 'First task' });
		await lists.create('task', { text: 'Second task' });
		await lists.create('wishlist', { text: 'Wish' });

		await expect(
			lists.reorder('task', [TASK_TWO, WISH_ONE]),
		).rejects.toMatchObject({ code: 'INVALID_LIST_ITEM_ORDER' });
		expect((await lists.list('task')).map(({ id }) => id)).toEqual([TASK_ONE, TASK_TWO]);
		expect((await lists.list('wishlist')).map(({ id }) => id)).toEqual([WISH_ONE]);

		storage.close();
	});

	it('surfaces unsuccessful writes as storage errors and preserves records', async () => {
		const storage = await initialize([TASK_ONE]);
		const lists = createService(storage, [CREATED_AT, UPDATED_AT]);
		const original = await lists.create('task', { text: 'Keep this task' });
		storage.close();

		await expect(
			lists.setCompleted(original.id, true),
		).rejects.toBeInstanceOf(StorageError);

		const reopened = await initializeDexieStorage({ dependencies });
		expect(await reopened.repositories.listItems.getById(original.id)).toEqual(original);
		reopened.close();
	});
});
