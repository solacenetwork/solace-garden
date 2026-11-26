import Menu from 'bootstrap/js/dist/menu.js';
import { useLocation } from 'preact-iso';
import { useEffect, useRef, useState } from 'preact/hooks';
import { globalToolIds, moreDestinationIds } from '../navigation.js';
import { applicationRoutes, findRoute, findRouteById, getSettingsHref } from '../routes.js';
import { getVisibleToolCount } from '../toolbarLayout.js';
import { HeaderSearch } from './HeaderSearch.jsx';

const tools = globalToolIds.map(findRouteById);
const support = moreDestinationIds.map(findRouteById);
const addActions = [
	{ label: 'New Garden', destination: 'gardens', href: applicationRoutes.find(({ view }) => view === 'garden-new').path },
	{ label: 'New Note', destination: 'notes', href: applicationRoutes.find(({ view }) => view === 'note-new').path },
	{ label: 'New Task', destination: 'tasks', href: `${findRouteById('tasks').path}#lists-quick-text` },
	{ label: 'New Wish List Item', destination: 'wishlist', href: `${findRouteById('wishlist').path}#lists-quick-text` },
];

function DestinationContents({ destination }) {
	return <><i class={`bi bi-${destination.icon}`} aria-hidden="true"></i><span>{destination.label}</span></>;
}

export function HeaderToolbar() {
	const { path } = useLocation();
	const currentId = findRoute(path)?.id;
	const [visibleCount, setVisibleCount] = useState(0);
	const toolbar = useRef(null);
	const searchSlot = useRef(null);
	const measurements = useRef(null);
	const addToggle = useRef(null);
	const moreToggle = useRef(null);
	const addMenu = useRef(null);
	const moreMenu = useRef(null);
	const addInstance = useRef(null);
	const moreInstance = useRef(null);

	useEffect(() => {
		// Preact owns children. Menu only manages interaction/styles; container:false
		// prevents relocation. Click/keyboard activation uses its data API, not onClick.
		addInstance.current = Menu.getOrCreateInstance(addToggle.current, { menu: addMenu.current, container: false, placement: 'bottom-end', strategy: 'fixed' });
		moreInstance.current = Menu.getOrCreateInstance(moreToggle.current, { menu: moreMenu.current, container: false, placement: 'bottom-end', strategy: 'fixed' });
		return () => {
			addInstance.current.dispose();
			moreInstance.current.dispose();
			addInstance.current = moreInstance.current = null;
		};
	}, []);

	useEffect(() => {
		void addInstance.current?.hide();
		void moreInstance.current?.hide();
	}, [path]);

	useEffect(() => {
		let frame = null;
		let disposed = false;
		let previousCount = 0;
		const measure = () => {
			frame = null;
			if (disposed) return;
			const width = (element) => element.getBoundingClientRect().width;
			const count = getVisibleToolCount({
				availableWidth: width(toolbar.current),
				toolWidths: Array.from(measurements.current.children, width),
				reservedWidths: [width(searchSlot.current), width(addToggle.current), width(moreToggle.current)],
				gap: parseFloat(getComputedStyle(toolbar.current).columnGap) || 0,
			});
			if (previousCount === count) return;
			previousCount = count;
			const active = toolbar.current.ownerDocument.activeElement;
			const activeTool = active?.closest('[data-header-tool]')?.dataset.headerTool;
			if (moreMenu.current.contains(active) || (activeTool && !globalToolIds.slice(0, count).includes(activeTool))) {
				moreToggle.current.focus({ preventScroll: true });
			}
			void moreInstance.current?.hide();
			setVisibleCount(count);
		};
		const schedule = () => {
			if (!disposed && frame === null) frame = requestAnimationFrame(measure);
		};
		const observer = globalThis.ResizeObserver ? new ResizeObserver(schedule) : null;
		for (const element of [toolbar.current, searchSlot.current, addToggle.current, moreToggle.current, ...measurements.current.children]) {
			observer?.observe(element);
		}
		globalThis.addEventListener('resize', schedule);
		const fonts = toolbar.current.ownerDocument.fonts;
		fonts?.addEventListener('loadingdone', schedule);
		fonts?.ready.then(schedule);
		schedule();
		return () => {
			disposed = true;
			observer?.disconnect();
			globalThis.removeEventListener('resize', schedule);
			fonts?.removeEventListener('loadingdone', schedule);
			if (frame !== null) cancelAnimationFrame(frame);
		};
	}, []);

	const link = (destination, inMenu) => (
		<a
			key={destination.id}
			class={inMenu ? 'menu-item header-menu__link' : 'header-tool'}
			href={destination.id === 'settings' ? getSettingsHref(path) : destination.path}
			aria-current={currentId === destination.id ? 'page' : undefined}
			title={destination.label}
			data-header-tool={destination.id}
		>
			<DestinationContents destination={destination} />
		</a>
	);

	return (
		<div class="header-toolbar" ref={toolbar}>
			<div key="add" class="header-menu">
				<button class="header-control icon-control" type="button" ref={addToggle} data-bs-toggle="menu" data-bs-placement="bottom-end" data-bs-strategy="fixed" aria-expanded="false" aria-controls="header-add-menu" aria-label="Add New" title="Add New">
					<i class="bi bi-plus-lg" aria-hidden="true"></i>
				</button>
				<div class="menu header-menu__panel" id="header-add-menu" ref={addMenu}>
					{addActions.map((action) => (
						<a class="menu-item header-menu__link" key={action.label} href={action.href} title={action.label} onClick={(event) => {
							// Repeated activation on the same list URL may not rerender its route.
							if (!event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && action.href.endsWith('#lists-quick-text') && path === findRouteById(action.destination).path) {
								toolbar.current.ownerDocument.getElementById('lists-quick-text')?.focus();
							}
						}}>
							<i class={`bi bi-${findRouteById(action.destination).icon}`} aria-hidden="true"></i><span>{action.label}</span>
						</a>
					))}
				</div>
			</div>
			<div key="search" class="header-search-slot" ref={searchSlot}><HeaderSearch /></div>
			{tools.slice(0, visibleCount).map((destination) => link(destination, false))}
			<div key="more" class="header-menu">
				<button class="header-control icon-control" type="button" ref={moreToggle} data-bs-toggle="menu" data-bs-placement="bottom-end" data-bs-strategy="fixed" aria-expanded="false" aria-controls="header-more-menu" aria-label="More" title="More">
					<i class="bi bi-three-dots" aria-hidden="true"></i>
				</button>
				<div class="menu header-menu__panel" id="header-more-menu" ref={moreMenu}>
					{tools.slice(visibleCount).map((destination) => link(destination, true))}
					{visibleCount < tools.length && <hr class="menu-divider" />}
					{support.map((destination) => link(destination, true))}
				</div>
			</div>
			<div key="measurement" class="header-toolbar__measurement" aria-hidden="true" inert>
				<div class="header-toolbar__measure-tools" ref={measurements}>
					{tools.map((destination) => <span class="header-tool" key={destination.id}><DestinationContents destination={destination} /></span>)}
				</div>
			</div>
		</div>
	);
}
