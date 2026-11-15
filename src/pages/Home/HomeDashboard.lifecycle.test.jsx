import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	effects: [],
	setters: [],
	gardenList: vi.fn(),
	list: vi.fn(),
}));

vi.mock('../../components/CardCarousel.jsx', () => ({ CardCarousel: () => null }));
vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: { gardens: {}, listItems: {} } }),
}));
vi.mock('../../services/gardens.js', () => ({
	createGardensService: () => ({ list: harness.gardenList }),
}));
vi.mock('../../services/listItems.js', () => ({
	createListItemsService: () => ({ list: harness.list }),
}));
vi.mock('preact/hooks', () => ({
	useMemo: (factory) => factory(),
	useRef: (initial) => ({ current: initial }),
	useEffect: (effect) => harness.effects.push(effect),
	useState: (initial) => {
		const setter = vi.fn();
		harness.setters.push(setter);
		return [initial, setter];
	},
}));

import { HomeDashboard } from './HomeDashboard.jsx';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
	harness.effects = [];
	harness.setters = [];
	harness.gardenList.mockReset();
	harness.list.mockReset();
});

describe('HomeDashboard loading lifecycle', () => {
	it('loads each service independently and retries only the failed section', async () => {
		harness.gardenList.mockResolvedValue([]);
		harness.list.mockImplementation((kind) => {
			if (kind === 'task' && harness.list.mock.calls.filter(([value]) => value === 'task').length === 1) {
				return Promise.reject(new Error('task read failed'));
			}
			return Promise.resolve([]);
		});
		const tree = HomeDashboard();
		const cleanup = harness.effects[0]();
		await settle();

		expect(harness.gardenList).toHaveBeenCalledOnce();
		expect(harness.list.mock.calls).toEqual([['task'], ['wishlist']]);
		expect(harness.setters[0]).toHaveBeenLastCalledWith({ status: 'ready', current: [], previous: [] });
		expect(harness.setters[1]).toHaveBeenLastCalledWith({ status: 'error', items: [] });
		expect(harness.setters[2]).toHaveBeenLastCalledWith({ status: 'ready', items: [] });

		await tree.props.retryTasks();
		expect(harness.list.mock.calls).toEqual([['task'], ['wishlist'], ['task']]);
		expect(harness.setters[1]).toHaveBeenLastCalledWith({ status: 'ready', items: [] });
		cleanup();
	});

	it('ignores asynchronous responses after unmount', async () => {
		let resolveGardens;
		let resolveTask;
		let resolveWishlist;
		harness.gardenList.mockReturnValue(new Promise((resolve) => { resolveGardens = resolve; }));
		harness.list.mockImplementation((kind) => new Promise((resolve) => {
			if (kind === 'task') resolveTask = resolve;
			else resolveWishlist = resolve;
		}));
		HomeDashboard();
		const cleanup = harness.effects[0]();
		cleanup();
		resolveGardens([]);
		resolveTask([]);
		resolveWishlist([]);
		await settle();

		for (const setter of harness.setters) {
			expect(setter).toHaveBeenCalledTimes(1);
		}
	});
});
