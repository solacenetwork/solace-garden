import { describe, expect, it, vi } from 'vitest';
import { GardensOverviewView, GardenDetailView } from './index.jsx';

// Inspect the rendered view tree without a browser or additional DOM dependency.
function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props.children)];
}
function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ');
}
const garden = {
	id: 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01', href: '/gardens/ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01',
	name: 'Tomatoes', subtitle: 'Patio', statusLabel: 'Active', isClosed: false,
	locationName: 'Home Farm', typeNames: ['Container', 'Outdoor'],
	description: 'Planning near the kitchen', notes: 'Remember the watering can.\nCheck tomorrow.',
	startDate: '2026-02-01', endDate: '2026-10-31',
};

describe('Garden read-only views', () => {
	it('shows both overview sections and distinct links/keys for duplicate labels', () => {
		const second = { ...garden, id: 'another-id', href: '/gardens/another-id' };
		const tree = GardensOverviewView({ state: { status: 'ready', current: [garden, second], previous: [] } });
		expect(text(tree)).toContain('Current Gardens');
		expect(text(tree)).toContain('Previous Gardens');
		expect(text(tree)).toContain('Home Farm');
		expect(text(tree)).toContain('Active');
		expect(nodes(tree).filter((node) => node.type === 'a').map(({ props }) => props.href)).toEqual([garden.href, second.href]);
		expect(nodes(tree).filter((node) => node.type === 'li').map(({ key }) => key)).toEqual([garden.id, second.id]);
	});

	it('shows saved detail fields, embedded Garden Notes and local date-only values', () => {
		const tree = GardenDetailView({ state: { status: 'ready', garden } });
		for (const value of ['Tomatoes', 'Patio', 'Active', 'No', 'Home Farm', 'Container, Outdoor', garden.description, garden.notes]) {
			expect(text(tree)).toContain(value);
		}
		expect(nodes(tree).filter((node) => node.type === 'time').map(({ props }) => props.dateTime)).toEqual([garden.startDate, garden.endDate]);
		expect(text(tree)).not.toContain(garden.id);
		expect(nodes(tree).some((node) => node.type === 'form' || node.type === 'button')).toBe(false);
	});

	it('handles empty optional fields and types without rendering empty sections', () => {
		const tree = GardenDetailView({ state: { status: 'ready', garden: {
			...garden, subtitle: null, description: null, notes: null, startDate: null, endDate: null, typeNames: [], isClosed: true,
		} } });
		expect(text(tree)).toContain('No types selected');
		expect(text(tree)).toContain('Yes');
		expect(text(tree)).not.toContain('Description');
		expect(text(tree)).not.toContain('Garden Notes');
		expect(nodes(tree).some((node) => node.type === 'time')).toBe(false);
		const overview = GardensOverviewView({ state: { status: 'ready', current: [], previous: [] } });
		expect(text(overview)).toContain('No Gardens saved yet');
		expect(nodes(overview).some((node) => node.type === 'form')).toBe(false);
	});

	it('distinguishes loading, not-found, and retriable read errors with a way back', () => {
		const onRetry = vi.fn();
		for (const View of [GardensOverviewView, GardenDetailView]) {
			const loading = nodes(View({ state: { status: 'loading' } }));
			expect(loading.some((node) => node.props?.role === 'status')).toBe(true);
			const tree = View({ state: { status: 'error' }, onRetry });
			expect(text(tree)).toContain('could not be loaded');
			expect(text(tree)).not.toContain('Garden not found');
			expect(nodes(tree).some((node) => node.props?.role === 'alert')).toBe(true);
			nodes(tree).find((node) => node.type === 'button').props.onClick();
		}
		expect(onRetry).toHaveBeenCalledTimes(2);
		const missing = GardenDetailView({ state: { status: 'not-found' } });
		expect(text(missing)).toContain('Garden not found');
		expect(nodes(missing).find((node) => node.type === 'a').props.href).toBe('/gardens');
	});
});
