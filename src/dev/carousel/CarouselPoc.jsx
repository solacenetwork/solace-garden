import { useEffect, useState } from 'preact/hooks';
import { CardCarousel } from '../../components/CardCarousel.jsx';
import './style.css';

export const gallerySamples = [
	{
		id: 'raised-beds',
		src: '/assets/temp/stock-images/card-demo-raised-beds.jpg',
		alt: 'Raised garden beds surrounded by green plants',
		caption: 'Raised beds after spring planting',
		fit: 'cover',
	},
	{
		id: 'flower-beds',
		src: '/assets/temp/stock-images/card-demo-flower-beds.jpg',
		alt: 'Colorful flowers growing in a garden bed',
		caption: 'Pollinator bed in bloom',
		fit: 'contain',
	},
	{
		id: 'fruit-trees',
		src: '/assets/temp/stock-images/card-demo-fruit-trees.jpg',
		alt: 'Fruit trees growing in an orchard',
		caption: 'Young orchard trees',
		fit: 'cover',
	},
	{
		id: 'container-garden',
		src: '/assets/temp/stock-images/card-demo-container-garden.jpg',
		alt: 'Vegetables growing in containers',
		caption: 'Container garden',
		fit: 'contain',
	},
	{
		id: 'in-ground',
		src: '/assets/temp/stock-images/card-demo-in-ground.jpg',
		alt: 'Rows of vegetables growing in the ground',
		caption: 'In-ground vegetable rows',
		fit: 'cover',
	},
	{
		id: 'edible-bushes',
		src: '/assets/temp/stock-images/card-demo-edible-bushes.jpg',
		alt: 'Edible berry bushes in a garden',
		caption: 'Edible bushes along the fence',
		fit: 'contain',
	},
	{
		id: 'seedlings',
		src: '/assets/temp/stock-images/pexels-elle-hughes-2696064.jpg',
		alt: 'Hands tending young plants in a garden',
		caption: 'Checking young plants',
		fit: 'cover',
	},
	{
		id: 'harvest',
		src: '/assets/temp/stock-images/pexels-sarah-chai-7262863.jpg',
		alt: 'Fresh produce arranged after harvest',
		caption: 'A colorful harvest',
		fit: 'contain',
	},
];

export const gardenSamples = [
	{
		id: 'kitchen', title: 'Kitchen Garden', subtitle: 'Back patio beds',
		startDate: 'March 18, 2026', image: gallerySamples[0],
	},
	{
		id: 'community', title: 'Maple Street Community Garden Plot 14B',
		subtitle: 'Shared neighborhood plot with an intentionally long identifying name',
		startDate: 'April 2, 2026', image: gallerySamples[4],
	},
	{
		id: 'pollinator', title: 'Pollinator Border', subtitle: null,
		startDate: 'April 20, 2026', image: gallerySamples[1],
	},
	{
		id: 'orchard', title: 'Small Fruit Orchard', subtitle: 'North fence',
		startDate: 'October 9, 2025', image: gallerySamples[2],
	},
	{
		id: 'containers', title: 'Herbs, Greens, Tomatoes, and Peppers in Containers',
		subtitle: 'Sunny deck collection', startDate: 'May 6, 2026', image: gallerySamples[3],
	},
	{
		id: 'shade', title: 'Shade Garden', subtitle: 'Under the old maple',
		startDate: 'May 12, 2026', image: null,
	},
	{
		id: 'berries', title: 'Berry Patch', subtitle: null,
		startDate: 'March 30, 2026', image: gallerySamples[5],
	},
	{
		id: 'winter', title: 'Winter Sowing Experiment', subtitle: 'Milk-jug seedlings',
		startDate: 'January 15, 2026', image: null,
	},
];

