import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ query: {}, route: vi.fn() }));

vi.mock('preact-iso', () => ({
	useLocation: () => ({ query: harness.query, route: harness.route }),
}));

vi.mock('preact/hooks', () => ({
	useEffect: (effect) => effect(),
	useMemo: (factory) => factory(),
	useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
}));

import { CreateGarden, CreateGardenLanding } from './CreateGarden.jsx';

function text(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node !== 'object') return String(node);
	if (Array.isArray(node)) return node.map(text).join(' ');
	return text(node.props?.children);
}

beforeEach(() => {
	harness.query = {};
	harness.route.mockReset();
});

describe('Create Garden dispatcher component', () => {
	it('renders the landing page without navigating or accessing creation repositories', () => {
		const tree = CreateGarden();
		expect(tree.type).toBe(CreateGardenLanding);
		expect(harness.route).not.toHaveBeenCalled();
	});

	it('uses replace-style client navigation for a supported method', () => {
		harness.query = { type: 'quickstart' };
		const tree = CreateGarden();
		expect(tree.props.role).toBe('status');
		expect(harness.route).toHaveBeenCalledWith('/gardens/new/quickstart', true);
	});

	it('shows an actionable error without navigation for an invalid request', () => {
		harness.query = { type: 'unsupported' };
		const tree = CreateGarden();
		expect(text(tree)).toContain('Garden creation link not recognized');
		expect(text(tree)).toContain('Choose a creation method');
		expect(harness.route).not.toHaveBeenCalled();
	});
});
