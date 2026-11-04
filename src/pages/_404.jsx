export function NotFound() {
	return (
		<section class="container placeholder-page" aria-labelledby="not-found-title">
			<div class="placeholder-page__icon" aria-hidden="true">
				<i class="bi bi-signpost-split"></i>
			</div>
			<p class="placeholder-page__eyebrow">Page not found</p>
			<h1 id="not-found-title">This path needs tending.</h1>
			<p>The page you requested is not part of the garden yet.</p>
			<a class="app-button" href="/">
				<i class="bi bi-house-door" aria-hidden="true"></i>
				Return Home
			</a>
		</section>
	);
}
