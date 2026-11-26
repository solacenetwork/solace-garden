import Drawer from 'bootstrap/js/dist/drawer.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import './AppDrawer.css';

// renderTrigger receives native button props; forward them to the invoking button.
// children may be content or a render function receiving { close }.
export function AppDrawer({
	id, title, placement = 'bottom', triggerLabel = 'Information', renderTrigger, children, style, footerCloseIcon,
}) {
	const resolvedPlacement = ['top', 'end', 'bottom', 'start'].includes(placement) ? placement : 'bottom';
	const drawerElement = useRef(null);
	const drawerInstance = useRef(null);
	const triggerElement = useRef(null);
	const closeControl = useRef(null);
	const returnFocusElement = useRef(null);
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
		const handleShow = () => {
			if (focusFrame.current !== null) {
				cancelAnimationFrame(focusFrame.current);
				focusFrame.current = null;
			}
			setIsOpen(true);
		};
		const handleShown = () => {
			isDrawerShown.current = true;

			if (closeAfterShown.current) {
				closeAfterShown.current = false;
				void instance.hide();
			} else if (!element.contains(element.ownerDocument.activeElement)) {
				// The alpha's visibility transition can prevent native autofocus.
				// Correct initial focus once; the native dialog owns the focus trap.
				closeControl.current?.focus({ preventScroll: true });
			}
		};
		const handleHidden = () => {
			isDrawerShown.current = false;
			closeAfterShown.current = false;
			setIsOpen(false);
			focusFrame.current = requestAnimationFrame(() => {
				focusFrame.current = null;

				if (returnFocusElement.current?.isConnected) {
					returnFocusElement.current.focus({ preventScroll: true });
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

	const openDrawer = (event) => {
		returnFocusElement.current = event?.currentTarget ?? triggerElement.current;
		void drawerInstance.current?.show(returnFocusElement.current);
	};

	const closeDrawer = () => {
		if (!isDrawerShown.current) {
			closeAfterShown.current = true;
			return;
		}

		void drawerInstance.current?.hide();
	};

	const titleId = `${id}-title`;

	const triggerProps = {
		type: 'button',
		ref: triggerElement,
		'aria-controls': id,
		'aria-expanded': isOpen,
		onClick: openDrawer,
		hidden: isOpen,
	};

	return (
		<>
			{renderTrigger ? renderTrigger(triggerProps) : (
				<button class="icon-control app-drawer-trigger" {...triggerProps}>
					<i class="bi bi-info-circle" aria-hidden="true"></i>
					<span>{triggerLabel}</span>
				</button>
			)}

			<dialog
				class={`drawer drawer-${resolvedPlacement} app-drawer app-drawer--${resolvedPlacement}`}
				style={style}
				id={id}
				ref={drawerElement}
				aria-labelledby={titleId}
			>
				<div class="drawer-header app-drawer__header">
					<h2 class="drawer-title" id={titleId}>{title}</h2>
					<button
						class="btn-close app-drawer__icon-close"
						ref={closeControl}
						type="button"
						aria-label={`Close ${title}`}
						title="Close"
						autoFocus
						onClick={closeDrawer}
					></button>
				</div>
				<div class="drawer-body app-drawer__body">
					{typeof children === 'function' ? children({ close: closeDrawer }) : children}
				</div>
				<div class="drawer-footer app-drawer__footer">
					<button
						class={footerCloseIcon ? 'app-button icon-control app-drawer__close' : 'app-button app-drawer__close'}
						type="button"
						aria-label={footerCloseIcon ? `Close ${title}` : undefined}
						title={footerCloseIcon ? `Close ${title}` : undefined}
						onClick={closeDrawer}
					>
						{footerCloseIcon ? <><i class={`bi bi-${footerCloseIcon}`} aria-hidden="true"></i><span class="visually-hidden">Close {title}</span></> : 'Close'}
					</button>
				</div>
			</dialog>
		</>
	);
}
