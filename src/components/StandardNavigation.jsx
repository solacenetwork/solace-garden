import { useLocation } from 'preact-iso';
import { useEffect, useRef, useState } from 'preact/hooks';
import { findRoute, findRouteById } from '../routes.js';
import { standardPrimaryIds } from '../navigation.js';
import { AppDrawer } from './AppDrawer.jsx';

const primaryDestinations = standardPrimaryIds.map(findRouteById);
const displayLabels = { photos: 'Gallery', plants: 'PlantDB' };
const labelFor = (destination) => displayLabels[destination.id] ?? destination.label;
const presentationFor = () => globalThis.matchMedia?.('(min-width: 1024px)').matches ? 'large'
	: globalThis.matchMedia?.('(min-width: 768px)').matches ? 'medium' : 'small';
const ordinaryActivation = (event) => !event.defaultPrevented && event.button === 0
	&& !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

function NavigationLinks({ currentId, iconsOnly = false, onNavigate }) {
	const link = (destination) => (
		<a
			class="standard-navigation__link"
			href={destination.path}
			data-standard-destination={destination.id}
			aria-label={iconsOnly ? labelFor(destination) : undefined}
			title={iconsOnly ? labelFor(destination) : undefined}
			aria-current={currentId === destination.id ? 'page'
				: currentId === 'templates' && destination.id === 'gardens' ? 'location' : undefined}
			onClick={(event) => { if (ordinaryActivation(event)) onNavigate?.(); }}
		>
			<i class={`bi bi-${destination.icon}`} aria-hidden="true"></i>
			{!iconsOnly && <span>{labelFor(destination)}</span>}
		</a>
	);
	return (
		<ul>
			{primaryDestinations.map((destination) => (
				<li key={destination.id}>{link(destination)}</li>
			))}
		</ul>
	);
}

export function StandardNavigation() {
	const { path } = useLocation();
	const currentRoute = findRoute(path);
	const currentId = currentRoute?.id;
	const [presentation, setPresentation] = useState(presentationFor);
	const root = useRef(null);
	const currentDestination = useRef(null);
	const pendingFocus = useRef(null);
	currentDestination.current = currentId;

	useEffect(() => {
		const element = root.current;
		const doc = element.ownerDocument;
		const media = ['(min-width: 768px)', '(min-width: 1024px)'].map((query) => globalThis.matchMedia?.(query));
		let previous = presentation;
		const change = () => {
			const next = presentationFor();
			if (next === previous) return;
			previous = next;
			if (element.contains(doc.activeElement)) {
				pendingFocus.current = doc.activeElement.closest('[data-standard-destination]')?.dataset.standardDestination
					?? currentDestination.current ?? 'gardens';
			}
			setPresentation(next);
		};
		for (const query of media) query?.addEventListener('change', change);
		change();
		return () => {
			for (const query of media) query?.removeEventListener('change', change);
			// Automatic mode or a preference change may remove navigation entirely.
			// AppDrawer still owns modal teardown; only provide a visible fallback.
			if (pendingFocus.current || element.contains(doc.activeElement)) {
				requestAnimationFrame(() => {
					if (!element.isConnected) doc.querySelector('.garden-brand')?.focus({ preventScroll: true });
				});
			}
		};
	}, []);

	useEffect(() => {
		if (!pendingFocus.current) return undefined;
		const frame = requestAnimationFrame(() => {
			const id = pendingFocus.current;
			pendingFocus.current = null;
			if (presentation === 'small') {
				root.current.querySelector('[aria-controls="standard-navigation-drawer"]')?.focus({ preventScroll: true });
				return;
			}
			const navigation = root.current.querySelector('.standard-navigation--icons') ?? root.current;
			const links = Array.from(navigation.querySelectorAll('[data-standard-destination]'));
			(links.find((link) => link.dataset.standardDestination === id) ?? links[0])?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(frame);
	}, [presentation]);

	return (
		<aside class={`standard-sidebar standard-sidebar--${presentation}`} ref={root}>
			{presentation === 'medium' && <nav class="standard-navigation standard-navigation--icons" aria-label="Standard Mode workspaces">
				<NavigationLinks currentId={currentId} iconsOnly />
			</nav>}
			{presentation !== 'large' && (
				<AppDrawer
					key={presentation}
					id="standard-navigation-drawer"
					title="Navigation"
					placement="start"
					style={{ '--app-drawer-width': '300px' }}
					footerCloseIcon="arrow-left-square-fill"
					renderTrigger={(triggerProps) => presentation === 'small' ? (
						<div class="standard-navigation__phone-strip">
							<button class="standard-navigation__phone-trigger" {...triggerProps}>
								<i class="bi bi-list" aria-hidden="true"></i><span>Navigation</span>
							</button>
							<span class="standard-navigation__current" title={currentRoute ? labelFor(currentRoute) : 'Navigation'}>
								{currentRoute ? labelFor(currentRoute) : 'Navigation'}
							</span>
						</div>
					) : (
						<button class="icon-control standard-navigation__expand" {...triggerProps} aria-label="Open navigation" title="Open navigation">
							<i class="bi bi-arrow-right-square-fill" aria-hidden="true"></i>
						</button>
					)}
				>
					{({ close }) => <nav class="standard-navigation" aria-label="Standard Mode workspaces"><NavigationLinks currentId={currentId} onNavigate={close} /></nav>}
				</AppDrawer>
			)}
			{presentation === 'large' && (
				<nav id="standard-navigation" class="standard-navigation" aria-label="Standard Mode workspaces">
					<NavigationLinks currentId={currentId} />
				</nav>
			)}
		</aside>
	);
}
