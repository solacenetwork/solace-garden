import { describe, expect, it, vi } from 'vitest';
import {
	prepareGardens,
	prepareRecentItems,
	readGardenPreviews,
	readListPreview,
} from './dashboardData.js';

function garden(id, status, isClosed, updatedAt) {
	return { id, name: id, status, isClosed, updatedAt };
}

describe('Home dashboard data preparation', () => {
	it('groups saved Gardens mutually exclusively and omits non-Garden drafts', () => {
		const records = [
			garden('planned-open', 'planned', false, '2026-11-01T00:00:00.000Z'),
			garden('active-open', 'active', false, '2026-11-02T00:00:00.000Z'),
			garden('planned-closed', 'planned', true, '2026-11-03T00:00:00.000Z'),
			garden('active-closed', 'active', true, '2026-11-04T00:00:00.000Z'),
			garden('completed', 'completed', false, '2026-11-05T00:00:00.000Z'),
			garden('archived', 'archived', true, '2026-11-06T00:00:00.000Z'),
			{ id: 'draft', kind: 'garden', fields: { name: 'Draft' }, updatedAt: '2026-11-07T00:00:00.000Z' },
		];
		const result = prepareGardens(records);

		expect(result.current.map(({ id }) => id)).toEqual(['active-open', 'planned-open']);
		expect(result.previous.map(({ id }) => id)).toEqual([
			'archived', 'completed', 'active-closed', 'planned-closed',
		]);
		expect(new Set([...result.current, ...result.previous].map(({ id }) => id)).size).toBe(6);
		expect(records.map(({ id }) => id)).toEqual([
			'planned-open', 'active-open', 'planned-closed', 'active-closed',
			'completed', 'archived', 'draft',
		]);
	});

	it('orders Gardens by valid updated time and then deterministic ID', () => {
		const result = prepareGardens([
			garden('z', 'planned', false, '2026-11-02T00:00:00.000Z'),
			garden('b', 'active', false, '2026-11-03T00:00:00.000Z'),
			garden('a', 'planned', false, '2026-11-03T00:00:00.000Z'),
			garden('invalid', 'planned', false, 'not-a-date'),
		]);
		expect(result.current.map(({ id }) => id)).toEqual(['a', 'b', 'z', 'invalid']);
	});

	it('selects at most five newest-created items without using manual order or update time', () => {
		const records = Array.from({ length: 7 }, (_, index) => ({
			id: `item-${index}`,
			createdAt: `2026-11-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
			updatedAt: index === 0 ? '2099-01-01T00:00:00.000Z' : '2026-11-10T00:00:00.000Z',
			sortOrder: 100 - index,
			completed: index === 0,
		}));
		expect(prepareRecentItems(records).map(({ id }) => id)).toEqual([
			'item-6', 'item-5', 'item-4', 'item-3', 'item-2',
		]);
		expect(records[0].id).toBe('item-0');
	});

	it('uses ID as the creation-date tie-breaker and returns fewer than five unchanged', () => {
		const records = [
			{ id: 'b', createdAt: '2026-11-01T00:00:00.000Z' },
			{ id: 'a', createdAt: '2026-11-01T00:00:00.000Z' },
		];
		expect(prepareRecentItems(records).map(({ id }) => id)).toEqual(['a', 'b']);
	});

	it('reads only through the Garden and correctly typed List service methods', async () => {
		const gardenList = vi.fn(async () => []);
		const list = vi.fn(async () => []);
		const services = {
			gardens: { list: gardenList, create: vi.fn(), update: vi.fn() },
			lists: { list, create: vi.fn(), update: vi.fn(), setCompleted: vi.fn() },
		};

		await readGardenPreviews(services.gardens);
		await readListPreview(services.lists, 'task');
		await readListPreview(services.lists, 'wishlist');
		expect(gardenList).toHaveBeenCalledOnce();
		expect(list.mock.calls).toEqual([['task'], ['wishlist']]);
		for (const method of ['create', 'update']) {
			expect(services.gardens[method]).not.toHaveBeenCalled();
			expect(services.lists[method]).not.toHaveBeenCalled();
		}
		expect(services.lists.setCompleted).not.toHaveBeenCalled();
	});
});
