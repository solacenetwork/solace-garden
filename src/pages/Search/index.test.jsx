import { describe, expect, it } from 'vitest';
import { Search } from './index.jsx';
import { findRoute } from '../../routes.js';
import { PageHeader } from '../../components/PageHeader.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (node.type === PageHeader) return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

describe('Search placeholder', () => {
	it('registers the dedicated Search view without promising available search', () => {
		expect(findRoute('/search')).toMatchObject({
			view: 'search',
			description: 'Search across SOLACE Garden is planned for a future release.',
		});
	});

	it('renders honest static content with a safe return link and no search controls', () => {
		const tree = Search();
		const elements = nodes(tree);
		const heading = elements.find((node) => node.type === 'h1');
		expect(tree.props['aria-labelledby']).toBe(heading.props.id);
		expect(nodes(heading)).toContain('Search');
		expect(elements.filter((node) => typeof node === 'string').join(' '))
			.toContain("Search across SOLACE Garden isn't available yet.");
		expect(elements.filter((node) => node.type === 'a').map(({ props }) => props.href))
			.toEqual(['/']);
		expect(elements.some((node) => ['form', 'input', 'button'].includes(node.type))).toBe(false);
	});

	it('does not reflect arbitrary query values into the placeholder', () => {
		const tree = Search({ query: { q: '<script>alert(1)</script>' } });
		expect(nodes(tree).filter((node) => typeof node === 'string').join(' '))
			.not.toContain('<script>');
	});
});
