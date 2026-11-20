import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { CardCarousel } from '../../components/CardCarousel.jsx';
import { GardenIdentityBadge } from '../../components/GardenIdentity.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { formatDateOnly } from '../Home/dashboardData.js';
import {
	createGardenReaders, loadGardenDetail, loadGardenDrafts, loadGardenOverview,
} from './viewModel.js';
import { GardenLifecycle } from './GardenLifecycle.jsx';
import { GardenDeletion } from './GardenDeletion.jsx';
import { GardenSaveTemplate } from './GardenSaveTemplate.jsx';
import './style.css';

const GARDEN_CARD_PLACEHOLDERS = Object.freeze({
	draft: '/assets/img/garden/placeholders/wheelbarrow.svg',
	current: '/assets/img/garden/placeholders/flowers.svg',
	planned: '/assets/img/garden/placeholders/tools.svg',
	previous: '/assets/img/garden/placeholders/veggies.svg',
});

function useGardenRead(load) {
	const [state, setState] = useState({ status: 'loading' });
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setState({ status: 'loading' });
		void load().then((result) => {
			if (!cancelled) setState(result);
		});
		return () => { cancelled = true; };
	}, [load, attempt]);
	return [state, () => setAttempt((value) => value + 1)];
}

function ReadState({ state, onRetry }) {
	if (state.status === 'loading') {
		return <p class="gardens-state" role="status">Loading Gardens…</p>;
	}
	if (state.status === 'error') {
		return (
			<div class="gardens-state" role="alert">
				<p>Garden data could not be loaded. Please try again.</p>
				<button class="btn-outline" type="button" onClick={onRetry}>Retry</button>
			</div>
		);
	}
	if (state.status === 'not-found') {
		return (
			<div class="gardens-state">
				<h1>Garden not found</h1>
				<p>This Garden link is invalid or the record is no longer available.</p>
			</div>
		);
	}
	return null;
}

function GardenCardVisual({ src, garden = null }) {
	return (
		<span class="garden-card__visual" aria-hidden="true">
			<img src={src} alt="" loading="lazy" decoding="async" />
			{garden && <GardenIdentityBadge icon={garden.icon} color={garden.color} className="garden-card__identity" />}
		</span>
	);
}

function GardenCardContent({ title, subtitle = null, startDate = null, actionLabel = null }) {
	const formattedStartDate = formatDateOnly(startDate);
	return (
		<div class="garden-card__content">
			<h3>{title}</h3>
			{subtitle && <span class="garden-card__subtitle">{subtitle}</span>}
			{actionLabel && <span class="garden-card__action-label">{actionLabel}</span>}
			{formattedStartDate && (
				<span class="garden-card__date">
					<span>Start date: </span>
					<time dateTime={startDate}>{formattedStartDate}</time>
				</span>
			)}
		</div>
	);
}

export function SavedGardenCard({ garden, placeholder }) {
	return (
		<a class="garden-card garden-card--saved" href={garden.href}>
			<GardenCardVisual src={placeholder} garden={garden} />
			<GardenCardContent title={garden.name} subtitle={garden.subtitle} startDate={garden.startDate} />
		</a>
	);
}

export function GardenDraftCard({ draft, onDiscard, discardingId = null }) {
	return (
		<article class="garden-card garden-card--draft">
			<a class="garden-draft-card__resume" href={draft.href}>
				<GardenCardVisual src={GARDEN_CARD_PLACEHOLDERS.draft} />
				<GardenCardContent title={draft.label} actionLabel="Continue draft" />
			</a>
			<button class="btn-text theme-danger garden-draft-card__discard" type="button" disabled={discardingId === draft.id} onClick={() => onDiscard(draft)}>
				<i class="bi bi-trash3" aria-hidden="true"></i>
				{discardingId === draft.id ? 'Discarding…' : 'Discard Draft'}
			</button>
		</article>
	);
}

