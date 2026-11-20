import { describe, expect, it, vi } from 'vitest';
import { GardenCreationBreadcrumb } from './GardenCreationBreadcrumb.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

function breadcrumb(current, props = {}) {
	return GardenCreationBreadcrumb({ current, ...props });
}

describe('GardenCreationBreadcrumb', () => {
	it.each([
		['Create Garden', ['/gardens'], ['Gardens', 'Create Garden']],
		['Quick Start', ['/gardens', '/gardens/new'], ['Gardens', 'Create Garden', 'Quick Start']],
		['Guided Wizard', ['/gardens', '/gardens/new'], ['Gardens', 'Create Garden', 'Guided Wizard']],
		['Advanced Form', ['/gardens', '/gardens/new'], ['Gardens', 'Create Garden', 'Advanced Form']],
	])('renders Bootstrap 6 breadcrumb markup for %s', (current, hrefs, labels) => {
		const tree = breadcrumb(current);
		const all = nodes(tree);
		const links = all.filter(({ type }) => type === 'a');
		const items = all.filter(({ props }) => props.class === 'breadcrumb-item');
		const dividers = all.filter(({ props }) => props.class === 'breadcrumb-divider');
		const currentItem = all.find(({ props }) => props['aria-current'] === 'page');

		expect(tree.props).toMatchObject({
			class: 'garden-creation-breadcrumb',
			'aria-label': 'Garden creation breadcrumb',
		});
		expect(all.find(({ type }) => type === 'ol').props.class).toBe('breadcrumb');
		expect(links.map(({ props }) => props.href)).toEqual(hrefs);
		expect(items).toHaveLength(labels.length);
		expect(dividers).toHaveLength(hrefs.length);
		expect(dividers.every(({ props }) => props['aria-hidden'] === 'true')).toBe(true);
		expect(currentItem.type).toBe('span');
		expect(currentItem.props.class).toBe('breadcrumb-link active');
		expect(currentItem.props.children).toBe(current);
		expect([...links.map(({ props }) => props.children), currentItem.props.children]).toEqual(labels);
	});

	it('uses draft-preserving navigation for ordinary activation and leaves modified links native', async () => {
		const onNavigate = vi.fn(async () => {});
		const links = nodes(breadcrumb('Guided Wizard', { onNavigate }))
			.filter(({ type }) => type === 'a');
		const ordinary = { button: 0, preventDefault: vi.fn() };
		await links[1].props.onClick(ordinary);
		expect(ordinary.preventDefault).toHaveBeenCalledOnce();
		expect(onNavigate).toHaveBeenCalledWith('/gardens/new');

		const modified = { button: 0, ctrlKey: true, preventDefault: vi.fn() };
		links[0].props.onClick(modified);
		expect(modified.preventDefault).not.toHaveBeenCalled();
		expect(onNavigate).toHaveBeenCalledOnce();
	});

	it('temporarily disables breadcrumb destinations while a save is busy', () => {
		const onNavigate = vi.fn();
		const links = nodes(breadcrumb('Quick Start', { disabled: true, onNavigate }))
			.filter(({ type }) => type === 'a');
		for (const link of links) {
			const event = { button: 0, preventDefault: vi.fn() };
			link.props.onClick(event);
			expect(event.preventDefault).toHaveBeenCalledOnce();
			expect(link.props).toMatchObject({ 'aria-disabled': 'true', tabIndex: -1 });
		}
		expect(onNavigate).not.toHaveBeenCalled();
	});
});
