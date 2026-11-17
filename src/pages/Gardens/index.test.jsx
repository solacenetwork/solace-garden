import { describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));

import { GardensOverviewView, GardenDetailView } from './index.jsx';
import { GardenDeletionDialog } from './GardenDeletion.jsx';

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
	it('shows all four categories in order and distinct saved-Garden links for duplicate labels', () => {
		const second = { ...garden, id: 'another-id', href: '/gardens/another-id' };
		const tree = GardensOverviewView({ state: { status: 'ready', drafts: [], current: [garden], planned: [second], previous: [] } });
		expect(nodes(tree).filter((node) => node.type === 'h2').map((node) => text(node))).toEqual([
			'Draft Gardens', 'Current Gardens', 'Planned Gardens', 'Previous Gardens',
		]);
		expect(text(tree)).not.toContain('Home Farm');
		expect(text(tree)).not.toContain('Active');
		expect(nodes(tree).filter((node) => node.props?.class === 'garden-card garden-card--saved').map(({ props }) => props.href)).toEqual([garden.href, second.href]);
		expect(nodes(tree).filter((node) => node.type === 'li').map(({ key }) => key)).toEqual([garden.id, second.id]);
	});

	it('uses the category-specific SVG placeholder for every saved and Draft card', () => {
		const draft = { id: 'draft-id', label: 'Draft title', href: '/gardens/new/wizard/draft-id' };
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [draft], current: [garden], planned: [garden], previous: [garden] },
		});
		expect(nodes(tree).filter((node) => node.type === 'img').map(({ props }) => props.src)).toEqual([
			'/assets/img/garden/placeholders/wheelbarrow.svg',
			'/assets/img/garden/placeholders/flowers.svg',
			'/assets/img/garden/placeholders/tools.svg',
			'/assets/img/garden/placeholders/veggies.svg',
		]);
		expect(nodes(tree).filter((node) => node.type === 'img').every(({ props }) => props.alt === '')).toBe(true);
	});

	it('renders required and optional saved-Garden card content without Location or status', () => {
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: [garden], planned: [], previous: [] },
		});
		expect(text(tree)).toContain(garden.name);
		expect(text(tree)).toContain(garden.subtitle);
		expect(text(tree)).toContain('Starts');
		expect(nodes(tree).find((node) => node.type === 'time').props.dateTime).toBe(garden.startDate);
		expect(text(tree)).not.toContain(garden.locationName);
		expect(text(tree)).not.toContain(garden.statusLabel);
	});

	it('omits missing card details and preserves long title and subtitle text', () => {
		const longTitle = 'A very long Garden title intended to wrap naturally on narrow screens without being clipped or overflowing its card';
		const longSubtitle = 'A similarly long subtitle that remains available in full when text is enlarged or the card becomes narrow';
		const items = [
			{ ...garden, name: longTitle, subtitle: longSubtitle, startDate: null },
			{ ...garden, id: 'minimal', href: '/gardens/minimal', name: 'Required title', subtitle: null, startDate: null },
		];
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: items, planned: [], previous: [] },
		});
		expect(text(tree)).toContain(longTitle);
		expect(text(tree)).toContain(longSubtitle);
		expect(text(tree)).toContain('Required title');
		expect(nodes(tree).some((node) => node.type === 'time')).toBe(false);
	});

	it('links the ordered header actions to existing destinations', () => {
		const tree = GardensOverviewView({ state: { status: 'loading' } });
		const actions = nodes(tree).find((node) => node.props?.class === 'gardens-header__actions');
		expect(nodes(actions).filter((node) => node.type === 'a').map(({ props }) => props.href)).toEqual([
			'/locations', '/templates', '/gardens/new',
		]);
		expect(nodes(actions).filter((node) => node.type === 'a').map((node) => text(node).trim())).toEqual([
			'Locations', 'Templates', 'Create Garden',
		]);
	});

	it('shows saved detail fields, embedded Garden Notes and local date-only values', () => {
		const saveTemplate = { type: 'button', props: { children: 'Save as Template' } };
		const tree = GardenDetailView({ state: { status: 'ready', garden }, saveTemplate });
		for (const value of ['Tomatoes', 'Patio', 'Active', 'No', 'Home Farm', 'Container, Outdoor', garden.description, garden.notes]) {
			expect(text(tree)).toContain(value);
		}
		expect(nodes(tree).filter((node) => node.type === 'time').map(({ props }) => props.dateTime)).toEqual([garden.startDate, garden.endDate]);
		expect(nodes(tree).find((node) => node.props?.href === `/gardens/${garden.id}/edit`)).toBeTruthy();
		expect(text(tree)).not.toContain(garden.id);
		expect(nodes(tree).some((node) => node.type === 'form')).toBe(false);
		expect(text(tree)).toContain('Associated items');
		expect(nodes(tree)).toContain(saveTemplate);
		expect(text(tree)).toContain('No Notes are associated with this Garden.');
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
		expect(nodes(tree).some((node) => node.props?.href === `/gardens/${garden.id}/edit`)).toBe(false);
		const overview = GardensOverviewView({ state: { status: 'ready', drafts: [], current: [], planned: [], previous: [] } });
		for (const message of [
			'No unfinished Garden drafts.', 'No active Gardens.', 'No planned Gardens.',
			'No closed, completed, or archived Gardens.',
		]) expect(text(overview)).toContain(message);
		expect(nodes(overview).find((node) => node.props?.href === '/gardens/new')).toBeTruthy();
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

	it('offers resume and targeted discard actions for unfinished Garden drafts', () => {
		const onDiscard = vi.fn();
		const draft = { id: 'draft-id', label: 'Untitled Garden', href: '/gardens/new/wizard/draft-id' };
		const tree = GardensOverviewView({
			state: { status: 'ready', current: [], previous: [], drafts: [draft] },
			onDiscard,
		});
		expect(text(tree)).toContain('Draft Gardens');
		const resume = nodes(tree).find((node) => node.props?.href === draft.href);
		expect(resume).toBeTruthy();
		expect(text(resume)).toContain('Untitled Garden');
		expect(text(resume)).toContain('Continue draft');
		expect(nodes(resume).some((node) => node.type === 'button')).toBe(false);
		const discard = nodes(tree).find((node) => node.type === 'button');
		expect(text(discard)).toContain('Discard Draft');
		discard.props.onClick();
		expect(onDiscard).toHaveBeenCalledWith(draft);
	});

	it('keeps the Draft discard pending state on its separate action', () => {
		const draft = { id: 'draft-id', label: 'Draft title', href: '/gardens/new/advanced/draft-id' };
		const tree = GardensOverviewView({
			state: { status: 'ready', current: [], planned: [], previous: [], drafts: [draft] },
			discardingId: draft.id,
		});
		const discard = nodes(tree).find((node) => node.type === 'button');
		expect(discard.props.disabled).toBe(true);
		expect(text(discard)).toContain('Discarding…');
		expect(nodes(tree).find((node) => node.props?.href === draft.href)).toBeTruthy();
	});

	it('shows associated independent records and links to their existing workflows', () => {
		const tree = GardenDetailView({
			state: {
				status: 'ready', garden,
				associations: {
					notes: [{ id: 'note', text: 'Observation' }],
					tasks: [{ id: 'task', text: 'Water', completed: true }],
					wishlist: [{ id: 'wish', text: 'Twine', completed: false }],
				},
			},
			onRetry: vi.fn(),
		});
		expect(text(tree)).toContain('Observation');
		expect(text(tree)).toContain('Completed');
		expect(nodes(tree).find((node) => node.props?.href === '/notes/note')).toBeTruthy();
		expect(nodes(tree).find((node) => node.props?.href === '/tasks')).toBeTruthy();
		expect(nodes(tree).find((node) => node.props?.href === '/wishlist')).toBeTruthy();
	});

	it('explains every permanent deletion consequence in a destructive dialog', () => {
		const tree = GardenDeletionDialog({
			garden, busy: false, error: '', onCancel: vi.fn(), onConfirm: vi.fn(),
		});
		const copy = text(tree);
		expect(copy).toContain('permanently deleted');
		expect(copy).toContain('Garden Notes and Garden-specific fields');
		expect(copy).toContain('Independent Notes, Tasks, and Wish List items will be preserved');
		expect(copy).toContain('associations with this Garden will be cleared');
		expect(copy).toContain('cannot be undone without restoring a backup');
		expect(nodes(tree).find((node) => node.type === 'dialog')).toBeTruthy();
	});
});
