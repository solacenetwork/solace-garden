import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
	path: '/tasks',
	url: '/tasks',
	slots: [],
	index: 0,
	effects: [],
	cleanups: [],
	services: null,
	sortables: [],
}));

vi.mock('preact-iso', () => ({ useLocation: () => ({ path: hooks.path, url: hooks.url }) }));
vi.mock('sortablejs', () => ({
	default: class {
		constructor(element, options) {
			this.element = element;
			this.options = options;
			this.sort = vi.fn();
			this.destroy = vi.fn();
			hooks.sortables.push(this);
		}
	},
}));
vi.mock('../../context/StorageContext.jsx', () => ({
	useStorage: () => ({ repositories: {} }),
}));
vi.mock('../../services/gardens.js', () => ({
	createGardensService: () => hooks.services.gardens,
}));
vi.mock('../../services/locations.js', () => ({
	createLocationsService: () => hooks.services.locations,
}));
vi.mock('../../services/listItems.js', () => ({
	createListItemsService: () => hooks.services.lists,
	resolveListKind: (path) => path === '/wishlist' ? 'wishlist' : 'task',
}));
vi.mock('preact/hooks', () => ({
	useRef(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
		return hooks.slots[index];
	},
	useMemo(factory) { return factory(); },
	useCallback(callback) { return callback; },
	useEffect(effect) { hooks.effects.push(effect); },
	useState(initial) {
		const index = hooks.index++;
		if (!(index in hooks.slots)) {
			hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
		}
		return [hooks.slots[index], (next) => {
			hooks.slots[index] = typeof next === 'function' ? next(hooks.slots[index]) : next;
		}];
	},
}));

import { ValidationError } from '../../storage/errors.js';
import { LIST_ACCORDION_STORAGE_KEY } from '../../services/listAccordionPreference.js';
import { Lists, revealListField } from './index.jsx';

