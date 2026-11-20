import Carousel from 'bootstrap/js/dist/carousel.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
	readShowWelcomeAtStartup,
	writeShowWelcomeAtStartup,
} from '../../services/welcomePreference.js';
import './style.css';

export const WELCOME_SLIDES_URL = '/assets/data/welcome-slides.json';
export const WELCOME_CAROUSEL_CONFIG = {
	autoplay: false,
	ends: 'wrap',
	keyboard: true,
	pause: false,
};

export async function loadWelcomeSlides(fetchSlides = globalThis.fetch) {
	const response = await fetchSlides(WELCOME_SLIDES_URL);
	if (!response.ok) throw new Error('Welcome slides could not be loaded.');
	const slides = await response.json();
	if (!Array.isArray(slides)) throw new Error('Welcome slide data is invalid.');
	return slides;
}

export function initializeWelcomeCarousel(element) {
	const carousel = new Carousel(element, WELCOME_CAROUSEL_CONFIG);
	return () => carousel.dispose();
}

export function WelcomeCarouselView({ slides, carouselRef = null }) {
	const carouselId = 'welcome-carousel';
	return (
		<div
			class="carousel carousel-fade carousel-overlay welcome-carousel"
			id={carouselId}
			ref={carouselRef}
			role="region"
			aria-roledescription="carousel"
			aria-label="Introduction to SOLACE Garden"
		>
			<div class="carousel-inner welcome-carousel__viewport">
				{slides.map((slide, index) => (
					<article class={`carousel-item welcome-carousel__slide${index === 0 ? ' active' : ''}`} key={slide.id}>
						<img class="welcome-carousel__image" src={slide.image} alt="" decoding="async" />
						<div class="welcome-carousel__shade" aria-hidden="true"></div>
						<div class="welcome-carousel__content">
							<p class="welcome-carousel__step">{index + 1} of {slides.length}</p>
							<h2>{slide.heading}</h2>
							{slide.subtitle && <p class="welcome-carousel__subtitle">{slide.subtitle}</p>}
							{slide.description && <p class="welcome-carousel__description">{slide.description}</p>}
							{slide.cta && (
								<a class="btn-solid theme-primary welcome-carousel__cta" href={slide.cta.href}>
									{slide.cta.label}
								</a>
							)}
						</div>
					</article>
				))}
			</div>
			<div class="carousel-overlay-controls welcome-carousel__controls">
				<button class="welcome-carousel__control" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="prev" aria-label="Previous introduction slide">
					<span class="carousel-icon-prev" aria-hidden="true"></span>
				</button>
				<div class="carousel-indicators welcome-carousel__indicators" aria-label="Choose an introduction slide">
					{slides.map((slide, index) => (
						<button
							key={slide.id}
							class={index === 0 ? 'active' : ''}
							type="button"
							data-bs-target={`#${carouselId}`}
							data-bs-slide-to={index}
							aria-label={`Go to slide ${index + 1}: ${slide.heading}`}
							aria-current={index === 0 ? 'true' : undefined}
						></button>
					))}
				</div>
				<button class="welcome-carousel__control" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="next" aria-label="Next introduction slide">
					<span class="carousel-icon-next" aria-hidden="true"></span>
				</button>
			</div>
		</div>
	);
}

function WelcomeCarousel({ slides }) {
	const root = useRef(null);
	useEffect(() => root.current ? initializeWelcomeCarousel(root.current) : undefined, []);
	return <WelcomeCarouselView slides={slides} carouselRef={root} />;
}

export function WelcomeView({
	slides,
	showWelcomeAtStartup,
	storageAvailable,
	onPreferenceChange,
}) {
	return (
		<section class="container welcome-page" aria-labelledby="welcome-title">
			<header class="welcome-page__header">
				<div>
					<p class="welcome-page__eyebrow">A quick introduction</p>
					<h1 id="welcome-title">Welcome to SOLACE Garden</h1>
				</div>
				<a class="btn-outline welcome-page__skip" href="/gardens">Skip Introduction / Go to Gardens</a>
			</header>
			<WelcomeCarousel slides={slides} />
			<div class="welcome-page__preference">
				<div class="form-field">
					<input
						class="check check-lg"
						type="checkbox"
						id="show-welcome-at-startup"
						checked={showWelcomeAtStartup}
						onChange={(event) => onPreferenceChange(event.currentTarget.checked)}
					/>
					<label for="show-welcome-at-startup">Show Welcome at startup</label>
				</div>
				{!storageAvailable && (
					<p class="welcome-page__storage-warning" role="status">
						This choice is active for this visit, but this browser did not allow it to be saved.
					</p>
				)}
			</div>
		</section>
	);
}

export function Welcome() {
	const [slidesState, setSlidesState] = useState({ status: 'loading', slides: [] });
	const [preference, setPreference] = useState(() => readShowWelcomeAtStartup());

	useEffect(() => {
		let cancelled = false;
		void loadWelcomeSlides().then(
			(slides) => { if (!cancelled) setSlidesState({ status: 'ready', slides }); },
			() => { if (!cancelled) setSlidesState({ status: 'error', slides: [] }); },
		);
		return () => { cancelled = true; };
	}, []);

	const updatePreference = (showWelcomeAtStartup) => {
		setPreference({
			showWelcomeAtStartup,
			storageAvailable: writeShowWelcomeAtStartup(showWelcomeAtStartup),
		});
	};

	if (slidesState.status === 'loading') {
		return <p class="container welcome-page__state" role="status">Loading Welcome…</p>;
	}
	if (slidesState.status === 'error') {
		return <p class="container welcome-page__state" role="alert">The Welcome introduction could not be loaded.</p>;
	}
	return (
		<WelcomeView
			slides={slidesState.slides}
			showWelcomeAtStartup={preference.showWelcomeAtStartup}
			storageAvailable={preference.storageAvailable}
			onPreferenceChange={updatePreference}
		/>
	);
}
