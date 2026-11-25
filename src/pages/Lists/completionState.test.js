import { describe, expect, it } from 'vitest';
import {
	deriveListCollections,
	reconstructListOrder,
	updateItemCompletion,
} from './completionState.js';

const ITEMS = [
	{ id: 'task-one', kind: 'task', text: 'Water seedlings', completed: false },
	{ id: 'task-two', kind: 'task', text: 'Turn compost', completed: false },
	{ id: 'wish-one', kind: 'wishlist', text: 'Row cover', completed: false },
];

function completion(items, id) {
	return items.find((item) => item.id === id).completed;
}

describe('Lists completion state', () => {
	it('supports repeated complete and incomplete transitions', () => {
		let items = ITEMS;

		items = updateItemCompletion(items, 'task-one', true);
		expect(completion(items, 'task-one')).toBe(true);

		items = updateItemCompletion(items, 'task-one', false);
		expect(completion(items, 'task-one')).toBe(false);

		items = updateItemCompletion(items, 'task-one', true);
		items = updateItemCompletion(items, 'task-one', false);
		expect(completion(items, 'task-one')).toBe(false);
	});

	describe('Lists presentation collections', () => {
		const items = [
			{ id: 'A', completed: false },
			{ id: 'B', completed: true },
			{ id: 'C', completed: false },
			{ id: 'D', completed: true },
		];

		it('derives outstanding and completed collections without reordering', () => {
			expect(deriveListCollections(items)).toEqual({
				outstanding: [items[0], items[2]],
				completed: [items[1], items[3]],
			});
		});

		it('reconstructs a complete order while preserving the other collection', () => {
			const reorderedOutstanding = [items[2], items[0]];
			expect(reconstructListOrder(items, 'outstanding', reorderedOutstanding).map(({ id }) => id))
				.toEqual(['C', 'B', 'A', 'D']);

			const reorderedCompleted = [items[3], items[1]];
			expect(reconstructListOrder(items, 'completed', reorderedCompleted).map(({ id }) => id))
				.toEqual(['A', 'D', 'C', 'B']);
		});

		it('treats completion changes as collection moves without changing order', () => {
			const reopened = updateItemCompletion(items, 'B', false);
			expect(reopened.map(({ id }) => id)).toEqual(['A', 'B', 'C', 'D']);
			expect(deriveListCollections(reopened).outstanding.map(({ id }) => id)).toEqual(['A', 'B', 'C']);
			expect(deriveListCollections(reopened).completed.map(({ id }) => id)).toEqual(['D']);
		});

		it('enforces collection boundaries through pure reconstruction', () => {
			expect(reconstructListOrder(items, 'outstanding', [items[0], items[2]]).map(({ id }) => id))
				.toEqual(['A', 'B', 'C', 'D']);
			expect(reconstructListOrder(items, 'completed', [items[1], items[3]]).map(({ id }) => id))
				.toEqual(['A', 'B', 'C', 'D']);
		});
	});

	it('updates independent items without changing their neighbors', () => {
		let items = updateItemCompletion(ITEMS, 'task-one', true);
		items = updateItemCompletion(items, 'task-two', true);
		items = updateItemCompletion(items, 'task-one', false);

		expect(completion(items, 'task-one')).toBe(false);
		expect(completion(items, 'task-two')).toBe(true);
		expect(completion(items, 'wish-one')).toBe(false);
	});

	it('uses the same transitions for purchased Wish List items', () => {
		let items = updateItemCompletion(ITEMS, 'wish-one', true);
		expect(completion(items, 'wish-one')).toBe(true);

		items = updateItemCompletion(items, 'wish-one', false);
		expect(completion(items, 'wish-one')).toBe(false);
		expect(completion(items, 'task-one')).toBe(false);
	});
});
