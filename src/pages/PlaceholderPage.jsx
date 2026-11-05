import { useLocation } from 'preact-iso';
import { AppDrawer } from '../components/AppDrawer.jsx';
import { findRoute } from '../navigation.js';
import { NotFound } from './_404.jsx';

export function PlaceholderPage() {
	const { path } = useLocation();
	const destination = findRoute(path);

	if (!destination || destination.path === '/') {
		return <NotFound />;
	}

	return (
		<>
		<section class="container placeholder-page" aria-labelledby="page-title">
			<div class="placeholder-page__icon" aria-hidden="true">
				<i class={`bi bi-${destination.icon}`}></i>
			</div>
			<p class="placeholder-page__eyebrow">Workspace preview</p>
			<h1 id="page-title">{destination.label}</h1>
			<p>{destination.description}</p>
			<p class="placeholder-page__status">
				This area will be connected in a later milestone.
			</p>
			<a class="app-button" href="/">
				<i class="bi bi-arrow-left" aria-hidden="true"></i>
				Back to Home
			</a>
		</section>
		{destination.id === 'calendar' && (
			<AppDrawer
				id="calendar-information"
				title="About the Calendar workspace"
				triggerLabel="Info"
			>
				<div>
					<p>
						<strong>Contextual information prototype.</strong> This secondary panel
						can explain the current workspace without replacing its primary actions.
					</p>
					<p>
						Calendar events and reminders remain placeholder content until their
						feature milestone.
					</p>
				</div>
			</AppDrawer>
		)}
		</>
	);
}
