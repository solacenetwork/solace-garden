import { beforeEach, describe, expect, it, vi } from 'vitest';

const mode = vi.hoisted(() => ({ effectiveMode: 'simple' }));
vi.mock('../../context/InterfaceModeContext.jsx', () => ({
	useInterfaceMode: () => ({ effectiveMode: mode.effectiveMode }),
}));
vi.mock('./HomeDashboard.jsx', () => ({
	HomeDashboard: () => <div data-home-dashboard />,
}));

import { Home } from './index.jsx';
import { HomeDashboard } from './HomeDashboard.jsx';
import { SimpleNavigationCards } from './SimpleNavigationCards.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

const simpleLinks = (tree) => nodes(tree).filter(({ props }) => props['data-simple-destination']);

beforeEach(() => {
	mode.effectiveMode = 'simple';
});

describe('Home interface-mode presentations', () => {
	it('renders the seven cards before the shared dashboard in Simple Mode', () => {
		const tree = Home();
		expect(simpleLinks(tree)).toHaveLength(7);
		const children = tree.props.children.flat(Infinity).filter(Boolean);
		expect(children.findIndex(({ type }) => type === SimpleNavigationCards)).toBeLessThan(
			children.findIndex(({ type }) => type === HomeDashboard),
		);
	});

	it('shows the dashboard directly without navigation cards in Standard Mode', () => {
		mode.effectiveMode = 'standard';
		const tree = Home();
		expect(simpleLinks(tree)).toHaveLength(0);
		expect(tree.props.class).toBe('container home-page home-page--standard');
		expect(nodes(tree).filter(({ props }) => props['data-home-dashboard'] !== undefined)).toHaveLength(1);
		expect(nodes(tree).some(({ props }) => props.class?.includes('standard-home__grid'))).toBe(false);
	});
});
