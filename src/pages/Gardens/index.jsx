import { useEffect, useMemo, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { createGardenReaders, loadGardenDetail, loadGardenOverview } from './viewModel.js';
import { GardenLifecycle } from './GardenLifecycle.jsx';
import './style.css';

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

function GardenSection({ title, id, items, emptyMessage }) {
	return (
		<section class="gardens-section" aria-labelledby={id}>
			<h2 id={id}>{title}</h2>
			{items.length === 0 ? <p class="gardens-state">{emptyMessage}</p> : (
				<ul class="gardens-grid">
					{items.map((garden) => (
						<li key={garden.id}>
							<a class="garden-card" href={garden.href}>
								<i class="bi bi-tree garden-card__icon" aria-hidden="true"></i>
								<div class="garden-card__content">
									<h3>{garden.name}</h3>
									{garden.subtitle && <p class="garden-subtitle">{garden.subtitle}</p>}
									<p class="garden-location"><i class="bi bi-geo-alt" aria-hidden="true"></i> {garden.locationName}</p>
									<span class="badge">{garden.statusLabel}</span>
								</div>
								<i class="bi bi-chevron-right" aria-hidden="true"></i>
							</a>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function GardenDraftSection({ drafts = [], onDiscard, discardingId }) {
	if (!drafts.length) return null;
	return <section class="gardens-section garden-drafts" aria-labelledby="garden-drafts-title"><h2 id="garden-drafts-title">Unfinished Gardens</h2><p>Continue a saved creation draft or discard one you no longer need.</p><ul class="garden-drafts__list">{drafts.map((draft) => <li class="garden-draft-card" key={draft.id}><a href={draft.href}><i class="bi bi-pencil-square" aria-hidden="true"></i><span><strong>{draft.label}</strong><small>Continue draft</small></span></a><button class="btn-text theme-danger" type="button" disabled={discardingId === draft.id} onClick={() => onDiscard(draft)}><i class="bi bi-trash3" aria-hidden="true"></i>{discardingId === draft.id ? 'Discarding…' : 'Discard Draft'}</button></li>)}</ul></section>;
}

export function GardensOverviewView({ state, onRetry, onDiscard = () => {}, discardingId = null, draftError = '' }) {
	return (
		<section class="container gardens-page" aria-labelledby="gardens-title">
			<header class="gardens-header gardens-header--overview">
				<div>
					<h1 id="gardens-title">Gardens</h1>
					<p>Browse your current growing projects and revisit previous Gardens.</p>
				</div>
				<a class="btn-solid theme-primary gardens-create-action" href="/gardens/new">
					<i class="bi bi-plus-lg" aria-hidden="true"></i> Create Garden
				</a>
			</header>
			{state.status !== 'ready' ? <ReadState state={state} onRetry={onRetry} /> : (
				<>
					{draftError && <div class="garden-create__error" role="alert">{draftError}</div>}
					<GardenDraftSection drafts={state.drafts} onDiscard={onDiscard} discardingId={discardingId} />
					{state.current.length + state.previous.length === 0 && (
						<p class="gardens-state">No Gardens saved yet. Your growing projects will appear here once created.</p>
					)}
					<GardenSection title="Current Gardens" id="current-gardens" items={state.current} emptyMessage="No Planned or Active Gardens." />
					<GardenSection title="Previous Gardens" id="previous-gardens" items={state.previous} emptyMessage="No Completed or Archived Gardens." />
				</>
			)}
		</section>
	);
}

export function GardenDetailView({ state, onRetry, lifecycle = null }) {
	const garden = state.garden;
	return (
		<section class="container gardens-page" aria-label="Garden details">
			<a class="btn-outline gardens-back" href="/gardens">
				<i class="bi bi-arrow-left" aria-hidden="true"></i> All Gardens
			</a>
			{state.status !== 'ready' ? <ReadState state={state} onRetry={onRetry} /> : (
				<>
					<header class="gardens-header garden-detail__header">
						<div>
							<h1>{garden.name}</h1>
							{garden.subtitle && <p class="garden-subtitle">{garden.subtitle}</p>}
						</div>
						{!garden.isClosed && garden.status !== 'archived' && (
							<a class="btn-solid theme-primary garden-detail__edit" href={`/gardens/${garden.id}/edit`}>
								<i class="bi bi-pencil" aria-hidden="true"></i> Edit Garden
							</a>
						)}
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
				</>
			)}
		</section>
	);
}

export function Gardens() {
	const { repositories } = useStorage();
	const load = useMemo(() => {
		const readers = createGardenReaders(repositories);
		return () => loadGardenOverview(readers);
	}, [repositories]);
	const [state, retry] = useGardenRead(load);
	const [discardingId, setDiscardingId] = useState(null);
	const [draftError, setDraftError] = useState('');
	async function discardDraft(draft) {
		if (!globalThis.confirm(`Permanently discard the unfinished Garden “${draft.label}”?`)) return;
		setDiscardingId(draft.id);
		setDraftError('');
		try {
			await createGardenReaders(repositories).drafts.remove(draft.id);
			retry();
		} catch {
			setDraftError('This Garden draft could not be discarded. Please try again.');
		} finally {
			setDiscardingId(null);
		}
	}
	return <GardensOverviewView state={state} onRetry={retry} onDiscard={discardDraft} discardingId={discardingId} draftError={draftError} />;
}

function GardenDetailRecord({ id }) {
	const { repositories } = useStorage();
	const load = useMemo(() => {
		const readers = createGardenReaders(repositories);
		return () => loadGardenDetail(readers, id);
	}, [repositories, id]);
	const [state, retry] = useGardenRead(load);
	const lifecycle = state.status === 'ready' ? (
		<GardenLifecycle garden={state.garden} repository={repositories.gardens} onChanged={retry} />
	) : null;
	return <GardenDetailView state={state} onRetry={retry} lifecycle={lifecycle} />;
}

export function GardenDetail({ id }) {
	// Each URL owns its request state, including while Back/Forward changes IDs.
	return <GardenDetailRecord key={id} id={id} />;
}
