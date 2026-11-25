import { useLocation } from 'preact-iso';
import { AppDrawer } from '../components/AppDrawer.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { findRoute } from '../routes.js';
import { NotFound } from './_404.jsx';

export function PlaceholderPage() {
	const { path } = useLocation();
	const destination = findRoute(path);

	if (!destination || destination.path === '/') {
		return <NotFound />;
	}

	return (
		<>
		<section class="workspace-page placeholder-page" aria-labelledby="page-title">
			<PageHeader
				eyebrow="Workspace preview"
				title={destination.label}
				titleId="page-title"
				leading={<i class={`bi bi-${destination.icon}`} aria-hidden="true" />}
				description={destination.description}
			/>
			<div class="page-content placeholder-content">
			<p class="placeholder-page__status">
				This area will be connected in a later milestone.
			</p>
			<a class="app-button" href="/">
				<i class="bi bi-arrow-left" aria-hidden="true"></i>
				Back to Home
			</a>
			</div>
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