export function GardenSectionView({
	title, id, items = [], emptyMessage, placeholder, expanded, hasOverflow = false,
	onToggle, onOverflowChange,
}) {
	const collectionId = `${id}-collection`;
	const renderCard = (garden) => (
		<SavedGardenCard garden={garden} placeholder={placeholder} key={garden.id} />
	);

	return (
		<section class="gardens-section" aria-labelledby={id}>
			<div class="gardens-section__heading">
				<h2 id={id}>{title}</h2>
				{items.length > 0 && (expanded || hasOverflow) && (
					<button
						class="btn-outline theme-primary"
						type="button"
						aria-expanded={expanded}
						aria-controls={collectionId}
						onClick={onToggle}
					>
						{expanded ? 'Collapse' : 'View All'}
					</button>
				)}
			</div>
			{items.length === 0 ? <p class="gardens-state">{emptyMessage}</p> : (
				<div id={collectionId} data-presentation={expanded ? 'grid' : 'filmstrip'}>
					{expanded ? (
						<ul class="gardens-grid gardens-collection__grid" aria-label={`All ${title}`}>
							{items.map((garden) => <li key={garden.id}>{renderCard(garden)}</li>)}
						</ul>
					) : (
						<CardCarousel
							id={`${id}-carousel`}
							label={title}
							className="gardens-collection__carousel"
							onOverflowChange={onOverflowChange}
						>
							{items.map(renderCard)}
						</CardCarousel>
					)}
				</div>
			)}
		</section>
	);
}

export function GardenSection(props) {
	const [expanded, setExpanded] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);
	return (
		<GardenSectionView
			{...props}
			expanded={expanded}
			hasOverflow={hasOverflow}
			onToggle={() => setExpanded((value) => !value)}
			onOverflowChange={setHasOverflow}
		/>
	);
}

function GardenDraftGrid({ drafts, onDiscard, discardingId }) {
	return (
		<ul class="gardens-grid garden-drafts__grid">
			{drafts.map((draft) => (
				<li key={draft.id}>
					<GardenDraftCard draft={draft} onDiscard={onDiscard} discardingId={discardingId} />
				</li>
			))}
		</ul>
	);
}

function GardenDraftSection({ drafts = [], onDiscard, discardingId, error = '' }) {
	return (
		<section class="gardens-section garden-drafts" aria-labelledby="garden-drafts-title">
			<div class="garden-drafts__header">
				<h2 id="garden-drafts-title">Draft Gardens</h2>
				<a href="/gardens/drafts">View All</a>
			</div>
			<p>Continue an unfinished Garden or discard one you no longer need.</p>
			{error && <div class="garden-create__error" role="alert">{error}</div>}
			{drafts.length === 0 ? <p class="gardens-state">No unfinished Garden drafts.</p> : (
				<CardCarousel id="garden-drafts-carousel" label="Draft Gardens" className="garden-drafts__carousel">
					{drafts.map((draft) => (
						<GardenDraftCard draft={draft} onDiscard={onDiscard} discardingId={discardingId} key={draft.id} />
					))}
				</CardCarousel>
			)}
		</section>
	);
}

export function GardensOverviewView({ state, onRetry, onDiscard = () => {}, discardingId = null, draftError = '' }) {
	return (
		<section class="container gardens-page" aria-labelledby="gardens-title">
			<header class="gardens-header gardens-header--overview">
				<div>
					<h1 id="gardens-title"><i class="bi bi-leaf-fill" aria-hidden="true"></i> Gardens</h1>
					<p>Continue drafts, manage growing projects, and revisit previous Gardens.</p>
				</div>
				<nav class="gardens-header__actions" aria-label="Garden management">
					<a class="btn-outline" href="/locations"><i class="bi bi-geo-alt" aria-hidden="true"></i> Locations</a>
					<a class="btn-outline" href="/templates"><i class="bi bi-copy" aria-hidden="true"></i> Templates</a>
					<a class="btn-solid theme-primary gardens-create-action" href="/gardens/new">
						<i class="bi bi-plus-lg" aria-hidden="true"></i> Create Garden
					</a>
				</nav>
			</header>
			{state.status !== 'ready' ? <ReadState state={state} onRetry={onRetry} /> : (
				<>
					<GardenDraftSection drafts={state.drafts} onDiscard={onDiscard} discardingId={discardingId} error={draftError} />
					<GardenSection title="Current Gardens" id="current-gardens" items={state.current} emptyMessage="No active Gardens." placeholder={GARDEN_CARD_PLACEHOLDERS.current} />
					<GardenSection title="Planned Gardens" id="planned-gardens" items={state.planned} emptyMessage="No planned Gardens." placeholder={GARDEN_CARD_PLACEHOLDERS.planned} />
					<GardenSection title="Previous Gardens" id="previous-gardens" items={state.previous} emptyMessage="No closed, completed, or archived Gardens." placeholder={GARDEN_CARD_PLACEHOLDERS.previous} />
				</>
			)}
		</section>
	);
}

