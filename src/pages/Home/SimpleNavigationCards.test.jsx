import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SimpleNavigationCards } from './SimpleNavigationCards.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

describe('SimpleNavigationCards', () => {
	const tree = SimpleNavigationCards();
	const allNodes = nodes(tree);
	const links = allNodes.filter(({ type }) => type === 'a');

	it('renders exactly seven native links in the approved order', () => {
		expect(links.map(({ props }) => props['data-simple-destination'])).toEqual([
			'gardens', 'tasks', 'journal', 'calendar', 'notes', 'wishlist', 'plants',
		]);
		expect(links.map(({ props }) => props.href)).toEqual([
			'/gardens', '/tasks', '/journal', '/calendar', '/notes', '/wishlist', '/plants',
		]);
		expect(links.map(({ props }) => nodes(props.children).find(({ type }) => type === 'span').props.children)).toEqual([
			'Gardens', 'Tasks', 'Journal', 'Calendar', 'Notes', 'Wishlist', 'Plant DB',
		]);
	});

	it('features only the first Gardens card', () => {
		expect(links[0].props.class).toContain('simple-navigation__card--featured');
		expect(links.slice(1).every(({ props }) => !props.class.includes('simple-navigation__card--featured'))).toBe(true);
	});

	it('contains icons and labels without nested interactive controls', () => {
		for (const link of links) {
			const descendants = nodes(link.props.children);
			expect(descendants.some(({ type }) => type === 'i')).toBe(true);
			expect(descendants.some(({ type }) => ['a', 'button', 'input', 'select', 'textarea'].includes(type))).toBe(false);
			expect(link.props.onClick).toBeUndefined();
		}
		expect(allNodes.filter(({ type }) => type === 'a')).toHaveLength(7);
		expect(allNodes.some(({ props }) => props.class?.includes('workspace-directory'))).toBe(false);
	});

	it('uses two columns by default, three from md, and spans Gardens in both', () => {
		const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
		expect(css).toMatch(/\.simple-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
		expect(css).toMatch(/\.simple-navigation__card--featured\s*\{[^}]*grid-column:\s*1 \/ -1/s);
		expect(css).toMatch(/@media \(min-width:\s*48rem\)\s*\{[\s\S]*?\.simple-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(3,/);
	});
});
