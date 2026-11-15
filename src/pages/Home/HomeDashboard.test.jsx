import { describe, expect, it, vi } from 'vitest';

vi.mock('../../components/CardCarousel.jsx', () => ({
	CardCarousel: ({ children, id, label }) => <div data-carousel={label} id={id}>{children}</div>,
}));

import { HomeDashboardView } from './HomeDashboard.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props?.children)];
}

function text(tree) {
	return nodes(tree)
		.filter((node) => typeof node === 'string')
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const readyGardens = {
	status: 'ready',
	current: [{
		id: 'current', name: 'A very long Garden name that remains available to assistive technology',
		subtitle: null, startDate: null, status: 'active', isClosed: false,
	}],
	previous: [{
		id: 'previous', name: 'Past Garden', subtitle: 'Back beds', startDate: '2026-03-09',
		status: 'completed', isClosed: true,
	}],
};
const readyTasks = { status: 'ready', items: [{ id: 'task', text: 'Water seedlings', completed: true }] };
const readyWishlist = { status: 'ready', items: [{ id: 'wish', text: 'Garden twine', quantity: '2 rolls', completed: false }] };

function view(overrides = {}) {
	return HomeDashboardView({
		gardens: readyGardens,
		tasks: readyTasks,
		wishlist: readyWishlist,
		retryGardens: vi.fn(),
		retryTasks: vi.fn(),
		retryWishlist: vi.fn(),
		...overrides,
	});
}

describe('HomeDashboard presentation', () => {
	it('renders the five approved sections in order with correct destinations', () => {
		const tree = view();
		expect(nodes(tree).filter(({ type }) => type === 'h2').map((heading) => text(heading))).toEqual([
			'Current Gardens', 'Tasks', 'Wish List', 'Gallery', 'Previous Gardens',
		]);
		expect(nodes(tree).filter((node) =>
			node.type === 'a' && node.props.class !== 'home-garden-card card'
		).map(({ props }) => props.href)).toEqual([
			'/gardens', '/tasks', '/wishlist', '/photos', '/gardens',
		]);
	});

	it('uses independent Current and Previous carousels with real detail links', () => {
		const tree = view();
		const carousels = nodes(tree).filter((node) => node.props?.['data-carousel']);
		expect(carousels.map(({ props }) => [props.id, props['data-carousel']])).toEqual([
			['home-current-gardens-carousel', 'Current Gardens'],
			['home-previous-gardens-carousel', 'Previous Gardens'],
		]);
		expect(nodes(tree).filter((node) => node.props?.class === 'home-garden-card card').map(({ props }) => props.href)).toEqual([
			'/gardens/current', '/gardens/previous',
		]);
		const ids = nodes(tree).map((node) => node.props?.id).filter(Boolean);
		expect(new Set(ids).size).toBe(ids.length);
		expect(text(tree)).toContain('Completed');
	});

	it('shows optional Garden fields gracefully and keeps lists read-only', () => {
		const tree = view();
		expect(text(tree)).toContain(readyGardens.current[0].name);
		expect(text(tree)).toContain('Back beds');
		expect(nodes(tree).find(({ type }) => type === 'time').props.dateTime).toBe('2026-03-09');
		expect(text(tree)).toContain('Water seedlings');
		expect(text(tree)).toContain('Qty: 2 rolls');
		expect(nodes(tree).some(({ type }) => ['input', 'textarea', 'select', 'form'].includes(type))).toBe(false);
		expect(nodes(tree).filter(({ type }) => type === 'button')).toHaveLength(0);
	});

	it('keeps all sections visible with the approved empty and unavailable states', () => {
		const tree = view({
			gardens: { status: 'ready', current: [], previous: [] },
			tasks: { status: 'ready', items: [] },
			wishlist: { status: 'ready', items: [] },
		});
		for (const copy of [
			'Your Gardens will appear here.', 'No tasks yet.', 'Your Wish List is empty.',
			'Gallery is not available yet.', 'No previous Gardens yet.',
		]) expect(text(tree)).toContain(copy);
		expect(nodes(tree).find((node) => node.props?.href === '/gardens/new')).toBeTruthy();
		expect(nodes(tree).find((node) => node.props?.href === '/tasks#lists-quick-text')).toBeTruthy();
		expect(nodes(tree).find((node) => node.props?.href === '/wishlist#lists-quick-text')).toBeTruthy();
	});

	it('distinguishes loading and independent errors and invokes the matching Retry', () => {
		const retryTasks = vi.fn();
		const tree = view({
			gardens: { status: 'loading', current: [], previous: [] },
			tasks: { status: 'error', items: [] },
			retryTasks,
		});
		expect(nodes(tree).filter((node) => node.props?.role === 'status')).toHaveLength(2);
		expect(nodes(tree).filter((node) => node.props?.role === 'alert')).toHaveLength(1);
		expect(text(tree)).toContain('Tasks could not be loaded.');
		expect(text(tree)).toContain('Garden twine');
		nodes(tree).find(({ type }) => type === 'button').props.onClick();
		expect(retryTasks).toHaveBeenCalledOnce();
	});
});
