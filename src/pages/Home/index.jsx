import {
	primaryActions,
	getSettingsHref,
	navigationGroups,
	routeCatalog,
	secondaryDestinations,
} from '../../navigation.js';
import { useInterfaceMode } from '../../context/InterfaceModeContext.jsx';
import './style.css';

export function Home() {
	const { effectiveMode } = useInterfaceMode();

	if (effectiveMode === 'standard') {
		return <StandardHome />;
	}

	return (
		<div class="container home-page">
			<section class="home-intro" aria-labelledby="home-title">
				<p class="home-intro__eyebrow">Simple Mode preview</p>
				<h1 id="home-title">What would you like to do?</h1>
				<p class="home-intro__summary">
					Choose a garden activity to get started. These workspaces are
					placeholders while the first version takes root.
				</p>
			</section>

			<nav class="action-grid" aria-label="Garden actions">
				{primaryActions.map((action) => (
					<a class="action-card" href={action.path} key={action.path}>
						<span class="action-card__icon" aria-hidden="true">
							<i class={`bi bi-${action.icon}`}></i>
						</span>
						<span class="action-card__label">{action.label}</span>
						<span class="action-card__detail">{action.detail}</span>
					</a>
				))}
			</nav>

			<section
				class="workspace-directory"
				aria-labelledby="workspace-directory-title"
			>
				<div class="workspace-directory__intro">
					<p class="workspace-directory__eyebrow">Workspace directory</p>
					<h2 id="workspace-directory-title">More places to explore</h2>
					<p>
						Open the remaining V1 workspaces while their features are being built.
					</p>
				</div>
				<nav aria-label="Additional Garden workspaces">
					<ul class="workspace-directory__links">
						{secondaryDestinations.map((destination) => (
							<li key={destination.path}>
								<a
									class="workspace-link"
									href={
										destination.id === 'settings'
											? getSettingsHref('/')
											: destination.path
									}
								>
									<i class={`bi bi-${destination.icon}`} aria-hidden="true"></i>
									<span>{destination.label}</span>
								</a>
							</li>
						))}
					</ul>
				</nav>
			</section>
		</div>
	);
}

function StandardHome() {
	return (
		<div class="container standard-home">
			<section class="standard-home__intro" aria-labelledby="home-title">
				<p class="home-intro__eyebrow">Standard Mode</p>
				<h1 id="home-title">Your garden workspaces</h1>
				<p>
					Choose a workspace to plan, track, and explore your garden. Features
					are being added as the application grows.
				</p>
			</section>

			{navigationGroups.map((group) => {
				const destinations = routeCatalog.filter(
					(route) =>
						route.navigationGroup === group.id && route.path !== '/',
				);

				if (destinations.length === 0) {
					return null;
				}

				return (
					<section
						class="standard-home__group"
						aria-labelledby={`home-group-${group.id}`}
						key={group.id}
					>
						<h2 id={`home-group-${group.id}`}>{group.label}</h2>
						<div class="standard-home__grid">
							{destinations.map((destination) => (
								<a
									class="standard-home__card"
									href={
										destination.id === 'settings'
											? getSettingsHref('/')
											: destination.path
									}
									key={destination.path}
								>
									<i class={`bi bi-${destination.icon}`} aria-hidden="true"></i>
									<span class="standard-home__card-title">
										{destination.label}
									</span>
									<span class="standard-home__card-description">
										{destination.description}
									</span>
								</a>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}
