import { beforeEach, describe, expect, it, vi } from 'vitest';

const context = vi.hoisted(() => ({
	query: { ref: 'notes' },
	preference: 'auto',
	effectiveMode: 'simple',
	storageAvailable: true,
	setPreference: vi.fn(),
}));

vi.mock('preact-iso', () => ({ useLocation: () => ({ query: context.query }) }));
vi.mock('../../context/InterfaceModeContext.jsx', () => ({
	useInterfaceMode: () => ({
		preference: context.preference,
		effectiveMode: context.effectiveMode,
		storageAvailable: context.storageAvailable,
		setPreference: context.setPreference,
	}),
}));

import { Settings } from './index.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	return [node, ...nodes(node.props?.children)];
}

function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ').replace(/\s+/g, ' ').trim();
}

beforeEach(() => {
	context.query = { ref: 'notes' };
	context.preference = 'auto';
	context.effectiveMode = 'simple';
	context.storageAvailable = true;
	context.setPreference.mockReset();
});

describe('Settings page', () => {
	it('uses the approved interface-mode terminology without changing stored values', () => {
		const tree = Settings();
		const radios = nodes(tree).filter((node) => node.props?.name === 'interface-mode');
		const labels = nodes(tree).filter((node) => node.type === 'label').map(text);

		expect(radios.map(({ props }) => [props.value, props.checked])).toEqual([
			['auto', true], ['simple', false], ['standard', false],
		]);
		expect(labels).toEqual([
			'Automatic Automatically adapt the interface to your screen size.',
			'Simple Mode A simplified, card-based navigation experience.',
			'Standard Mode Full workspace navigation adapted to your screen size.',
		]);
		expect(text(tree)).not.toMatch(/desktop-only|desktop-oriented/i);

		radios[2].props.onChange({ currentTarget: { value: 'standard' } });
		expect(context.setPreference).toHaveBeenCalledWith('standard');
	});

	it('reports the effective mode and storage failure without hiding the controls', () => {
		context.preference = 'standard';
		context.effectiveMode = 'standard';
		context.storageAvailable = false;
		const tree = Settings();

		expect(text(nodes(tree).find((node) => node.props?.class === 'settings-mode-status')))
			.toContain('Currently showing Standard Mode');
		expect(nodes(tree).find((node) => node.props?.class === 'settings-storage-warning').props.role)
			.toBe('status');
		expect(nodes(tree).filter((node) => node.props?.name === 'interface-mode')).toHaveLength(3);
	});

	it('preserves Close and nested Geographic Locations context', () => {
		const links = nodes(Settings()).filter((node) => node.type === 'a');
		expect(links.map(({ props }) => props.href)).toEqual([
			'/notes',
			'/locations?ref=settings&settingsRef=notes',
		]);

		context.query = {};
		const directLinks = nodes(Settings()).filter((node) => node.type === 'a');
		expect(directLinks.map(({ props }) => props.href)).toEqual([
			'/',
			'/locations?ref=settings&settingsRef=home',
		]);
	});
});
