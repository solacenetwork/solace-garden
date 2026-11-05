import Dialog from 'bootstrap/js/dist/dialog.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { demoPlantGroups } from './demoPlantGroups.js';
import './style.css';

export function Plants() {
	const dialogElement = useRef(null);
	const dialogInstance = useRef(null);
	const isDialogShown = useRef(false);
	const closeAfterShown = useRef(false);
	const [selectedGroup, setSelectedGroup] = useState(null);

	useEffect(() => {
		const element = dialogElement.current;

		if (!element) {
			return undefined;
		}

		const instance = new Dialog(element);
		const handleShown = () => {
			isDialogShown.current = true;

			if (closeAfterShown.current) {
				closeAfterShown.current = false;
				void instance.hide();
			}
		};
		const handleHidden = () => {
			isDialogShown.current = false;
			closeAfterShown.current = false;
			setSelectedGroup(null);
		};
		dialogInstance.current = instance;
		element.addEventListener('shown.bs.dialog', handleShown);
		element.addEventListener('hidden.bs.dialog', handleHidden);

		return () => {
			element.removeEventListener('shown.bs.dialog', handleShown);
			element.removeEventListener('hidden.bs.dialog', handleHidden);
			isDialogShown.current = false;
			closeAfterShown.current = false;
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	useEffect(() => {
		if (selectedGroup) {
			void dialogInstance.current?.show();
		}
	}, [selectedGroup]);

	const closeEditor = () => {
		if (!isDialogShown.current) {
			closeAfterShown.current = true;
			return;
		}

		void dialogInstance.current?.hide();
	};

	return (
		<section class="container plants-page" aria-labelledby="plants-title">
			<header class="plants-page__header">
				<p class="plants-page__eyebrow">Simple Mode prototype</p>
				<h1 id="plants-title">Update Plants</h1>
				<p>Choose a demonstration plant group to preview the editor handoff.</p>
			</header>

			<div class="plant-demo-note" role="note">
				<i class="bi bi-info-circle" aria-hidden="true"></i>
				<span>These examples are temporary and are not saved as garden data.</span>
			</div>

			<div class="plant-group-list" aria-label="Demonstration plant groups">
				{demoPlantGroups.map((group) => (
					<button
						class="plant-group-button"
						type="button"
						key={group.id}
						onClick={() => setSelectedGroup(group)}
					>
						<span class="plant-group-button__icon" aria-hidden="true">
							<i class="bi bi-flower2"></i>
						</span>
						<span class="plant-group-button__content">
							<strong>{group.name}</strong>
							<span>{group.location} · {group.status}</span>
						</span>
						<i class="bi bi-chevron-right plant-group-button__chevron" aria-hidden="true"></i>
					</button>
				))}
			</div>

			<dialog
				class="dialog dialog-scrollable md-down:dialog-fullscreen plant-editor"
				ref={dialogElement}
				aria-labelledby="plant-editor-title"
			>
				<div class="dialog-header plant-editor__header">
					<div>
						<p class="plant-editor__eyebrow">Editor placeholder</p>
						<h2 class="dialog-title" id="plant-editor-title">
							{selectedGroup?.name ?? 'Plant update'}
						</h2>
					</div>
					<button
						class="btn-close plant-editor__close"
						type="button"
						aria-label="Close plant update without saving"
						onClick={closeEditor}
					></button>
				</div>
				<div class="dialog-body plant-editor__body">
					<div class="plant-editor__placeholder-icon" aria-hidden="true">
						<i class="bi bi-pencil-square"></i>
					</div>
					<h3>Full-screen plant editor</h3>
					<p>
						A later milestone will add the phase-aware editor and persistent plant
						records. This screen only validates the Simple Mode navigation flow.
					</p>
					<dl class="plant-editor__summary">
						<div><dt>Plant group</dt><dd>{selectedGroup?.name}</dd></div>
						<div><dt>Location</dt><dd>{selectedGroup?.location}</dd></div>
						<div><dt>Current phase</dt><dd>{selectedGroup?.status}</dd></div>
					</dl>
				</div>
				<div class="dialog-footer">
					<button class="app-button plant-editor__cancel" type="button" onClick={closeEditor}>
						Close without saving
					</button>
				</div>
			</dialog>
		</section>
	);
}
