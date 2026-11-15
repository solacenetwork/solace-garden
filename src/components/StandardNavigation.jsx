import { useLocation } from 'preact-iso';
import { useEffect, useRef, useState } from 'preact/hooks';
import { findRoute, findRouteById } from '../routes.js';
import { standardPrimaryIds } from '../navigation.js';
import { AppDrawer } from './AppDrawer.jsx';

const primaryDestinations = standardPrimaryIds.map(findRouteById);
const templates = findRouteById('templates');
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
			aria-current={currentId === destination.id ? 'page' : undefined}
			onClick={(event) => { if (ordinaryActivation(event)) onNavigate?.(); }}
		>
			<i class={`bi bi-${destination.icon}`} aria-hidden="true"></i>
			{!iconsOnly && <span>{labelFor(destination)}</span>}
		</a>
	);
	return (
		<ul>
			{primaryDestinations.map((destination) => (
				<li key={destination.id}>
					{link(destination)}
					{destination.id === 'gardens' && !iconsOnly && <ul class="standard-navigation__secondary"><li>{link(templates)}</li></ul>}
				</li>
			))}
		</ul>
	);
}

export function StandardNavigation() {
	const { path } = useLocation();
	const currentId = findRoute(path)?.id;
	const [presentation, setPresentation] = useState(presentationFor);
	const [isExpanded, setIsExpanded] = useState(false);
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
				if (next === 'small') setIsExpanded(true);
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
			const navigation = root.current.querySelector('.standard-navigation--icons') ?? root.current;
			const links = Array.from(navigation.querySelectorAll('[data-standard-destination]'));
			(links.find((link) => link.dataset.standardDestination === id) ?? links[0])?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(frame);
	}, [presentation]);

	return (
		<aside class={`standard-sidebar standard-sidebar--${presentation}`} ref={root}>
			{presentation === 'medium' ? (
				<>
					<AppDrawer
						id="standard-navigation-drawer"
						title="Navigation"
						placement="start"
						style={{ '--app-drawer-width': '300px' }}
						renderTrigger={(triggerProps) => (
							<button class="icon-control standard-navigation__expand" {...triggerProps} aria-label="Open navigation" title="Open navigation">
								<i class="bi bi-list" aria-hidden="true"></i>
							</button>
						)}
					>
						{({ close }) => <nav class="standard-navigation" aria-label="Standard Mode workspaces"><NavigationLinks currentId={currentId} onNavigate={close} /></nav>}
					</AppDrawer>
					<nav class="standard-navigation standard-navigation--icons" aria-label="Standard Mode workspaces">
						<NavigationLinks currentId={currentId} iconsOnly />
					</nav>
				</>
			) : (
				<>
					{presentation === 'small' && <button class="standard-sidebar__toggle" type="button" aria-controls="standard-navigation" aria-expanded={isExpanded} onClick={() => setIsExpanded((expanded) => !expanded)}>
						<i class="bi bi-list" aria-hidden="true"></i><span>Browse workspaces</span>
						<i class={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} aria-hidden="true"></i>
					</button>}
					<nav id="standard-navigation" class={`standard-navigation${isExpanded ? ' is-expanded' : ''}`} aria-label="Standard Mode workspaces">
						<NavigationLinks currentId={currentId} onNavigate={() => setIsExpanded(false)} />
					</nav>
				</>
			)}
		</aside>
	);
}
