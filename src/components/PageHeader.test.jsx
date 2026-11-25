import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	return [node, ...nodes(node.props?.children)];
}

describe('PageHeader', () => {
	it('renders the required title as a semantic H1 and preserves its accessible id', () => {
		const tree = PageHeader({ title: 'Garden settings', titleId: 'settings-title' });
		const heading = nodes(tree).find((node) => node.type === 'h1');

		expect(heading.props).toMatchObject({
			id: 'settings-title',
			class: 'h1 page-header__title',
		});
		expect(nodes(heading).filter((node) => typeof node === 'string').join('')).toBe('Garden settings');
	});

	it('omits optional elements when they are not supplied', () => {
		const tree = PageHeader({ title: 'Tasks' });
		const elements = nodes(tree);

		expect(elements.some((node) => node.props?.class === 'page-header__breadcrumbs')).toBe(false);
		expect(elements.some((node) => node.props?.class === 'page-header__eyebrow')).toBe(false);
		expect(elements.some((node) => node.props?.class === 'page-header__description')).toBe(false);
		expect(elements.some((node) => node.props?.class === 'page-header__leading')).toBe(false);
		expect(elements.some((node) => node.props?.class === 'page-header__aside')).toBe(false);
	});

	it('renders breadcrumb navigation and page actions in their respective slots', () => {
		const breadcrumbs = <nav aria-label="Garden breadcrumb">Garden</nav>;
		const actions = <a href="/gardens/new">Create Garden</a>;
		const status = <p role="status">Draft saved</p>;
		const tree = PageHeader({
			title: 'Gardens',
			breadcrumbs,
			actions,
			status,
		});
		const elements = nodes(tree);
		const breadcrumbRegion = elements.find((node) => node.props?.class === 'page-header__breadcrumbs');
		const actionsRegion = elements.find((node) => node.props?.class === 'page-header__actions');

		expect(nodes(breadcrumbRegion).find((node) => node.type === 'nav').props['aria-label'])
			.toBe('Garden breadcrumb');
		expect(nodes(actionsRegion).find((node) => node.type === 'a').props.href).toBe('/gardens/new');
		expect(elements.find((node) => node.props?.class === 'page-header__status').props.children.props.role)
			.toBe('status');
	});

	it('supports long dynamic titles, eyebrow, description, and a leading visual', () => {
		const title = `Edit ${'North-facing greenhouse '.repeat(5)}`;
		const leading = <i class="bi bi-flower1" aria-hidden="true" />;
		const tree = PageHeader({
			title,
			eyebrow: 'Garden details',
			description: 'Keep this description readable when it wraps on narrow screens.',
			leading,
		});
		const elements = nodes(tree);

		expect(nodes(elements.find((node) => node.type === 'h1'))
			.filter((node) => typeof node === 'string').join('')).toBe(title);
		expect(elements.find((node) => node.props?.class === 'page-header__eyebrow').props.children)
			.toBe('Garden details');
		expect(elements.find((node) => node.props?.class === 'page-header__description').props.children)
			.toContain('readable when it wraps');
		expect(elements.find((node) => node.props?.class === 'page-header__leading').props.children)
			.toBe(leading);
	});
});
