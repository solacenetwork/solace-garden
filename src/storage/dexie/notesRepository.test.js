import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageError, ValidationError } from '../index.js';
import { CONTROL_DATABASE_NAME } from './constants.js';
import { initializeDexieStorage } from './initializeDexieStorage.js';

const DATABASE_UUID_ONE = '550e8400-e29b-41d4-a716-446655440000';
const DATABASE_UUID_TWO = '2c1f8f28-9624-4d40-8c5f-4d7bb793d641';
const NOTE_UUID_ONE = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const NOTE_UUID_TWO = '3d18c8af-06ea-4b7d-8bd8-c450f3e2bd4d';

describe('Notes repository foundation', () => {
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

	async function initialize(randomUUID = () => DATABASE_UUID_ONE) {
		const storage = await initializeDexieStorage({ dependencies, randomUUID });

		if (storage.databaseName) {
			createdDatabases.add(storage.databaseName);
		}

		expect(storage.status).toBe('ready');
		return storage;
	}

	it('creates, reads, updates, lists, and removes application records', async () => {
		const randomUUID = vi
			.fn()
			.mockReturnValueOnce(DATABASE_UUID_ONE)
			.mockReturnValueOnce(NOTE_UUID_ONE);
		const storage = await initialize(randomUUID);
		const input = { text: 'Remember succession planting', gardenId: null };
		const created = await storage.repositories.notes.create(input);

		expect(input).toEqual({ text: 'Remember succession planting', gardenId: null });
		expect(created).toEqual({ ...input, id: NOTE_UUID_ONE });
		expect(await storage.repositories.notes.getById(NOTE_UUID_ONE)).toEqual(created);
		expect(await storage.repositories.notes.list()).toEqual([created]);

		expect(
			await storage.repositories.notes.update(NOTE_UUID_ONE, {
				text: 'Remember fall succession planting',
			}),
		).toBe(true);
		expect(await storage.repositories.notes.getById(NOTE_UUID_ONE)).toMatchObject({
			text: 'Remember fall succession planting',
		});

		expect(await storage.repositories.notes.remove(NOTE_UUID_ONE)).toBe(true);
		expect(await storage.repositories.notes.remove(NOTE_UUID_ONE)).toBe(false);
		expect(await storage.repositories.notes.getById(NOTE_UUID_ONE)).toBeNull();

		storage.close();
	});

	it('persists records through connection close and active-database reopen', async () => {
		const randomUUID = vi
			.fn()
			.mockReturnValueOnce(DATABASE_UUID_ONE)
			.mockReturnValueOnce(NOTE_UUID_ONE);
		const first = await initialize(randomUUID);
		await first.repositories.notes.create({ text: 'Persistent note' });
		first.close();

		const replacementUuid = vi.fn(() => DATABASE_UUID_TWO);
		const reopened = await initializeDexieStorage({
			dependencies,
			randomUUID: replacementUuid,
		});

		expect(reopened.status).toBe('ready');
		expect(reopened.databaseName).toBe(first.databaseName);
		expect(replacementUuid).not.toHaveBeenCalled();
		expect(await reopened.repositories.notes.getById(NOTE_UUID_ONE)).toMatchObject({
			text: 'Persistent note',
		});

		reopened.close();
	});

	it('rejects malformed IDs and note input before persistence', async () => {
		const storage = await initialize();
		const repository = storage.repositories.notes;

		await expect(repository.getById('not-a-uuid')).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'INVALID_RECORD_ID',
			field: 'id',
		});
		await expect(repository.getById()).rejects.toMatchObject({
			code: 'INVALID_RECORD_ID',
		});
		await expect(
			repository.update('not-a-uuid', { text: 'Invalid target' }),
		).rejects.toMatchObject({ code: 'INVALID_RECORD_ID' });
		await expect(repository.remove('not-a-uuid')).rejects.toMatchObject({
			code: 'INVALID_RECORD_ID',
		});
		await expect(repository.create({ text: '' })).rejects.toBeInstanceOf(
			ValidationError,
		);
		await expect(
			repository.create({ id: 'bad-id', text: 'Invalid ID' }),
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			repository.create({ text: 'Bad link', gardenId: 'bad-garden-id' }),
		).rejects.toBeInstanceOf(ValidationError);
		await expect(repository.update(NOTE_UUID_ONE, {})).rejects.toMatchObject({
			code: 'EMPTY_CHANGES',
		});
		await expect(
			repository.update(NOTE_UUID_ONE, { id: NOTE_UUID_TWO }),
		).rejects.toMatchObject({ code: 'IMMUTABLE_RECORD_ID' });
		expect(await repository.list()).toEqual([]);

		storage.close();
	});

	it('distinguishes validation failures from storage failures', async () => {
		const storage = await initialize();
		const repository = storage.repositories.notes;
		await repository.create({ id: NOTE_UUID_ONE, text: 'Original' });

		let databaseFailure;
		try {
			await repository.create({ id: NOTE_UUID_ONE, text: 'Duplicate' });
		} catch (error) {
			databaseFailure = error;
		}

		expect(databaseFailure).toBeInstanceOf(StorageError);
		expect(databaseFailure).not.toBeInstanceOf(ValidationError);
		expect(databaseFailure).toMatchObject({
			code: 'STORAGE_OPERATION_FAILED',
			operation: 'create note',
		});
		expect(databaseFailure.cause?.name).toBe('ConstraintError');

		storage.close();
	});

	it('distinguishes omitted update fields from explicitly invalid values', async () => {
		const storage = await initialize();
		const repository = storage.repositories.notes;
		const original = {
			id: NOTE_UUID_ONE,
			text: 'Original text',
			gardenId: NOTE_UUID_TWO,
		};
		await repository.create(original);

		for (const invalidText of [undefined, null, '']) {
			await expect(
				repository.update(NOTE_UUID_ONE, { text: invalidText }),
			).rejects.toMatchObject({
				name: 'ValidationError',
				code: 'INVALID_NOTE_TEXT',
				field: 'text',
			});
			expect(await repository.getById(NOTE_UUID_ONE)).toEqual(original);
		}

		await expect(
			repository.update(NOTE_UUID_ONE, { gardenId: undefined }),
		).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'INVALID_RECORD_ID',
			field: 'gardenId',
		});
		await expect(
			repository.update(NOTE_UUID_ONE, { updatedAt: undefined }),
		).rejects.toMatchObject({
			name: 'ValidationError',
			code: 'INVALID_TIMESTAMP',
			field: 'updatedAt',
		});
		expect(await repository.getById(NOTE_UUID_ONE)).toEqual(original);

		expect(
			await repository.update(NOTE_UUID_ONE, { gardenId: null }),
		).toBe(true);
		expect(await repository.getById(NOTE_UUID_ONE)).toEqual({
			...original,
			gardenId: null,
		});

		storage.close();
	});

	it('rolls back all notes writes when an atomic operation fails', async () => {
		const storage = await initialize();
		const repository = storage.repositories.notes;

		await expect(
			repository.runAtomic(async (notes) => {
				await notes.create({ id: NOTE_UUID_ONE, text: 'First write' });
				await notes.create({ id: NOTE_UUID_ONE, text: 'Failing duplicate' });
			}),
		).rejects.toBeInstanceOf(StorageError);

		expect(await repository.list()).toEqual([]);
		storage.close();
	});

	it('commits all notes writes and returns the successful atomic result', async () => {
		const storage = await initialize();
		const repository = storage.repositories.notes;

		const result = await repository.runAtomic(async (notes) => {
			await notes.create({ id: NOTE_UUID_ONE, text: 'First committed note' });
			await notes.create({ id: NOTE_UUID_TWO, text: 'Second committed note' });
			return 'both-notes-committed';
		});

		expect(result).toBe('both-notes-committed');
		expect(await repository.getById(NOTE_UUID_ONE)).toMatchObject({
			text: 'First committed note',
		});
		expect(await repository.getById(NOTE_UUID_TWO)).toMatchObject({
			text: 'Second committed note',
		});
		expect(await repository.list()).toHaveLength(2);

		storage.close();
	});

	it('operates independently of the active database physical UUID', async () => {
		const randomUUID = vi
			.fn()
			.mockReturnValueOnce(DATABASE_UUID_TWO)
			.mockReturnValueOnce(NOTE_UUID_TWO);
		const storage = await initialize(randomUUID);

		expect(storage.databaseName).toBe(
			`solace-garden-data-${DATABASE_UUID_TWO}`,
		);
		expect(
			await storage.repositories.notes.create({ text: 'Name-independent note' }),
		).toMatchObject({
			id: NOTE_UUID_TWO,
			text: 'Name-independent note',
		});

		storage.close();
	});
});

