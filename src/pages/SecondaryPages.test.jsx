import { describe, expect, it } from 'vitest';
import { About } from './About/index.jsx';
import { Harvest } from './Harvest/index.jsx';
import { Help } from './Help/index.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	return [node, ...nodes(node.props?.children)];
}

function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ').replace(/\s+/g, ' ').trim();
}

describe('secondary information pages', () => {
	it('provides a modest Help landing page with one functional Welcome action', () => {
		const tree = Help();
		const links = nodes(tree).filter((node) => node.type === 'a');
		const buttons = nodes(tree).filter((node) => node.type === 'button');

		expect(nodes(tree).filter((node) => node.type === 'h1').map(text)).toEqual(['Help']);
		expect(nodes(tree).filter((node) => node.type === 'h2').map(text)).toEqual([
			'Getting Started', 'Documentation', 'Support',
		]);
		expect(links.map(({ props }) => props.href)).toEqual(['/welcome']);
		expect(buttons).toHaveLength(0);
		expect(text(tree).match(/Planned for a future release\./g)).toHaveLength(2);
	});

	it('renders a semantic branded About page with verified project links only', () => {
		const tree = About();
		const heading = nodes(tree).find((node) => node.type === 'h1');
		const image = nodes(tree).find((node) => node.type === 'img');
		const links = nodes(tree).filter((node) => node.type === 'a');

		expect(heading.props).toMatchObject({ id: 'about-title', children: 'SOLACE Garden' });
		expect(image.props).toMatchObject({
			src: '/assets/branding/solace-garden-green.svg',
			alt: 'SOLACE Garden',
		});
		expect(links.map(({ props }) => props.href)).toEqual([
			'https://solacenetwork.com',
			'https://github.com/solacenetwork/solace-garden',
		]);
		expect(text(tree)).toContain('local-first data storage and offline use');
		expect(text(tree)).not.toMatch(/build|service worker|update now|install/i);
	});

	it('keeps Harvest contextual, nonfunctional, and linked back to Gardens', () => {
		const tree = Harvest();
		expect(nodes(tree).find((node) => node.type === 'h1').props.children).toBe('Harvest');
		expect(text(tree)).toContain('through your Gardens and Plant Groups in a future release');
		expect(nodes(tree).filter((node) => node.type === 'a').map(({ props }) => props.href))
			.toEqual(['/gardens']);
		expect(nodes(tree).some((node) => ['button', 'form', 'input'].includes(node.type))).toBe(false);
	});
});