export function GardenDraftsView({ state, onRetry, onDiscard = () => {}, discardingId = null, draftError = '' }) {
	return (
		<section class="container gardens-page garden-drafts-page" aria-labelledby="garden-drafts-page-title">
			<a class="btn-outline gardens-back" href="/gardens">
				<i class="bi bi-arrow-left" aria-hidden="true"></i> All Gardens
			</a>
			<header class="gardens-header">
				<h1 id="garden-drafts-page-title">Draft Gardens</h1>
				<p>Continue an unfinished Garden or discard one you no longer need.</p>
			</header>
			{state.status !== 'ready' ? <ReadState state={state} onRetry={onRetry} /> : (
				<>
					{draftError && <div class="garden-create__error" role="alert">{draftError}</div>}
					{state.drafts.length === 0
						? <p class="gardens-state">No unfinished Garden drafts.</p>
						: <GardenDraftGrid drafts={state.drafts} onDiscard={onDiscard} discardingId={discardingId} />}
				</>
			)}
		</section>
	);
}

function AssociatedRecords({ associations, onRefresh }) {
	const sections = [
		{ id: 'associated-notes', title: 'Notes', items: associations.notes, href: '/notes', empty: 'No Notes are associated with this Garden.' },
		{ id: 'associated-tasks', title: 'Tasks', items: associations.tasks, href: '/tasks', empty: 'No Tasks are associated with this Garden.' },
		{ id: 'associated-wishlist', title: 'Wish List', items: associations.wishlist, href: '/wishlist', empty: 'No Wish List items are associated with this Garden.' },
	];
	return <section class="garden-associations" aria-labelledby="garden-associations-title">
		<div class="garden-associations__header"><div><h2 id="garden-associations-title">Associated items</h2><p>These remain independent records in their gardener-wide workspaces.</p></div><button class="btn-outline" type="button" onClick={onRefresh}><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Refresh</button></div>
		{sections.map((section) => <section class="garden-associated-section" aria-labelledby={section.id} key={section.id}>
			<div class="garden-associated-section__header"><h3 id={section.id}>{section.title}</h3><a href={section.href}>Open {section.title}</a></div>
			{section.items.length === 0 ? <p class="gardens-state">{section.empty}</p> : <ul>{section.items.map((item) => <li key={item.id}>
				<a href={section.title === 'Notes' ? `/notes/${item.id}` : section.href}>{item.text}</a>
				{section.title !== 'Notes' && item.completed && <span class="badge theme-success">{section.title === 'Tasks' ? 'Completed' : 'Purchased'}</span>}
			</li>)}</ul>}
		</section>)}
	</section>;
}

export function GardenDetailView({ state, onRetry, lifecycle = null, deletion = null, saveTemplate = null }) {
	const garden = state.garden;
	return (
		<section class="container gardens-page" aria-label="Garden details">
			<a class="btn-outline gardens-back" href="/gardens">
				<i class="bi bi-arrow-left" aria-hidden="true"></i> All Gardens
			</a>
			{state.status !== 'ready' ? <ReadState state={state} onRetry={onRetry} /> : (
				<>
					<header class="gardens-header garden-detail__header">
						<div class="garden-detail__identity">
							<GardenIdentityBadge icon={garden.icon} color={garden.color} />
							<div>
								<h1>{garden.name}</h1>
								{garden.subtitle && <p class="garden-subtitle">{garden.subtitle}</p>}
							</div>
						</div>
						<div class="garden-detail__actions">
							{!garden.isClosed && garden.status !== 'archived' && (
								<a class="btn-solid theme-primary garden-detail__edit" href={`/gardens/${garden.id}/edit`}>
									<i class="bi bi-pencil" aria-hidden="true"></i> Edit Garden
								</a>
							)}
							{saveTemplate}
						</div>
					</header>
					<dl class="garden-facts">
						<div><dt>Status</dt><dd>{garden.statusLabel}</dd></div>
						<div><dt>Closed</dt><dd>{garden.isClosed ? 'Yes' : 'No'}</dd></div>
						<div><dt>Location</dt><dd>{garden.locationName}</dd></div>
						<div><dt>Garden Types</dt><dd>{garden.typeNames.length ? garden.typeNames.join(', ') : 'No types selected'}</dd></div>
						{garden.startDate && <div><dt>Start date</dt><dd><time dateTime={garden.startDate}>{garden.startDate}</time></dd></div>}
						{garden.endDate && <div><dt>End date</dt><dd><time dateTime={garden.endDate}>{garden.endDate}</time></dd></div>}
					</dl>
					{lifecycle}
					{garden.description && (
						<section class="garden-text" aria-labelledby="garden-description">
							<h2 id="garden-description">Description</h2>
							<p>{garden.description}</p>
						</section>
					)}
					{garden.notes && (
						<section class="garden-text" aria-labelledby="garden-notes">
							<h2 id="garden-notes">Garden Notes</h2>
							<p>{garden.notes}</p>
						</section>
					)}
					<AssociatedRecords associations={state.associations ?? { notes: [], tasks: [], wishlist: [] }} onRefresh={onRetry} />
					{deletion}
				</>
			)}
		</section>
	);
}

