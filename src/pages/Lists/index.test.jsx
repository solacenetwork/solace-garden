import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ path: '/tasks', url: '/tasks', effects: [], oldKind: null }));
vi.mock('preact-iso', () => ({ useLocation: () => ({ path: hooks.path, url: hooks.url }) }));
vi.mock('sortablejs', () => ({ default: class {} }));
vi.mock('../../context/StorageContext.jsx', () => ({ useStorage: () => ({ repositories: {} }) }));
vi.mock('../../services/gardens.js', () => ({ createGardensService: () => ({}) }));
vi.mock('../../services/locations.js', () => ({ createLocationsService: () => ({}) }));
vi.mock('../../services/listItems.js', () => ({
	createListItemsService: () => ({}),
	resolveListKind: (path) => path === '/wishlist' ? 'wishlist' : 'task',
}));
vi.mock('preact/hooks', () => ({
	useRef: (initial) => ({ current: initial }),
	useMemo: (factory) => factory(),
	useCallback: (callback) => callback,
	useEffect: (effect) => { hooks.effects.push(effect); },
	useState(initial) {
		let value = typeof initial === 'function' ? initial() : initial;
		if (value?.kind && hooks.oldKind) value = { ...value, kind: hooks.oldKind };
		return [value, vi.fn()];
	},
}));
import { Lists } from './index.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}
function renderFocusRequest() {
	hooks.effects = [];
	const input = nodes(Lists()).find(({ props }) => props.id === 'lists-quick-text');
	const focus = vi.fn();
	input.ref.current = { focus };
	// The first effect handles the explicit focus request; do not run data loading.
	hooks.effects[0]();
	return { focus, input };
}

beforeEach(() => { hooks.path = '/tasks'; hooks.url = '/tasks'; hooks.oldKind = null; });

describe('Lists quick-add focus requests', () => {
	it.each(['/tasks', '/wishlist'])('focuses the existing field on %s fragment navigation', (path) => {
		hooks.path = path;
		hooks.url = `${path}#lists-quick-text`;
		expect(renderFocusRequest().focus).toHaveBeenCalledOnce();
	});
	it('does not steal focus during ordinary list visits', () => {
		expect(renderFocusRequest().focus).not.toHaveBeenCalled();
	});
	it('waits until the reused list route enables its input', () => {
		hooks.path = '/wishlist';
		hooks.url = '/wishlist#lists-quick-text';
		hooks.oldKind = 'task';
		const pending = renderFocusRequest();
		expect(pending.input.props.disabled).toBe(true);
		expect(pending.focus).not.toHaveBeenCalled();
		hooks.oldKind = null;
		expect(renderFocusRequest().focus).toHaveBeenCalledOnce();
	});
});
