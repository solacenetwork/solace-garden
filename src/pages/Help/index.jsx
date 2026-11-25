import '../secondary.css';
import { PageHeader } from '../../components/PageHeader.jsx';

export function Help() {
	return (
		<section class="workspace-page secondary-page" aria-labelledby="help-title">
			<PageHeader
				title="Help"
				titleId="help-title"
				leading={<i class="bi bi-question-circle" aria-hidden="true" />}
				description="Find information about using SOLACE Garden."
			/>

			<div class="page-content secondary-page__sections">
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
