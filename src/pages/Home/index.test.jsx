import { beforeEach, describe, expect, it, vi } from 'vitest';

const mode = vi.hoisted(() => ({ effectiveMode: 'simple' }));
vi.mock('../../context/InterfaceModeContext.jsx', () => ({
	useInterfaceMode: () => ({ effectiveMode: mode.effectiveMode }),
}));

import { Home } from './index.jsx';

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
	it('renders only the seven cards in Simple Mode', () => {
		const tree = Home();
		expect(simpleLinks(tree)).toHaveLength(7);
		expect(nodes(tree).some(({ props }) => props.class?.includes('workspace-directory'))).toBe(false);
		expect(nodes(tree).some(({ props }) => props.class === 'standard-home')).toBe(false);
	});

	it('keeps the existing Standard Home separate from Simple cards', () => {
		mode.effectiveMode = 'standard';
		const tree = Home();
		expect(simpleLinks(tree)).toHaveLength(0);
		expect(typeof tree.type).toBe('function');
		expect(tree.type(tree.props).props.class).toBe('container standard-home');
	});
});
