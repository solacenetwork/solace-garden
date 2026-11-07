import { describe, expect, it } from 'vitest';
import { updateItemCompletion } from './completionState.js';

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
