import { formatDateOnly } from './dashboardData.js';

function lifecycleLabel(garden) {
	if (garden.status === 'archived') return 'Archived';
	if (garden.status === 'completed') return 'Completed';
	if (garden.isClosed) return 'Closed';
	return null;
}

export function GardenPreviewCard({ garden, showLifecycle = false }) {
	const startDate = formatDateOnly(garden.startDate);
	const label = showLifecycle ? lifecycleLabel(garden) : null;

	return (
		<a class="home-garden-card card" href={`/gardens/${garden.id}`}>
			<div class="home-garden-card__visual" aria-hidden="true">
				<i class="bi bi-tree"></i>
			</div>
			<div class="card-body home-garden-card__body">
				{label && <span class="home-garden-card__lifecycle">{label}</span>}
				<h3 class="home-garden-card__title">{garden.name}</h3>
				{garden.subtitle && <p class="home-garden-card__subtitle">{garden.subtitle}</p>}
				{startDate && (
					<p class="home-garden-card__date">
						<span>Starts </span>
						<time dateTime={garden.startDate}>{startDate}</time>
					</p>
				)}
			</div>
		</a>
	);
}
