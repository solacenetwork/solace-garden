import Dialog from 'bootstrap/js/dist/dialog.js';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createGardensService } from '../../services/gardens.js';

export function GardenDeletionDialog({ dialogRef, garden, busy, error, onCancel, onConfirm }) {
	return (
		<dialog class="dialog garden-deletion-dialog" ref={dialogRef} aria-labelledby="garden-deletion-title">
			<div class="dialog-header">
				<h2 class="dialog-title" id="garden-deletion-title">Permanently delete Garden?</h2>
				<button class="btn-close" type="button" aria-label="Cancel permanent deletion" disabled={busy} onClick={onCancel}></button>
			</div>
			<div class="dialog-body">
				{error && <p class="garden-lifecycle__error" role="alert">{error}</p>}
				<p><strong>{garden.name}</strong> will be permanently deleted.</p>
				<ul>
					<li>Its embedded Garden Notes and Garden-specific fields will be removed.</li>
					<li>Independent Notes, Tasks, and Wish List items will be preserved.</li>
					<li>Their associations with this Garden will be cleared.</li>
				</ul>
				<p><strong>This cannot be undone without restoring a backup.</strong></p>
			</div>
			<div class="dialog-footer">
				<button class="btn-outline" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
				<button class="btn-solid theme-danger" type="button" disabled={busy} onClick={onConfirm}>
					{busy ? 'Deleting…' : 'Permanently Delete Garden'}
				</button>
			</div>
		</dialog>
	);
}

export function GardenDeletion({ garden, repository, onDeleted }) {
	const dialogElement = useRef(null);
	const dialogInstance = useRef(null);
	const triggerElement = useRef(null);
	const busyRef = useRef(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const service = useMemo(() => createGardensService(repository), [repository]);

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		dialogInstance.current = instance;
		return () => {
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	function open(event) {
		triggerElement.current = event.currentTarget;
		setError('');
		void dialogInstance.current?.show(triggerElement.current);
	}

	function cancel() {
		if (!busyRef.current) void dialogInstance.current?.hide();
	}

	async function remove() {
		if (busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		setError('');
		try {
			if (!await service.removePermanently(garden.id)) throw new Error('Garden not found');
			await dialogInstance.current?.hide();
			onDeleted();
		} catch {
			setError('This Garden could not be deleted. No changes were committed. Please try again.');
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	}

	return (
		<section class="garden-delete" aria-labelledby="garden-delete-title">
			<h2 id="garden-delete-title">Permanent deletion</h2>
			<p>Delete this Garden and clear its links from independent records.</p>
			<button class="btn-outline theme-danger" type="button" onClick={open}>
				<i class="bi bi-trash3" aria-hidden="true"></i> Permanently Delete Garden
			</button>
			<GardenDeletionDialog dialogRef={dialogElement} garden={garden} busy={busy} error={error} onCancel={cancel} onConfirm={remove} />
		</section>
	);
}
