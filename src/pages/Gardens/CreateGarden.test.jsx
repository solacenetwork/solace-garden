import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGardensService } from '../../services/gardens.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { initializeDexieStorage } from '../../storage/dexie/initializeDexieStorage.js';
import {
	createQuickStartSubmitter,
	QUICK_START_TYPE_IDS,
} from './CreateGarden.jsx';

const CREATED = '2026-11-07T18:30:00.000Z';

describe('Quick Start Garden creation', () => {
	let dependencies, storage, gardens, navigate;
	beforeEach(async () => {
		dependencies = { indexedDB: new IDBFactory(), IDBKeyRange };
		storage = await initializeDexieStorage({ dependencies });
		gardens = createGardensService(storage.repositories.gardens, { now: () => CREATED });
		navigate = vi.fn();
	});
	afterEach(async () => {
		storage?.close();
		for (const { name } of await dependencies.indexedDB.databases()) {
			await new Dexie(name, dependencies).delete();
		}
	});

	function submitter(overrides = {}) {
		return createQuickStartSubmitter({
			createGarden: (input) => gardens.create(input),
			navigate,
			...overrides,
		});
	}

	it('creates, persists, and navigates to the exact Quick Start record', async () => {
		await storage.repositories.locations.update(DEFAULT_LOCATION_ID, { name: 'Renamed Home' });
		const garden = await submitter()('  Kitchen Garden  ');

		expect(garden).toEqual({
			id: expect.stringMatching(/^[\da-f-]{36}$/),
			name: 'Kitchen Garden',
			subtitle: null,
			description: null,
			locationId: DEFAULT_LOCATION_ID,
			typeIds: ['in-ground'],
			status: 'planned',
			isClosed: false,
			startDate: null,
			endDate: null,
			notes: null,
			icon: null,
			color: null,
			thumbnailMediaId: null,
			layoutMediaId: null,
			createdAt: CREATED,
			updatedAt: CREATED,
		});
		expect(await gardens.getById(garden.id)).toEqual(garden);
		expect(navigate).toHaveBeenCalledOnce();
		expect(navigate).toHaveBeenCalledWith(`/gardens/${garden.id}`);
		expect(QUICK_START_TYPE_IDS).toEqual(['in-ground']);
	});

	it.each(['', '   ', '\n\t'])('rejects a blank name before persistence: %j', async (name) => {
		const onNameError = vi.fn();
		const result = await submitter({ onNameError })(name);
		expect(result).toBeNull();
		expect(onNameError).toHaveBeenLastCalledWith('Enter a Garden name.');
		expect(await gardens.list()).toEqual([]);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('allows intentional duplicate names while assigning independent UUIDs', async () => {
		const submit = submitter();
		const first = await submit('Same Name');
		const second = await submit('Same Name');
		expect(second.id).not.toBe(first.id);
		expect((await gardens.list()).map(({ name }) => name)).toEqual(['Same Name', 'Same Name']);
	});

	it('blocks rapid duplicate submissions while the first save is pending', async () => {
		let finish;
		const pending = new Promise((resolve) => { finish = resolve; });
		const createGarden = vi.fn(() => pending);
		const onSaving = vi.fn();
		const submit = submitter({ createGarden, onSaving });

		const first = submit('Garden');
		const duplicate = submit('Garden');
		expect(createGarden).toHaveBeenCalledOnce();
		expect(await duplicate).toBeNull();
		finish({ id: '550e8400-e29b-41d4-a716-446655440001' });
		await first;
		expect(onSaving.mock.calls.map(([value]) => value)).toEqual([true, false]);
	});

	it('preserves the submitted name after failure and permits a retry', async () => {
		const createGarden = vi.fn()
			.mockRejectedValueOnce(new Error('simulated storage failure'))
			.mockImplementation((input) => gardens.create(input));
		const onSaveError = vi.fn();
		const submit = submitter({ createGarden, onSaveError });

		expect(await submit('Retry Garden')).toBeNull();
		expect(onSaveError).toHaveBeenLastCalledWith(expect.stringContaining('try again'));
		expect(navigate).not.toHaveBeenCalled();
		const garden = await submit('Retry Garden');
		expect(garden.name).toBe('Retry Garden');
		expect(createGarden).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenCalledWith(`/gardens/${garden.id}`);
	});
});
