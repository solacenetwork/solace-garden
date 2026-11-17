import { useState } from 'preact/hooks';
import { CardCarousel } from '../../components/CardCarousel.jsx';
import { gardenSamples } from '../carousel/CarouselPoc.jsx';
import '../carousel/style.css';
import './style.css';

export function GardenCard({ garden }) {
	return (
		<a
			class="prototype-card prototype-garden-card"
			href={`#prototype-${garden.id}`}
		>
			{garden.image ? (
				<img src={garden.image.src} alt="" loading="lazy" decoding="async" />
			) : (
				<span class="prototype-garden-card__placeholder" aria-hidden="true">
					<i class="bi bi-tree"></i>
				</span>
			)}
			<span class="prototype-garden-card__body">
				<strong>{garden.title}</strong>
				{garden.subtitle && <span>{garden.subtitle}</span>}
				<time>Started {garden.startDate}</time>
			</span>
		</a>
	);
}

export function GardenCollection() {
	const [expanded, setExpanded] = useState(false);

	return (
		<section class="hubtest-collection" aria-labelledby="hubtest-current-gardens-title">
			<div class="hubtest-collection__heading">
				<h2 id="hubtest-current-gardens-title">Current Gardens</h2>
				<button
					class="btn-outline theme-primary"
					type="button"
					aria-expanded={expanded}
					aria-controls="hubtest-current-gardens-collection"
					onClick={() => setExpanded((value) => !value)}
				>
					{expanded ? 'Collapse' : 'View All'}
				</button>
			</div>
			<div
				id="hubtest-current-gardens-collection"
				data-presentation={expanded ? 'grid' : 'filmstrip'}
			>
				{expanded ? (
					<ul class="hubtest-garden-grid" aria-label="All Current Gardens">
						{gardenSamples.map((garden) => (
							<li key={garden.id}>
								<GardenCard garden={garden} />
							</li>
						))}
					</ul>
				) : (
					<CardCarousel
						id="hubtest-current-gardens-carousel"
						label="Current Gardens"
					>
						{gardenSamples.map((garden) => (
							<GardenCard garden={garden} key={garden.id} />
						))}
					</CardCarousel>
				)}
			</div>
		</section>
	);
}

export function HubTest() {
	return (
		<main class="hubtest">
			<header class="hubtest__intro">
				<p class="hubtest__eyebrow">Development experiment</p>
				<h1>Expandable Garden filmstrip</h1>
				<p>
					Compare a compact horizontal Garden collection with an expanded
					responsive grid. This prototype uses static sample content only.
				</p>
			</header>
			<GardenCollection />
		</main>
	);
}