function nodes(node) {
	if (node == null || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

function nodeText(node) {
	if (node == null || typeof node === 'boolean') return '';
	if (Array.isArray(node)) return node.map(nodeText).join('');
	if (typeof node !== 'object') return String(node);
	return nodeText(node.props?.children);
}

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function createServices({
	items = [],
	list = vi.fn(async () => items),
	create = vi.fn(async (kind, input) => ({ id: 'new-item', kind, ...input })),
	update = vi.fn(async () => true),
	remove = vi.fn(async () => true),
	setCompleted = vi.fn(async () => true),
	reorder = vi.fn(async (kind, ids) => ids.map((id, sortOrder) => ({
		...items.find((item) => item.id === id),
		sortOrder,
	}))),
	gardens = vi.fn(async () => []),
	locations = vi.fn(async () => []),
} = {}) {
	const services = {
		lists: { list, create, update, remove, setCompleted, reorder },
		gardens: { list: gardens },
		locations: { list: locations },
	};
	hooks.services = services;
	return services;
}

function render() {
	hooks.index = 0;
	hooks.effects = [];
	return Lists();
}

function find(tree, predicate) {
	return nodes(tree).find(predicate);
}

function input(tree, id) {
	return find(tree, (node) => node.type === 'input' && node.props.id === id);
}

function button(tree, label) {
	return find(tree, (node) => node.type === 'button' && nodeText(node).trim() === label);
}

function makeElement({ itemCount = 0 } = {}) {
	return {
		querySelectorAll: vi.fn(() => Array.from({ length: itemCount }, () => ({}))),
		focus: vi.fn(),
		scrollIntoView: vi.fn(),
		getAttribute: vi.fn(() => ''),
		getBoundingClientRect: vi.fn(() => ({ top: 10, bottom: 30 })),
		closest: vi.fn(() => null),
		hidden: false,
	};
}

function stubDocument() {
	const elements = new Map();
	const documentObject = {
		getElementById: vi.fn((id) => elements.get(id) ?? null),
		querySelectorAll: vi.fn(() => []),
		querySelector: vi.fn(() => null),
		documentElement: { clientHeight: 800 },
	};
	vi.stubGlobal('document', documentObject);
	vi.stubGlobal('requestAnimationFrame', (callback) => {
		callback();
		return 1;
	});
	return {
		documentObject,
		add(id, element = makeElement()) {
			elements.set(id, element);
			return element;
		},
	};
}

async function flushPromises() {
	for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function runEffect(index) {
	hooks.cleanups[index]?.();
	const cleanup = hooks.effects[index]?.();
	hooks.cleanups[index] = cleanup;
}

function bindLists(tree, itemCount = 2) {
	for (const list of nodes(tree).filter((node) =>
		node.type === 'ol' && node.props.class === 'lists-list',
	)) {
		const rows = Array.isArray(list.props.children)
			? list.props.children.length
			: list.props.children ? 1 : 0;
		list.ref.current = makeElement({ itemCount: rows || itemCount });
	}
}

async function initialize() {
	let tree = render();
	runEffect(0);
	runEffect(1);
	runEffect(2);
	await flushPromises();
	tree = render();
	bindLists(tree);
	runEffect(3);
	return tree;
}

beforeEach(() => {
	hooks.path = '/tasks';
	hooks.url = '/tasks';
	hooks.slots = [];
	hooks.index = 0;
	hooks.effects = [];
	hooks.cleanups = [];
	hooks.sortables = [];
	createServices();
	vi.stubGlobal('confirm', vi.fn(() => true));
	const storage = new Map();
	vi.stubGlobal('localStorage', {
		getItem: vi.fn((key) => storage.get(key) ?? null),
		setItem: vi.fn((key, value) => storage.set(key, value)),
		removeItem: vi.fn((key) => storage.delete(key)),
	});
	stubDocument();
});

describe('Lists quick-add focus requests', () => {
	it.each(['/tasks', '/wishlist'])('focuses the existing field on %s fragment navigation', (path) => {
		hooks.path = path;
		hooks.url = `${path}#lists-quick-text`;
		const tree = render();
		const focus = vi.fn();
		stubDocument().add('lists-quick-text', { ...makeElement(), focus });
		hooks.effects[1]();
		expect(focus).toHaveBeenCalledOnce();
	});

	it('does not steal focus during ordinary list visits', () => {
		render();
		expect(stubDocument().documentObject.getElementById).not.toHaveBeenCalled();
	});

	it('waits until a reused route enables Quick Add', () => {
		hooks.path = '/wishlist';
		hooks.url = '/wishlist#lists-quick-text';
		hooks.slots = Array.from({ length: 8 }, () => ({ current: null }));
		hooks.slots[6] = { current: true };
		hooks.slots[7] = { current: { kind: 'task', epoch: 0 } };
		hooks.slots[8] = { kind: 'task', status: 'loading', items: [] };
		const tree = render();
		expect(input(tree, 'lists-quick-text').props.disabled).toBe(true);
	});
});

describe('Lists operation recovery', () => {
	it('keeps the empty state distinct from the all-completed state', async () => {
		let tree = await initialize();
		expect(nodeText(tree)).toContain('No Tasks yet');
		expect(nodes(tree).some((node) => node.type === 'details')).toBe(false);

		createServices({
			items: [{ id: 'done', text: 'Finished', completed: true, sortOrder: 0 }],
		});
		hooks.slots = [];
		hooks.cleanups = [];
		tree = await initialize();
		expect(nodeText(tree)).toContain('No outstanding items');
		expect(find(tree, (node) => node.type === 'summary')?.props.id).toBe('lists-completed-summary-task');
	});

	it('prevents duplicate Quick Add submissions and destroys active Sortable instances', async () => {
		const createGate = deferred();
		const services = createServices({
			items: [
				{ id: 'one', text: 'One', completed: false, sortOrder: 0 },
				{ id: 'two', text: 'Two', completed: false, sortOrder: 1 },
			],
			create: vi.fn(() => createGate.promise),
		});
		const tree = await initialize();
		const quickField = input(tree, 'lists-quick-text');
		quickField.props.onInput({ currentTarget: { value: 'Water seedlings' } });
		const form = find(render(), (node) => node.type === 'form' && node.props.class === 'lists-quick-add');
		const activeSortable = hooks.sortables.at(-1);
		const event = { preventDefault: vi.fn() };
		const pending = form.props.onSubmit(event);
		await form.props.onSubmit(event);

		expect(services.lists.create).toHaveBeenCalledTimes(1);
		expect(activeSortable.sort).toHaveBeenCalledWith(['one', 'two'], false);
		expect(activeSortable.destroy).toHaveBeenCalledOnce();
		createGate.resolve({ id: 'new-item' });
		await pending;
	});

	it('restores completion state and focus after a failed persistence', async () => {
		const item = { id: 'task-1', text: 'Water', completed: false, sortOrder: 0 };
		const services = createServices({
			items: [item],
			setCompleted: vi.fn(async () => { throw new Error('write failed'); }),
		});
		let tree = await initialize();
		const focus = makeElement();
		stubDocument().add('list-check-task-1', focus);
		let checkbox = input(tree, 'list-check-task-1');
		checkbox.props.onChange({ currentTarget: { checked: true } });
		await flushPromises();
		tree = render();

		expect(services.lists.setCompleted).toHaveBeenCalledOnce();
		expect(input(tree, 'list-check-task-1').props.checked).toBe(false);
		expect(nodes(tree).some((node) => node.props?.role === 'alert')).toBe(true);
		expect(focus.focus).toHaveBeenCalled();
	});

	it('restores authoritative order and DOM after a rejected drag reorder', async () => {
		const items = [
			{ id: 'one', text: 'One', completed: false, sortOrder: 0 },
			{ id: 'two', text: 'Two', completed: false, sortOrder: 1 },
		];
		const reorderGate = deferred();
		const services = createServices({
			items,
			reorder: vi.fn(() => reorderGate.promise),
		});
		let tree = await initialize();
		const sortable = hooks.sortables.at(-1);
		expect(sortable.options.dataIdAttr).toBe('data-list-item-id');
		sortable.options.onEnd({ oldIndex: 0, newIndex: 1 });
		expect(sortable.sort).toHaveBeenCalledWith(['one', 'two'], false);
		expect(sortable.destroy).toHaveBeenCalledOnce();
		expect(services.lists.reorder).toHaveBeenCalledWith('task', ['two', 'one']);
		reorderGate.reject(new Error('write failed'));
		await flushPromises();
		tree = render();

		expect(nodes(tree).filter((node) => node.props?.['data-list-item']).map(nodeText))
			.toEqual(expect.arrayContaining([expect.stringContaining('One'), expect.stringContaining('Two')]));
		expect(hooks.slots[8].items.map(({ id }) => id)).toEqual(['one', 'two']);
	});

	it('recovers the stored order when reorder resolves unsuccessfully', async () => {
		const items = [
			{ id: 'one', text: 'One', completed: false, sortOrder: 0 },
			{ id: 'two', text: 'Two', completed: false, sortOrder: 1 },
		];
		createServices({ items, reorder: vi.fn(async () => false) });
		await initialize();
		const sortable = hooks.sortables.at(-1);
		sortable.options.onEnd({ oldIndex: 0, newIndex: 1 });
		await flushPromises();

		expect(hooks.slots[8].items.map(({ id }) => id)).toEqual(['one', 'two']);
		expect(sortable.sort).toHaveBeenCalledWith(['one', 'two'], false);
	});

	it('prevents a second Save while the first edit persistence is pending', async () => {
		const item = { id: 'task-1', text: 'Water', completed: false, sortOrder: 0 };
		const updateGate = deferred();
		const services = createServices({
			items: [item],
			update: vi.fn(() => updateGate.promise),
		});
		let tree = await initialize();
		find(tree, (node) => node.type === 'button' && node.props.id === 'list-edit-task-1').props.onClick();
		tree = render();
		const editForm = find(tree, (node) => node.type === 'form' && node.props.class === 'lists-edit');
		const submitting = editForm.props.onSubmit({ preventDefault: vi.fn() });
		await editForm.props.onSubmit({ preventDefault: vi.fn() });

		expect(services.lists.update).toHaveBeenCalledTimes(1);
		updateGate.resolve(true);
		await submitting;
	});

	it('shows a retryable load error instead of the empty-list state', async () => {
		const services = createServices({
			list: vi.fn(async () => { throw new Error('offline'); }),
		});
		let tree = await initialize();

		expect(nodeText(tree)).toContain('Unable to load Tasks');
		expect(nodeText(tree)).not.toContain('No Tasks yet');
		expect(input(tree, 'lists-quick-text').props.disabled).toBe(true);
		expect(button(tree, 'Retry')).toBeTruthy();

		services.lists.list.mockResolvedValueOnce([]);
		button(tree, 'Retry').props.onClick();
		await flushPromises();
		tree = render();
		expect(nodeText(tree)).toContain('No Tasks yet');
	});
});

describe('Lists route and accordion safety', () => {
	it('ignores a stale Tasks load after navigating to Wish List', async () => {
		const taskLoad = deferred();
		const wishLoad = deferred();
		const services = createServices({
			list: vi.fn((kind) => kind === 'task' ? taskLoad.promise : wishLoad.promise),
		});
		let tree = render();
		runEffect(0);
		runEffect(2);
		hooks.path = '/wishlist';
		tree = render();
		runEffect(2);
		wishLoad.resolve([{ id: 'wish', text: 'Seeds', completed: false, sortOrder: 0 }]);
		await flushPromises();
		taskLoad.resolve([{ id: 'task', text: 'Water', completed: false, sortOrder: 0 }]);
		await flushPromises();
		tree = render();

		expect(services.lists.list).toHaveBeenCalledWith('task');
		expect(services.lists.list).toHaveBeenCalledWith('wishlist');
		expect(hooks.slots[8]).toMatchObject({ kind: 'wishlist', status: 'ready' });
		expect(nodeText(tree)).toContain('Seeds');
		expect(nodeText(tree)).not.toContain('Water');
	});

	it('ignores operation reloads and focus requests after a route change', async () => {
		const createGate = deferred();
		const services = createServices({ create: vi.fn(() => createGate.promise) });
		let tree = await initialize();
		const focus = makeElement();
		stubDocument().add('lists-quick-text', focus);
		input(tree, 'lists-quick-text').props.onInput({ currentTarget: { value: 'Task from old route' } });
		tree = render();
		const form = find(tree, (node) => node.type === 'form' && node.props.class === 'lists-quick-add');
		const adding = form.props.onSubmit({ preventDefault: vi.fn() });

		hooks.path = '/wishlist';
		tree = render();
		runEffect(2);
		await flushPromises();
		createGate.resolve({ id: 'task-new' });
		await adding;

		expect(services.lists.list).toHaveBeenCalledTimes(2);
		expect(services.lists.list.mock.calls.map(([kind]) => kind)).toEqual(['task', 'wishlist']);
		expect(focus.focus).not.toHaveBeenCalled();
		expect(hooks.slots[8]).toMatchObject({ kind: 'wishlist', status: 'ready' });
	});

	it('does not apply pending load results after component unmount', async () => {
		const gate = deferred();
		createServices({ list: vi.fn(() => gate.promise) });
		render();
		runEffect(0);
		runEffect(2);
		const previousState = hooks.slots[8];
		hooks.cleanups[0]?.();
		gate.resolve([]);
		await flushPromises();

		expect(hooks.slots[8]).toBe(previousState);
	});

	it('does not show a stale operation error after route navigation', async () => {
		const createGate = deferred();
		const services = createServices({ create: vi.fn(() => createGate.promise) });
		let tree = await initialize();
		input(tree, 'lists-quick-text').props.onInput({ currentTarget: { value: 'Task from old route' } });
		tree = render();
		const form = find(tree, (node) => node.type === 'form' && node.props.class === 'lists-quick-add');
		const adding = form.props.onSubmit({ preventDefault: vi.fn() });

		hooks.path = '/wishlist';
		tree = render();
		runEffect(2);
		await flushPromises();
		createGate.reject(new Error('old Tasks operation failed'));
		await adding;
		tree = render();

		expect(services.lists.list.mock.calls.map(([kind]) => kind)).toEqual(['task', 'wishlist']);
		expect(nodes(tree).some((node) => node.props?.role === 'alert')).toBe(false);
		expect(hooks.slots[8]).toMatchObject({ kind: 'wishlist', status: 'ready' });
	});

	it('persists only the active route accordion toggle', async () => {
		createServices({
			items: [{ id: 'done', text: 'Finished', completed: true, sortOrder: 0 }],
		});
		const tree = await initialize();
		const accordion = nodes(tree).find((node) => node.type === 'details');
		expect(accordion.props.open).toBe(false);
		accordion.props.onToggle({ currentTarget: { open: true } });
		expect(JSON.parse(localStorage.getItem(LIST_ACCORDION_STORAGE_KEY))).toEqual({
			task: true,
			wishlist: false,
		});

		const staleToggle = accordion.props.onToggle;
		hooks.path = '/wishlist';
		render();
		staleToggle({ currentTarget: { open: false } });
		expect(JSON.parse(localStorage.getItem(LIST_ACCORDION_STORAGE_KEY))).toEqual({
			task: true,
			wishlist: false,
		});
	});

	it('focuses the visible accordion summary when completion collapses the item', async () => {
		const item = { id: 'task-1', text: 'Water', completed: false, sortOrder: 0 };
		const services = createServices({ items: [item] });
		const tree = await initialize();
		const focus = makeElement();
		stubDocument().add('lists-completed-summary-task', focus);
		input(tree, 'list-check-task-1').props.onChange({ currentTarget: { checked: true } });
		await flushPromises();

		expect(services.lists.setCompleted).toHaveBeenCalledWith('task-1', true);
		expect(focus.focus).toHaveBeenCalledOnce();
	});

	it('focuses the reopened checkbox in the outstanding collection', async () => {
		const item = { id: 'task-1', text: 'Water', completed: true, sortOrder: 0 };
		const services = createServices({ items: [item] });
		const openPreferences = { task: true, wishlist: false };
		localStorage.setItem(LIST_ACCORDION_STORAGE_KEY, JSON.stringify(openPreferences));
		const tree = await initialize();
		const focus = makeElement();
		stubDocument().add('list-check-task-1', focus);
		input(tree, 'list-check-task-1').props.onChange({ currentTarget: { checked: false } });
		await flushPromises();

		expect(services.lists.setCompleted).toHaveBeenCalledWith('task-1', false);
		expect(focus.focus).toHaveBeenCalledOnce();
	});
});

describe('Lists validation feedback and reveal behavior', () => {
	it('shows Quick Add validation and preserves the submitted value', async () => {
		const services = createServices({
			create: vi.fn(async () => {
				throw new ValidationError('INVALID_LIST_ITEM_TEXT', 'Item text is required.', { field: 'text' });
			}),
		});
		let tree = await initialize();
		const focus = makeElement();
		stubDocument().add('lists-quick-text', focus);
		input(tree, 'lists-quick-text').props.onInput({ currentTarget: { value: 'Keep my entry' } });
		tree = render();
		const quickForm = find(tree, (node) => node.type === 'form' && node.props.class === 'lists-quick-add');
		await quickForm.props.onSubmit({ preventDefault: vi.fn() });
		tree = render();

		const field = input(tree, 'lists-quick-text');
		expect(services.lists.create).toHaveBeenCalledOnce();
		expect(field.props.value).toBe('Keep my entry');
		expect(field.props['aria-invalid']).toBe('true');
		expect(field.props['aria-describedby']).toBe('lists-quick-text-error');
		expect(nodeText(tree)).toContain('Item text is required.');
		expect(focus.focus).toHaveBeenCalled();

		field.props.onInput({ currentTarget: { value: 'Recovered value' } });
		tree = render();
		expect(input(tree, 'lists-quick-text').props['aria-invalid']).toBeUndefined();
		expect(nodeText(tree)).not.toContain('Item text is required.');
	});

	it('associates Garden validation feedback with its selector and retains edit values', async () => {
		const item = { id: 'task-1', text: 'Water', completed: false, sortOrder: 0 };
		const services = createServices({
			items: [item],
			update: vi.fn(async () => {
				throw new ValidationError('GARDEN_NOT_FOUND', 'The selected garden does not exist.', { field: 'gardenId' });
			}),
		});

		let tree = await initialize();
		find(tree, (node) => node.type === 'button' && node.props.id === 'list-edit-task-1').props.onClick();
		tree = render();
		input(tree, 'list-text-task-1').props.onInput({ currentTarget: { value: 'Keep edited text' } });
		tree = render();
		const editForm = find(tree, (node) => node.type === 'form' && node.props.class === 'lists-edit');
		await editForm.props.onSubmit({ preventDefault: vi.fn() });
		tree = render();

		const selector = find(tree, (node) => node.type === 'select' && node.props.id === 'list-garden-task-1');
		expect(services.lists.update).toHaveBeenCalledOnce();
		expect(input(tree, 'list-text-task-1').props.value).toBe('Keep edited text');
		expect(selector.props.class).toContain('is-invalid');
		expect(selector.props['aria-invalid']).toBe('true');
		expect(selector.props['aria-describedby']).toBe('list-garden-task-1-error');
		const feedback = find(tree, (node) => node.props?.id === 'list-garden-task-1-error');
		expect(nodeText(feedback)).toContain('The selected garden does not exist.');
	});

	it('treats a false delete result as failure and preserves the row', async () => {
		const item = { id: 'task-1', text: 'Water', completed: false, sortOrder: 0 };
		const services = createServices({
			items: [item],
			remove: vi.fn(async () => false),
		});
		const tree = await initialize();
		await button(tree, 'Delete').props.onClick();
		const updated = render();

		expect(services.lists.remove).toHaveBeenCalledWith('task-1');
		expect(nodeText(updated)).toContain('Water');
		expect(nodes(updated).some((node) => node.props?.role === 'alert')).toBe(true);
	});

	it('reveals off-screen fields and focuses them without forcing scroll when visible', () => {
		const field = makeElement();
		field.getBoundingClientRect.mockReturnValue({ top: 900, bottom: 930 });
		const documentObject = {
			getElementById: vi.fn(() => null),
			querySelector: vi.fn(() => null),
			documentElement: { clientHeight: 800 },
		};
		expect(revealListField(field, { documentObject, viewport: { innerHeight: 800 } })).toBe(true);
		expect(field.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
		expect(field.focus).toHaveBeenCalledWith({ preventScroll: true });

		field.scrollIntoView.mockClear();
		field.getBoundingClientRect.mockReturnValue({ top: 100, bottom: 130 });
		revealListField(field, { documentObject, viewport: { innerHeight: 800 } });
		expect(field.scrollIntoView).not.toHaveBeenCalled();
	});
});
