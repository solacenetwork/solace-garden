import { toChildArray } from 'preact';
import Carousel from 'bootstrap/js/dist/carousel.js';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import './CardCarousel.css';

export const CARD_CAROUSEL_CONFIG = {
	autoplay: false,
	ends: 'stop',
	keyboard: true,
	pause: false,
};

export function initializeCardCarousel(element, viewport, onOverflowChange) {
	let instance = new Carousel(element, CARD_CAROUSEL_CONFIG);
	let initialMeasureFrame = null;
	let active = true;
	const updateOverflow = () => {
		if (!active) return;
		onOverflowChange(viewport.scrollWidth > viewport.clientWidth + 1);
	};
	const resizeObserver = globalThis.ResizeObserver
		? new ResizeObserver(updateOverflow)
		: null;
	const mutationObserver = globalThis.MutationObserver
		? new MutationObserver(() => {
			if (!active) return;
			instance.dispose();
			instance = new Carousel(element, CARD_CAROUSEL_CONFIG);
			updateOverflow();
		})
		: null;

	resizeObserver?.observe(viewport);
	mutationObserver?.observe(viewport, { childList: true });

	if (!resizeObserver) {
		globalThis.addEventListener('resize', updateOverflow);
		if (globalThis.requestAnimationFrame) {
			initialMeasureFrame = globalThis.requestAnimationFrame(updateOverflow);
		} else {
			updateOverflow();
		}
	}

	return () => {
		active = false;
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
		if (!resizeObserver) {
			globalThis.removeEventListener('resize', updateOverflow);
			if (initialMeasureFrame !== null) {
				globalThis.cancelAnimationFrame?.(initialMeasureFrame);
			}
		}
		instance.dispose();
	};
}

export function CardCarousel({ children, label, id, className = '', onOverflowChange }) {
	const generatedId = useId();
	const carouselId = id ?? `card-carousel-${generatedId}`;
	const root = useRef(null);
	const viewport = useRef(null);
	const overflowCallback = useRef(onOverflowChange);
	const [hasOverflow, setHasOverflow] = useState(false);
	const items = toChildArray(children);
	overflowCallback.current = onOverflowChange;

	useLayoutEffect(() => {
		if (!root.current || !viewport.current) return undefined;
		return initializeCardCarousel(root.current, viewport.current, (overflow) => {
			setHasOverflow(overflow);
			overflowCallback.current?.(overflow);
		});
	}, []);

	return (
		<div
			class={`carousel card-carousel${className ? ` ${className}` : ''}`}
			id={carouselId}
			ref={root}
			role="region"
			aria-roledescription="carousel"
			aria-label={label}
		>
			<div class="carousel-inner card-carousel__viewport" ref={viewport}>
				{items.map((child, index) => (
					<div
						class={`carousel-item${index === 0 ? ' active' : ''}`}
						key={child?.key ?? index}
					>
						{child}
					</div>
				))}
			</div>
			<div class="card-carousel__controls" hidden={!hasOverflow}>
				<button
					class="btn-outline theme-primary card-carousel__control"
					type="button"
					data-bs-target={`#${carouselId}`}
					data-bs-slide="prev"
					aria-label={`Previous cards in ${label}`}
				>
					<span class="carousel-icon-prev" aria-hidden="true"></span>
				</button>
				<button
					class="btn-outline theme-primary card-carousel__control"
					type="button"
					data-bs-target={`#${carouselId}`}
					data-bs-slide="next"
					aria-label={`Next cards in ${label}`}
				>
					<span class="carousel-icon-next" aria-hidden="true"></span>
				</button>
			</div>
		</div>
	);
}
