import { useLocation } from 'preact-iso';
import { findRoute } from '../navigation.js';
import { NotFound } from './_404.jsx';

export function PlaceholderPage() {
	const { path } = useLocation();
	const destination = findRoute(path);

	if (!destination || destination.path === '/') {
		return <NotFound />;
	}

	return (
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
	);
}
