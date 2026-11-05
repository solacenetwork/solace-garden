import { useLocation } from 'preact-iso';
import { useState } from 'preact/hooks';
import {
	getSettingsHref,
	navigationGroups,
	routeCatalog,
} from '../navigation.js';

export function StandardNavigation() {
	const { path } = useLocation();
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<aside class="standard-sidebar">
			<button
				class="standard-sidebar__toggle"
				type="button"
				aria-controls="standard-navigation"
				aria-expanded={isExpanded}
				onClick={() => setIsExpanded((expanded) => !expanded)}
			>
				<i class="bi bi-list" aria-hidden="true"></i>
				<span>Browse workspaces</span>
				<i
					class={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}
					aria-hidden="true"
				></i>
			</button>

			<nav
				id="standard-navigation"
				class={`standard-navigation${isExpanded ? ' is-expanded' : ''}`}
				aria-label="Standard Mode workspaces"
			>
				{navigationGroups.map((group) => {
					const routes = routeCatalog.filter(
						(route) => route.navigationGroup === group.id,
					);

					return (
						<section
							class="standard-navigation__group"
							aria-labelledby={`standard-navigation-${group.id}`}
							key={group.id}
						>
							<h2
								class="standard-navigation__heading"
								id={`standard-navigation-${group.id}`}
							>
								{group.label}
							</h2>
							<ul>
								{routes.map((route) => (
									<li key={route.path}>
										<a
											class="standard-navigation__link"
											href={
												route.id === 'settings'
													? getSettingsHref(path)
													: route.path
											}
											aria-current={path === route.path ? 'page' : undefined}
											onClick={() => setIsExpanded(false)}
										>
											<i class={`bi bi-${route.icon}`} aria-hidden="true"></i>
											<span>{route.label}</span>
										</a>
									</li>
								))}
							</ul>
						</section>
					);
				})}
			</nav>
		</aside>
	);
}
