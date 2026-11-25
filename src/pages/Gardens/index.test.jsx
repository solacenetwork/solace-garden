import { describe, expect, it, vi } from 'vitest';

vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));
vi.mock('bootstrap/js/dist/carousel.js', () => ({ default: class Carousel {} }));
vi.mock('bootstrap/js/dist/tab.js', () => ({ default: class Tab {} }));

import { CardCarousel } from '../../components/CardCarousel.jsx';
import {
	discardGardenDraft, GardenDraftsView, GardensOverviewView, GardenDetailView,
	GardenSection, GardenSectionView,
} from './index.jsx';
import { GardenDeletionDialog } from './GardenDeletion.jsx';

// Inspect the rendered view tree without a browser or additional DOM dependency.
function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (node.type === GardenSection) {
		return nodes(GardenSectionView({
			...node.props, expanded: false, hasOverflow: false,
			onToggle: vi.fn(), onOverflowChange: vi.fn(),
		}));
	}
	if (typeof node.type === 'function' && node.type !== CardCarousel) return nodes(node.type(node.props));
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
		expect(nodes(tree).filter((node) => node.type === CardCarousel).flatMap(({ props }) => props.children).map(({ key }) => key)).toEqual([garden.id, second.id]);
	});

	it('renders every nonempty saved collection as an independent filmstrip without premature View All controls', () => {
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: [garden], planned: [garden], previous: [garden] },
		});
		const carousels = nodes(tree).filter((node) => node.type === CardCarousel);
		expect(carousels.map(({ props }) => props.id)).toEqual([
			'current-gardens-carousel', 'planned-gardens-carousel', 'previous-gardens-carousel',
		]);
		expect(nodes(tree).filter((node) => node.type === 'button')).toHaveLength(0);
		expect(carousels.every(({ props }) => typeof props.onOverflowChange === 'function')).toBe(true);
	});

	it('shows View All only for an overflowing collection and keeps sections independent', () => {
		const sectionProps = (title, id, hasOverflow) => ({
			title, id, items: [garden], hasOverflow, expanded: false,
			emptyMessage: 'Empty', placeholder: '/placeholder.svg',
			onToggle: vi.fn(), onOverflowChange: vi.fn(),
		});
		const currentProps = sectionProps('Current Gardens', 'current-gardens', true);
		const plannedProps = sectionProps('Planned Gardens', 'planned-gardens', false);
		const previousProps = sectionProps('Previous Gardens', 'previous-gardens', true);
		const current = GardenSectionView(currentProps);
		const planned = GardenSectionView(plannedProps);
		const previous = GardenSectionView(previousProps);

		const currentButton = nodes(current).find((node) => node.type === 'button');
		expect(text(currentButton)).toBe('View All');
		expect(nodes(planned).some((node) => node.type === 'button')).toBe(false);
		expect(text(nodes(previous).find((node) => node.type === 'button'))).toBe('View All');
		expect(nodes(current).find((node) => node.type === CardCarousel).props.onOverflowChange)
			.toBe(currentProps.onOverflowChange);
		currentButton.props.onClick();
		expect(currentProps.onToggle).toHaveBeenCalledOnce();
		expect(plannedProps.onToggle).not.toHaveBeenCalled();
		expect(previousProps.onToggle).not.toHaveBeenCalled();
	});

	it('uses the same saved-Garden cards and identity content in expanded and collapsed layouts', () => {
		const identified = { ...garden, icon: 'tree-fill', color: '#287D46' };
		const onToggle = vi.fn();
		const props = {
			title: 'Current Gardens', id: 'current-gardens', items: [identified],
			emptyMessage: 'No active Gardens.', placeholder: '/placeholder.svg', hasOverflow: true,
			onToggle, onOverflowChange: vi.fn(),
		};
		const collapsed = GardenSectionView({ ...props, expanded: false });
		const expanded = GardenSectionView({ ...props, expanded: true, hasOverflow: false });

		expect(nodes(collapsed).some((node) => node.type === CardCarousel)).toBe(true);
		expect(nodes(expanded).some((node) => node.type === CardCarousel)).toBe(false);
		expect(nodes(expanded).find((node) => node.props?.class === 'gardens-grid gardens-collection__grid').props['aria-label']).toBe('All Current Gardens');
		for (const tree of [collapsed, expanded]) {
			const link = nodes(tree).find((node) => node.props?.class === 'garden-card garden-card--saved');
			expect(link.props.href).toBe(identified.href);
			expect(text(link)).toContain(identified.name);
			const badge = nodes(link).find((node) => node.props?.class?.includes('garden-card__identity'));
			expect(badge.props.style['--garden-identity-color']).toBe('#287D46');
		}
		const collapse = nodes(expanded).find((node) => node.type === 'button');
		expect(text(collapse)).toBe('Collapse');
		expect(collapse.props['aria-expanded']).toBe(true);
		collapse.props.onClick();
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it('preserves saved collection empty states without adding expansion controls', () => {
		const tree = GardenSectionView({
			title: 'Current Gardens', id: 'current-gardens', items: [],
			emptyMessage: 'No active Gardens.', placeholder: '/placeholder.svg',
			expanded: false, onToggle: vi.fn(),
		});
		expect(text(tree)).toContain('No active Gardens.');
		expect(nodes(tree).some((node) => node.type === 'button')).toBe(false);
		expect(nodes(tree).some((node) => node.type === CardCarousel)).toBe(false);
	});

	it('uses the category-specific SVG placeholder for every saved and Draft card', () => {
		const draft = {
			id: 'draft-id', label: 'Draft title', creationMethodLabel: 'Wizard',
			href: '/gardens/new/wizard/draft-id',
		};
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

	it('renders all Hub drafts in the shared filmstrip with a View All destination', () => {
		const drafts = [
			{ id: 'wizard-draft', label: 'Wizard draft', creationMethodLabel: 'Wizard', href: '/gardens/new/wizard/wizard-draft' },
			{ id: 'advanced-draft', label: 'Advanced draft', creationMethodLabel: 'Advanced', href: '/gardens/new/advanced/advanced-draft' },
		];
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts, current: [], planned: [], previous: [] },
		});
		const carousel = nodes(tree).find((node) => node.type === CardCarousel);
		expect(carousel.props).toMatchObject({
			id: 'garden-drafts-carousel', label: 'Draft Gardens', className: 'garden-drafts__carousel',
		});
		expect(carousel.props.children).toHaveLength(2);
		expect(nodes(carousel.props.children).filter((node) => node.props?.class === 'garden-draft-card__resume').map(({ props }) => props.href)).toEqual(drafts.map(({ href }) => href));
		expect(nodes(tree).find((node) => node.props?.href === '/gardens/drafts')).toBeTruthy();
	});

	it('hides the Hub Draft View All destination when the collection is empty', () => {
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: [], planned: [], previous: [] },
		});
		expect(text(tree)).toContain('Draft Gardens');
		expect(text(tree)).toContain('No unfinished Garden drafts.');
		expect(nodes(tree).some((node) => node.props?.href === '/gardens/drafts')).toBe(false);
	});

	it.each([
		['quickstart', 'Quick Start'],
		['wizard', 'Wizard'],
		['advanced', 'Advanced'],
	])('shows the %s creation-method ribbon on Draft cards only', (editor, label) => {
		const draft = {
			id: `${editor}-draft`, label: ` ${label} Garden `, subtitle: ` ${label} subtitle `,
			creationMethodLabel: label, href: `/gardens/new/${editor}/${editor}-draft`,
		};
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [draft], current: [garden], planned: [], previous: [] },
		});
		const draftCard = nodes(tree).find((node) => node.props?.class === 'garden-card garden-card--draft');
		const savedCard = nodes(tree).find((node) => node.props?.class === 'garden-card garden-card--saved');
		expect(text(draftCard)).toContain(draft.label);
		expect(text(draftCard)).toContain(draft.subtitle);
		expect(nodes(draftCard).filter((node) => node.props?.class === 'garden-draft-card__ribbon').map(text)).toEqual([label]);
		expect(nodes(savedCard).some((node) => node.props?.class === 'garden-draft-card__ribbon')).toBe(false);
		expect(text(savedCard)).toContain(garden.name);
		expect(text(savedCard)).toContain(garden.subtitle);
	});

	it('renders required and optional saved-Garden card content without Location or status', () => {
		const tree = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: [garden], planned: [], previous: [] },
		});
		expect(text(tree)).toContain(garden.name);
		expect(text(tree)).toContain(garden.subtitle);
		expect(text(tree)).toContain('Start date:');
		expect(nodes(tree).find((node) => node.type === 'time').props.dateTime).toBe(garden.startDate);
		expect(text(tree)).not.toContain(garden.locationName);
		expect(text(tree)).not.toContain(garden.statusLabel);
	});

	it('adds identity badges to saved cards and detail without replacing their artwork or names', () => {
		const identified = { ...garden, icon: 'tree-fill', color: '#287D46' };
		const overview = GardensOverviewView({
			state: { status: 'ready', drafts: [], current: [identified], planned: [], previous: [] },
		});
		const cardBadge = nodes(overview).find((node) => node.props?.class?.includes('garden-card__identity'));
		expect(cardBadge.props.style['--garden-identity-color']).toBe('#287D46');
		expect(nodes(cardBadge).find((node) => node.type === 'i').props.class).toBe('bi bi-tree-fill');
		expect(nodes(overview).some((node) => node.type === 'img')).toBe(true);
		expect(text(overview)).toContain(identified.name);

		const detail = GardenDetailView({ state: { status: 'ready', garden: identified } });
		expect(nodes(detail).find((node) => node.props?.class === 'garden-detail__identity')).toBeTruthy();
		expect(text(detail)).toContain(identified.name);
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
			'/locations?ref=gardens', '/templates', '/gardens/new',
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
		const draft = {
			id: 'draft-id', label: 'Untitled Garden', creationMethodLabel: 'Wizard',
			href: '/gardens/new/wizard/draft-id',
		};
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
		const draft = {
			id: 'draft-id', label: 'Draft title', creationMethodLabel: 'Advanced',
			href: '/gardens/new/advanced/draft-id',
		};
		const tree = GardensOverviewView({
			state: { status: 'ready', current: [], planned: [], previous: [], drafts: [draft] },
			discardingId: draft.id,
		});
		const discard = nodes(tree).find((node) => node.type === 'button');
		expect(discard.props.disabled).toBe(true);
		expect(text(discard)).toContain('Discarding…');
		expect(nodes(tree).find((node) => node.props?.href === draft.href)).toBeTruthy();
	});

	it('renders the dedicated Drafts page as a grid with both editor destinations', () => {
		const drafts = [
			{ id: 'wizard-draft', label: 'Wizard draft', creationMethodLabel: 'Wizard', href: '/gardens/new/wizard/wizard-draft' },
			{ id: 'advanced-draft', label: 'Advanced draft', creationMethodLabel: 'Advanced', href: '/gardens/new/advanced/advanced-draft' },
		];
		const tree = GardenDraftsView({ state: { status: 'ready', drafts } });
		expect(text(tree)).toContain('Draft Gardens');
		expect(nodes(tree).find((node) => node.props?.href === '/gardens')).toBeTruthy();
		expect(nodes(tree).some((node) => node.type === CardCarousel)).toBe(false);
		expect(nodes(tree).find((node) => node.props?.class === 'gardens-grid garden-drafts__grid')).toBeTruthy();
		expect(nodes(tree).filter((node) => node.props?.class === 'garden-draft-card__resume').map(({ props }) => props.href)).toEqual(drafts.map(({ href }) => href));
		expect(nodes(tree).filter((node) => node.props?.class?.includes('garden-draft-card__discard'))).toHaveLength(2);
		expect(nodes(tree).filter((node) => node.props?.class === 'garden-draft-card__ribbon').map(text)).toEqual(['Wizard', 'Advanced']);
	});

	it('handles dedicated Draft loading, error, and empty states', () => {
		const onRetry = vi.fn();
		const loading = GardenDraftsView({ state: { status: 'loading' }, onRetry });
		expect(nodes(loading).some((node) => node.props?.role === 'status')).toBe(true);
		const error = GardenDraftsView({ state: { status: 'error' }, onRetry });
		expect(nodes(error).some((node) => node.props?.role === 'alert')).toBe(true);
		nodes(error).find((node) => node.type === 'button').props.onClick();
		expect(onRetry).toHaveBeenCalledOnce();
		const empty = GardenDraftsView({ state: { status: 'ready', drafts: [] } });
		expect(text(empty)).toContain('No unfinished Garden drafts.');
		expect(nodes(empty).some((node) => node.type === CardCarousel)).toBe(false);
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

describe('Garden draft discard controller', () => {
	const draft = { id: 'draft-id', label: 'Draft title' };

	it('cancels without deleting or changing pending state', async () => {
		const drafts = { remove: vi.fn() };
		const setDiscardingId = vi.fn();
		expect(await discardGardenDraft(draft, drafts, {
			confirm: vi.fn(() => false), setDiscardingId,
		})).toBe(false);
		expect(drafts.remove).not.toHaveBeenCalled();
		expect(setDiscardingId).not.toHaveBeenCalled();
	});

	it('deletes, refreshes the visible collection, and clears pending state', async () => {
		const drafts = { remove: vi.fn(async () => true) };
		const setDiscardingId = vi.fn();
		const setError = vi.fn();
		const onRemoved = vi.fn();
		expect(await discardGardenDraft(draft, drafts, {
			confirm: vi.fn(() => true), onRemoved, setDiscardingId, setError,
		})).toBe(true);
		expect(drafts.remove).toHaveBeenCalledWith(draft.id);
		expect(onRemoved).toHaveBeenCalledOnce();
		expect(setError).toHaveBeenCalledWith('');
		expect(setDiscardingId.mock.calls).toEqual([[draft.id], [null]]);
	});

	it('reports deletion failures accessibly and clears pending state', async () => {
		const drafts = { remove: vi.fn(async () => { throw new Error('storage failed'); }) };
		const setDiscardingId = vi.fn();
		const setError = vi.fn();
		expect(await discardGardenDraft(draft, drafts, {
			confirm: vi.fn(() => true), setDiscardingId, setError,
		})).toBe(false);
		expect(setError).toHaveBeenLastCalledWith('This Garden draft could not be discarded. Please try again.');
		expect(setDiscardingId.mock.calls).toEqual([[draft.id], [null]]);
	});
});
