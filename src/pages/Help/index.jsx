import '../secondary.css';

export function Help() {
	return (
		<section class="container secondary-page" aria-labelledby="help-title">
			<header class="secondary-page__header">
				<h1 id="help-title"><i class="bi bi-question-circle" aria-hidden="true"></i> Help</h1>
				<p>Find information about using SOLACE Garden.</p>
			</header>

			<div class="secondary-page__sections">
				<section class="card" aria-labelledby="help-getting-started-title">
					<div class="card-body">
						<h2 id="help-getting-started-title"><i class="bi bi-stars" aria-hidden="true"></i> Getting Started</h2>
						<p>Revisit the introduction to SOLACE Garden.</p>
						<a class="btn-outline align-self-start" href="/welcome">View Welcome introduction</a>
					</div>
				</section>

				<section class="card" aria-labelledby="help-documentation-title">
					<div class="card-body">
						<h2 id="help-documentation-title"><i class="bi bi-book" aria-hidden="true"></i> Documentation</h2>
						<p>User guides and frequently asked questions.</p>
						<p class="secondary-page__planned"><i class="bi bi-clock" aria-hidden="true"></i> Planned for a future release.</p>
					</div>
				</section>

				<section class="card" aria-labelledby="help-support-title">
					<div class="card-body">
						<h2 id="help-support-title"><i class="bi bi-life-preserver" aria-hidden="true"></i> Support</h2>
						<p>Get assistance with SOLACE Garden.</p>
						<p class="secondary-page__planned"><i class="bi bi-clock" aria-hidden="true"></i> Planned for a future release.</p>
					</div>
				</section>
			</div>
		</section>
	);
}