function GardenCard({ garden, onSelect }) {
	return (
		<a
			class="prototype-card prototype-garden-card"
			href={`#prototype-${garden.id}`}
			onClick={(event) => {
				event.preventDefault();
				onSelect(garden.title);
			}}
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

function GalleryCard({ image }) {
	return (
		<figure class="prototype-card prototype-gallery-card">
			<div class={`prototype-gallery-card__image prototype-gallery-card__image--${image.fit}`}>
				<img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
			</div>
			<figcaption>
				<span>{image.caption}</span>
				<small>{image.fit === 'contain' ? 'Contained image' : 'Cropped image'}</small>
			</figcaption>
		</figure>
	);
}

const edgeCollections = [0, 1, 2, 3].map((count) => ({
	count,
	items: gardenSamples.slice(0, count),
}));

function useViewportWidth() {
	const [width, setWidth] = useState(() => globalThis.innerWidth ?? 0);

	useEffect(() => {
		const updateWidth = () => setWidth(globalThis.innerWidth ?? 0);
		globalThis.addEventListener('resize', updateWidth);
		return () => globalThis.removeEventListener('resize', updateWidth);
	}, []);

	return width;
}

export function CarouselPoc() {
	const viewportWidth = useViewportWidth();
	const [selection, setSelection] = useState('No prototype Garden selected.');
	const [dynamicGardens, setDynamicGardens] = useState(gardenSamples.slice(0, 4));
	const [unrelatedCount, setUnrelatedCount] = useState(0);
	const selectGarden = (title) => setSelection(`Selected ${title}.`);

	return (
		<main class="carousel-poc">
			<header class="carousel-poc__intro">
				<p class="carousel-poc__eyebrow">Development experiment</p>
				<h1>Bootstrap 6 card carousel proof of concept</h1>
				<p>
					Static sample content only. Drag or swipe a rail, use its Previous and
					Next controls, and test card links with a pointer and keyboard.
				</p>
				<p class="carousel-poc__viewport" aria-live="polite">
					Viewport: <strong>{viewportWidth}px</strong>
				</p>
			</header>

			<section class="carousel-poc__example" aria-labelledby="garden-filmstrip-title">
				<div class="carousel-poc__heading">
					<div>
						<p>Example A</p>
						<h2 id="garden-filmstrip-title">Garden card filmstrip</h2>
					</div>
					<p class="carousel-poc__selection" id="carousel-selection" role="status" aria-live="polite">
						{selection}
					</p>
				</div>
				<CardCarousel
					id="prototype-gardens"
					label="Prototype Garden cards"
				>
					{gardenSamples.map((garden) => (
						<GardenCard garden={garden} onSelect={selectGarden} key={garden.id} />
					))}
				</CardCarousel>
			</section>

			<section class="carousel-poc__example" aria-labelledby="gallery-filmstrip-title">
				<div class="carousel-poc__heading">
					<div>
						<p>Example B</p>
						<h2 id="gallery-filmstrip-title">Gallery image filmstrip</h2>
					</div>
					<p>Alternating crop and contain treatments use original sample ratios.</p>
				</div>
				<CardCarousel
					id="prototype-gallery"
					label="Prototype Gallery images"
				>
					{gallerySamples.map((image) => <GalleryCard image={image} key={image.id} />)}
				</CardCarousel>
			</section>

			<section class="carousel-poc__example" aria-labelledby="edge-cases-title">
				<div class="carousel-poc__heading">
					<div>
						<p>Example C</p>
						<h2 id="edge-cases-title">Small collections and edge cases</h2>
					</div>
					<p>Controls appear only when a rail has measurable overflow.</p>
				</div>
				<div class="carousel-poc__edge-grid">
					{edgeCollections.map(({ count, items }) => (
						<section class="carousel-poc__edge" aria-labelledby={`edge-${count}-title`} key={count}>
							<h3 id={`edge-${count}-title`}>{count} {count === 1 ? 'card' : 'cards'}</h3>
							<CardCarousel
								id={`prototype-edge-${count}`}
								label={`${count}-card edge case`}
							>
								{items.map((garden) => (
									<GardenCard garden={garden} onSelect={selectGarden} key={garden.id} />
								))}
							</CardCarousel>
							{count === 0 && <p class="prototype-carousel__empty">No cards in this collection.</p>}
						</section>
					))}
				</div>
			</section>

			<section class="carousel-poc__example" aria-labelledby="dynamic-children-title">
				<div class="carousel-poc__heading">
					<div>
						<p>Example D</p>
						<h2 id="dynamic-children-title">Dynamic children in a constrained container</h2>
					</div>
					<p>Unrelated parent updates: {unrelatedCount}</p>
				</div>
				<div class="carousel-poc__actions">
					<button type="button" onClick={() => setDynamicGardens((items) => (
						items.length < gardenSamples.length ? [...items, gardenSamples[items.length]] : items
					))}>Add card</button>
					<button type="button" onClick={() => setDynamicGardens((items) => items.slice(0, -1))}>Remove card</button>
					<button type="button" onClick={() => setDynamicGardens((items) => [...items].reverse())}>Reverse cards</button>
					<button type="button" onClick={() => setDynamicGardens((items) => items.map((garden, index) => (
						index === 0 ? { ...garden, title: `${garden.title} updated` } : garden
					)))}>Update first title</button>
					<button type="button" onClick={() => setUnrelatedCount((count) => count + 1)}>Update parent only</button>
					<button type="button" onClick={() => setDynamicGardens(gardenSamples.slice(0, 4))}>Reset</button>
				</div>
				<div class="carousel-poc__constrained">
					<CardCarousel label="Dynamic constrained Garden cards">
						{dynamicGardens.map((garden) => (
							<GardenCard garden={garden} onSelect={selectGarden} key={garden.id} />
						))}
					</CardCarousel>
				</div>
			</section>
		</main>
	);
}
