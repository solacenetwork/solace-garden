import { PageHeader } from '../../components/PageHeader.jsx';

export function Harvest() {
	return (
		<section class="workspace-page placeholder-page" aria-labelledby="harvest-title">
			<PageHeader
				eyebrow="Garden activity"
				title="Harvest"
				titleId="harvest-title"
				leading={<i class="bi bi-basket2" aria-hidden="true" />}
			/>
			<div class="page-content placeholder-content">
			<p>Harvest recording and history will be available through your Gardens and Plant Groups in a future release.</p>
			<a class="app-button" href="/gardens">
				<i class="bi bi-arrow-left" aria-hidden="true"></i>
				Back to Gardens
			</a>
			</div>
		</section>
	);
}
