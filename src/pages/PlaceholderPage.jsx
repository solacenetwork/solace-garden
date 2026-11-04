import { useLocation } from 'preact-iso';
import { primaryActions } from '../navigation.js';

export function PlaceholderPage() {
	const { url } = useLocation();
	const action = primaryActions.find(({ path }) => path === url);

	if (!action) {
		return null;
	}

	return (
		<section class="container placeholder-page" aria-labelledby="page-title">
		<div class="placeholder-page__icon" aria-hidden="true">
			<i class={`bi bi-${action.icon}`}></i>
		</div>
		<p class="placeholder-page__eyebrow">Workspace preview</p>
		<h1 id="page-title">{action.label}</h1>
		<p>{action.description}</p>
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
