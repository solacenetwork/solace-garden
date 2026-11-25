import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	query: {},
	stateValues: [],
	setters: [],
	stateIndex: 0,
	effects: [],
	service: {
		list: vi.fn(async () => []),
		create: vi.fn(),
		update: vi.fn(),
		remove: vi.fn(),
	},
}));

vi.mock('preact-iso', () => ({ useLocation: () => ({ query: harness.query }) }));
vi.mock('../../context/StorageContext.jsx', () => ({ useStorage: () => ({ repositories: { locations: {} } }) }));
vi.mock('../../services/locations.js', () => ({ createLocationsService: () => harness.service }));
vi.mock('preact/hooks', () => ({
	useCallback: (callback) => callback,
	useEffect: (effect) => { harness.effects.push(effect); },
	useMemo: (factory) => factory(),
	useRef: (initial) => ({ current: initial }),
	useState(initial) {
		const index = harness.stateIndex++;
		const fallback = typeof initial === 'function' ? initial() : initial;
		const value = index in harness.stateValues ? harness.stateValues[index] : fallback;
		const setter = vi.fn();
		harness.setters[index] = setter;
		return [value, setter];
	},
}));

import { ValidationError } from '../../storage/errors.js';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Locations, revealLocationField } from './index.jsx';

const CUSTOM = { id: 'custom-location', name: 'Community Plot', hardinessZone: '7b', isSystemDefault: false };

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (node.type === PageHeader) return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

function render(overrides = {}) {
	harness.stateIndex = 0;
	harness.effects = [];
	harness.setters = [];
	harness.stateValues = [
		{ status: 'ready', items: [CUSTOM] },
		{ name: 'Retained name', hardinessZone: '7B' },
		null,
		null,
		null,
		false,
		'',
		{ name: '', hardinessZone: '' },
		{ name: '', hardinessZone: '' },
		0,
	];
	for (const [index, value] of Object.entries(overrides)) harness.stateValues[Number(index)] = value;
	return Locations();
}

beforeEach(() => {
	harness.query = {};
	harness.service.list.mockReset().mockResolvedValue([]);
	harness.service.create.mockReset().mockResolvedValue({});
	harness.service.update.mockReset().mockResolvedValue(true);
	harness.service.remove.mockReset().mockResolvedValue(true);
});

afterEach(() => vi.unstubAllGlobals());

describe('Geographic Locations page', () => {
	it('renders the approved title, safe default return, and required create fields', () => {
		const tree = render();
		const returnLink = nodes(tree).find((node) => node.props?.class === 'btn-outline locations-page__return');
		const name = nodes(tree).find((node) => node.props?.id === 'new-location-name');
		const zone = nodes(tree).find((node) => node.props?.id === 'new-location-zone');

		expect(nodes(tree).find((node) => node.type === 'h1').props.id).toBe('locations-title');
		expect(nodes(tree).some((node) => node === 'Geographic Locations')).toBe(true);
		expect(returnLink.props).toMatchObject({ href: '/settings' });
		expect(name.props).toMatchObject({ required: true, disabled: false, value: 'Retained name' });
		expect(zone.props).toMatchObject({ disabled: false, value: '7B', 'aria-describedby': 'locations-zone-help' });
	});

	it('preserves nested Settings and Gardens return destinations', () => {
		harness.query = { ref: 'settings', settingsRef: 'notes' };
		let returnLink = nodes(render()).find((node) => node.props?.class === 'btn-outline locations-page__return');
		expect(returnLink.props.href).toBe('/settings?ref=notes');

		harness.query = { ref: 'gardens', settingsRef: 'https://example.com' };
		returnLink = nodes(render()).find((node) => node.props?.class === 'btn-outline locations-page__return');
		expect(returnLink.props.href).toBe('/gardens');
	});

	it('associates field errors and locks every conflicting control while persistence is pending', () => {
		const tree = render({
			4: CUSTOM.id,
			7: { name: 'Enter a Location name.', hardinessZone: '' },
		});
		const name = nodes(tree).find((node) => node.props?.id === 'new-location-name');
		const controls = nodes(tree).filter((node) => ['input', 'button'].includes(node.type));

		expect(name.props).toMatchObject({
			'aria-invalid': 'true',
			'aria-describedby': 'new-location-name-error',
			disabled: true,
		});
		expect(nodes(tree).find((node) => node.props?.id === 'new-location-name-error').props.class)
			.toBe('invalid-feedback');
		expect(controls.every(({ props }) => props.disabled === true)).toBe(true);
		expect(tree.props['aria-busy']).toBe('true');
	});

	it('retains entered values, maps service validation to the field, and suppresses duplicate submits', async () => {
		let rejectCreate;
		harness.service.create.mockImplementation(() => new Promise((_resolve, reject) => { rejectCreate = reject; }));
		const tree = render();
		const form = nodes(tree).find((node) => node.props?.class === 'locations-form');
		const first = form.props.onSubmit({ preventDefault: vi.fn() });
		const second = form.props.onSubmit({ preventDefault: vi.fn() });

		expect(harness.service.create).toHaveBeenCalledOnce();
		expect(harness.service.create).toHaveBeenCalledWith({ name: 'Retained name', hardinessZone: '7B' });
		rejectCreate(new ValidationError('INVALID_LOCATION_NAME', 'Location name is required.', { field: 'name' }));
		await Promise.all([first, second]);

		expect(harness.setters[7]).toHaveBeenCalledWith({ name: 'Location name is required.', hardinessZone: '' });
		expect(harness.setters[1]).not.toHaveBeenCalledWith({ name: '', hardinessZone: '' });
		expect(harness.setters[9]).toHaveBeenCalledOnce();
	});

	it('focuses the edit name after rendering an editor and restores the Edit control on Cancel', () => {
		const editNameFocus = vi.fn();
		const editButtonFocus = vi.fn();
		vi.stubGlobal('requestAnimationFrame', (callback) => { callback(); return 1; });
		vi.stubGlobal('document', {
			getElementById: vi.fn((id) => id === `location-name-${CUSTOM.id}`
				? { focus: editNameFocus }
				: { focus: editButtonFocus }),
		});
		const tree = render({ 2: CUSTOM.id, 3: { name: CUSTOM.name, hardinessZone: CUSTOM.hardinessZone } });
		harness.effects[1]();
		expect(editNameFocus).toHaveBeenCalledOnce();

		const cancel = nodes(tree).find((node) => node.type === 'button' && node.props?.children === 'Cancel');
		cancel.props.onClick();
		expect(editButtonFocus).toHaveBeenCalledOnce();
	});
});

describe('Location feedback focus', () => {
	it('reveals offscreen described feedback and focuses the field without a second scroll', () => {
		const focus = vi.fn();
		const scrollIntoView = vi.fn();
		const field = {
			getAttribute: () => 'location-error',
			getBoundingClientRect: () => ({ top: 900, bottom: 940 }),
			focus,
			scrollIntoView,
		};
		const documentObject = {
			documentElement: { clientHeight: 700 },
			getElementById: () => ({ getBoundingClientRect: () => ({ top: 945, bottom: 980 }) }),
			querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 64 }) }),
		};
		const viewport = { innerHeight: 700, matchMedia: () => ({ matches: true }) };

		expect(revealLocationField(field, { documentObject, viewport })).toBe(true);
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center', inline: 'nearest' });
		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
	});
});
