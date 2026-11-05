import Drawer from 'bootstrap/js/dist/drawer.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import './AppDrawer.css';

export function AppDrawer({ id, title, triggerLabel = 'Information', children }) {
	const drawerElement = useRef(null);
	const drawerInstance = useRef(null);
	const triggerElement = useRef(null);
	const isDrawerShown = useRef(false);
	const closeAfterShown = useRef(false);
	const focusFrame = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const element = drawerElement.current;

		if (!element) {
			return undefined;
		}

		const instance = new Drawer(element);
		const handleShow = () => setIsOpen(true);
		const handleShown = () => {
			isDrawerShown.current = true;

			if (closeAfterShown.current) {
				closeAfterShown.current = false;
				void instance.hide();
			}
		};
		const handleHidden = () => {
			isDrawerShown.current = false;
			closeAfterShown.current = false;
			setIsOpen(false);
			focusFrame.current = requestAnimationFrame(() => {
				focusFrame.current = null;

				if (triggerElement.current?.isConnected) {
					triggerElement.current.focus({ preventScroll: true });
				}
			});
		};

		drawerInstance.current = instance;
		element.addEventListener('show.bs.drawer', handleShow);
		element.addEventListener('shown.bs.drawer', handleShown);
		element.addEventListener('hidden.bs.drawer', handleHidden);

		return () => {
			element.removeEventListener('show.bs.drawer', handleShow);
			element.removeEventListener('shown.bs.drawer', handleShown);
			element.removeEventListener('hidden.bs.drawer', handleHidden);
			isDrawerShown.current = false;
			closeAfterShown.current = false;
			if (focusFrame.current !== null) {
				cancelAnimationFrame(focusFrame.current);
				focusFrame.current = null;
			}
			instance.dispose();
			drawerInstance.current = null;
		};
	}, []);

	const openDrawer = () => {
		void drawerInstance.current?.show(triggerElement.current);
	};

	const closeDrawer = () => {
		if (!isDrawerShown.current) {
			closeAfterShown.current = true;
			return;
		}

		void drawerInstance.current?.hide();
	};

	const titleId = `${id}-title`;

	return (
		<>
			<button
				class="icon-control app-drawer-trigger"
				type="button"
				ref={triggerElement}
				aria-controls={id}
				aria-expanded={isOpen}
				onClick={openDrawer}
				hidden={isOpen}
			>
				<i class="bi bi-info-circle" aria-hidden="true"></i>
				<span>{triggerLabel}</span>
			</button>

			<dialog
				class="drawer drawer-bottom app-drawer"
				id={id}
				ref={drawerElement}
				aria-labelledby={titleId}
			>
				<div class="drawer-header app-drawer__header">
					<h2 class="drawer-title" id={titleId}>{title}</h2>
					<button
						class="btn-close app-drawer__icon-close"
						type="button"
						aria-label={`Close ${title}`}
						onClick={closeDrawer}
					></button>
				</div>
				<div class="drawer-body app-drawer__body">{children}</div>
				<div class="drawer-footer app-drawer__footer">
					<button class="app-button app-drawer__close" type="button" onClick={closeDrawer}>
						Close
					</button>
				</div>
			</dialog>
		</>
	);
}
