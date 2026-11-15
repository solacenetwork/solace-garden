import { findRouteById, getSettingsHref } from '../../routes.js';
import { navigationGroups } from '../../navigation.js';
import { useInterfaceMode } from '../../context/InterfaceModeContext.jsx';
import { SimpleNavigationCards } from './SimpleNavigationCards.jsx';
import './style.css';

export function Home() {
	const { effectiveMode } = useInterfaceMode();

	if (effectiveMode === 'standard') {
		return <StandardHome />;
	}

	return (
		<div class="container home-page">
			<section class="home-intro" aria-labelledby="home-title">
				<h1 id="home-title">Where would you like to go?</h1>
			</section>

			<SimpleNavigationCards />
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
				const destinations = group.destinationIds.map(findRouteById).filter(
					(route) => route.path !== '/',
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
