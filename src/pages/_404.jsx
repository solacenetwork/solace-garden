import { PageHeader } from '../components/PageHeader.jsx';

export function NotFound() {
	return (
		<section class="workspace-page placeholder-page" aria-labelledby="not-found-title">
			<PageHeader
				eyebrow="Page not found"
				title="This path needs tending."
				titleId="not-found-title"
				leading={<i class="bi bi-signpost-split" aria-hidden="true" />}
			/>
			<div class="page-content placeholder-content">
			<p>The page you requested is not part of the garden yet.</p>
			<a class="app-button" href="/">
				<i class="bi bi-house-door" aria-hidden="true"></i>
				Return Home
			</a>
			</div>
		</section>
	);
}
