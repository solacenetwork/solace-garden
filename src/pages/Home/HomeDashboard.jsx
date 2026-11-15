import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CardCarousel } from '../../components/CardCarousel.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createGardensService } from '../../services/gardens.js';
import { createListItemsService } from '../../services/listItems.js';
import { readGardenPreviews, readListPreview } from './dashboardData.js';
import { GardenPreviewCard } from './GardenPreviewCard.jsx';

const initialGardens = { status: 'loading', current: [], previous: [] };
const initialList = { status: 'loading', items: [] };

function SectionHeader({ id, title, href, linkLabel = 'View all' }) {
	return (
		<header class="home-dashboard__section-header">
			<h2 id={id}>{title}</h2>
			<a href={href}>{linkLabel}</a>
		</header>
	);
}

function LoadingState({ children }) {
	return <div class="home-dashboard__state" role="status">{children}</div>;
}

function ErrorState({ children, onRetry }) {
	return (
		<div class="home-dashboard__state home-dashboard__state--error" role="alert">
			<p>{children}</p>
			<button class="btn-outline theme-primary" type="button" onClick={onRetry}>
				Retry
			</button>
		</div>
	);
}

function EmptyState({ children, actionHref, actionLabel }) {
	return (
		<div class="home-dashboard__state home-dashboard__state--empty">
			<p>{children}</p>
			{actionHref && (
				<a class="btn-outline theme-primary" href={actionHref}>{actionLabel}</a>
			)}
		</div>
	);
}

function GardenSection({ id, title, state, collection, onRetry, previous = false }) {
	const gardens = state[collection];
	return (
		<section class="home-dashboard__section" aria-labelledby={id}>
			<SectionHeader id={id} title={title} href="/gardens" />
			{state.status === 'loading' ? (
				<LoadingState>Loading {title}…</LoadingState>
			) : state.status === 'error' ? (
				<ErrorState onRetry={onRetry}>Your Gardens could not be loaded.</ErrorState>
			) : gardens.length === 0 ? (
				<EmptyState
					actionHref={previous ? undefined : '/gardens/new'}
					actionLabel="Create Your First Garden"
				>
					{previous ? 'No previous Gardens yet.' : 'Your Gardens will appear here.'}
				</EmptyState>
			) : (
				<CardCarousel label={title} id={`home-${collection}-gardens-carousel`}>
					{gardens.map((garden) => (
						<GardenPreviewCard
							garden={garden}
							key={garden.id}
							showLifecycle={previous}
						/>
					))}
				</CardCarousel>
			)}
		</section>
	);
}

function ListPreview({ kind, state }) {
	const completedLabel = kind === 'task' ? 'Completed' : 'Purchased';
	return (
		<ol class="home-preview-list">
			{state.items.map((item) => (
				<li
					class={`home-preview-list__item${item.completed ? ' home-preview-list__item--completed' : ''}`}
					key={item.id}
				>
					<i class={`bi bi-${item.completed ? 'check-circle-fill' : 'circle'}`} aria-hidden="true"></i>
					<span class="home-preview-list__text">{item.text}</span>
					{kind === 'wishlist' && item.quantity && (
						<span class="home-preview-list__quantity">Qty: {item.quantity}</span>
					)}
					{item.completed && <span class="visually-hidden"> — {completedLabel}</span>}
				</li>
			))}
		</ol>
	);
}

function ListSection({ id, title, href, kind, state, onRetry }) {
	return (
		<section class="home-dashboard__section" aria-labelledby={id}>
			<SectionHeader id={id} title={title} href={href} />
			{state.status === 'loading' ? (
				<LoadingState>Loading {title}…</LoadingState>
			) : state.status === 'error' ? (
				<ErrorState onRetry={onRetry}>{title} could not be loaded.</ErrorState>
			) : state.items.length === 0 ? (
				<EmptyState
					actionHref={`${href}#lists-quick-text`}
					actionLabel={kind === 'task' ? 'Add a Task' : 'Add an Item'}
				>
					{kind === 'task' ? 'No tasks yet.' : 'Your Wish List is empty.'}
				</EmptyState>
			) : (
				<ListPreview kind={kind} state={state} />
			)}
		</section>
	);
}

export function HomeDashboardView({
	gardens,
	tasks,
	wishlist,
	retryGardens,
	retryTasks,
	retryWishlist,
}) {
	return (
		<div class="home-dashboard" data-home-dashboard>
			<GardenSection id="home-current-gardens" title="Current Gardens" state={gardens} collection="current" onRetry={retryGardens} />
			<ListSection id="home-tasks" title="Tasks" href="/tasks" kind="task" state={tasks} onRetry={retryTasks} />
			<ListSection id="home-wishlist" title="Wish List" href="/wishlist" kind="wishlist" state={wishlist} onRetry={retryWishlist} />
			<section class="home-dashboard__section" aria-labelledby="home-gallery">
				<SectionHeader id="home-gallery" title="Gallery" href="/photos" linkLabel="View Gallery placeholder" />
				<div class="home-dashboard__state home-dashboard__state--unavailable">
					<p>Gallery is not available yet.</p>
				</div>
			</section>
			<GardenSection id="home-previous-gardens" title="Previous Gardens" state={gardens} collection="previous" onRetry={retryGardens} previous />
		</div>
	);
}

export function HomeDashboard() {
	const storage = useStorage();
	const gardensService = useMemo(
		() => createGardensService(storage.repositories.gardens),
		[storage],
	);
	const listsService = useMemo(
		() => createListItemsService(storage.repositories.listItems),
		[storage],
	);
	const requests = useRef({ gardens: 0, tasks: 0, wishlist: 0 });
	const [gardens, setGardens] = useState(initialGardens);
	const [tasks, setTasks] = useState(initialList);
	const [wishlist, setWishlist] = useState(initialList);

	async function loadGardens() {
		const request = ++requests.current.gardens;
		setGardens(initialGardens);
		try {
			const result = await readGardenPreviews(gardensService);
			if (request === requests.current.gardens) {
				setGardens({ status: 'ready', ...result });
			}
		} catch {
			if (request === requests.current.gardens) {
				setGardens({ status: 'error', current: [], previous: [] });
			}
		}
	}

	async function loadList(kind, setState) {
		const requestKey = kind === 'task' ? 'tasks' : 'wishlist';
		const request = ++requests.current[requestKey];
		setState(initialList);
		try {
			const items = await readListPreview(listsService, kind);
			if (request === requests.current[requestKey]) {
				setState({ status: 'ready', items });
			}
		} catch {
			if (request === requests.current[requestKey]) {
				setState({ status: 'error', items: [] });
			}
		}
	}

	useEffect(() => {
		void loadGardens();
		void loadList('task', setTasks);
		void loadList('wishlist', setWishlist);

		return () => {
			requests.current.gardens += 1;
			requests.current.tasks += 1;
			requests.current.wishlist += 1;
		};
	}, [gardensService, listsService]);

	return (
		<HomeDashboardView
			gardens={gardens}
			tasks={tasks}
			wishlist={wishlist}
			retryGardens={loadGardens}
			retryTasks={() => loadList('task', setTasks)}
			retryWishlist={() => loadList('wishlist', setWishlist)}
		/>
	);
}