export async function discardGardenDraft(draft, drafts, {
	confirm = globalThis.confirm,
	onRemoved = () => {},
	setDiscardingId = () => {},
	setError = () => {},
} = {}) {
	if (!confirm(`Permanently discard the unfinished Garden “${draft.label}”?`)) return false;
	setDiscardingId(draft.id);
	setError('');
	try {
		await drafts.remove(draft.id);
		onRemoved();
		return true;
	} catch {
		setError('This Garden draft could not be discarded. Please try again.');
		return false;
	} finally {
		setDiscardingId(null);
	}
}

function useGardenDraftDiscard(drafts, onRemoved) {
	const [discardingId, setDiscardingId] = useState(null);
	const [draftError, setDraftError] = useState('');
	const discardDraft = (draft) => discardGardenDraft(draft, drafts, {
		onRemoved,
		setDiscardingId,
		setError: setDraftError,
	});
	return { discardDraft, discardingId, draftError };
}

export function Gardens() {
	const { repositories } = useStorage();
	const readers = useMemo(() => createGardenReaders(repositories), [repositories]);
	const load = useMemo(() => () => loadGardenOverview(readers), [readers]);
	const [state, retry] = useGardenRead(load);
	const { discardDraft, discardingId, draftError } = useGardenDraftDiscard(readers.drafts, retry);
	return <GardensOverviewView state={state} onRetry={retry} onDiscard={discardDraft} discardingId={discardingId} draftError={draftError} />;
}

export function GardenDrafts() {
	const { repositories } = useStorage();
	const readers = useMemo(() => createGardenReaders(repositories), [repositories]);
	const load = useMemo(() => () => loadGardenDrafts(readers), [readers]);
	const [state, retry] = useGardenRead(load);
	const { discardDraft, discardingId, draftError } = useGardenDraftDiscard(readers.drafts, retry);
	return (
		<GardenDraftsView
			state={state}
			onRetry={retry}
			onDiscard={discardDraft}
			discardingId={discardingId}
			draftError={draftError}
		/>
	);
}

function GardenDetailRecord({ id }) {
	const { repositories } = useStorage();
	const { route } = useLocation();
	const load = useMemo(() => {
		const readers = createGardenReaders(repositories);
		return () => loadGardenDetail(readers, id);
	}, [repositories, id]);
	const [state, retry] = useGardenRead(load);
	const lifecycle = state.status === 'ready' ? (
		<GardenLifecycle garden={state.garden} repository={repositories.gardens} onChanged={retry} />
	) : null;
	const deletion = state.status === 'ready' ? (
		<GardenDeletion garden={state.garden} repository={repositories.gardens} onDeleted={() => route('/gardens', true)} />
	) : null;
	const saveTemplate = state.status === 'ready' ? (
		<GardenSaveTemplate garden={state.garden} repository={repositories.gardenTemplates} />
	) : null;
	return <GardenDetailView state={state} onRetry={retry} lifecycle={lifecycle} deletion={deletion} saveTemplate={saveTemplate} />;
}

export function GardenDetail({ id }) {
	// Each URL owns its request state, including while Back/Forward changes IDs.
	return <GardenDetailRecord key={id} id={id} />;
}
