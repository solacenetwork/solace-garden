import Dialog from 'bootstrap/js/dist/dialog.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CharacterCounter } from '../../components/CharacterCounter.jsx';
import { createGardenLifecycleService } from '../../services/gardenLifecycle.js';

const STATUS_LABELS = Object.freeze({ planned: 'Planned', active: 'Active', completed: 'Completed' });

function expectation(garden) {
	return { status: garden.status, isClosed: garden.isClosed };
}

export function GardenLifecycleView({
	garden, selectedStatus, onStatusChange, onSaveStatus, onClose, onArchive, onReopen,
	onUnarchive, closeOnComplete = false, onCloseOnCompleteChange, busy = false, error = '',
}) {
	if (garden.status === 'archived') {
		return (
		<section class="garden-lifecycle" aria-labelledby="garden-lifecycle-title">
			<h2 id="garden-lifecycle-title">Garden lifecycle</h2>
			<p>This Garden is archived and read-only.</p>
			{error && <p class="garden-lifecycle__error" role="alert">{error}</p>}
			<button class="btn-outline" type="button" disabled={busy} onClick={onUnarchive}>
				{busy ? 'Updating…' : 'Unarchive Garden'}
			</button>
		</section>
		);
	}

	if (garden.isClosed) {
		return (
		<section class="garden-lifecycle" aria-labelledby="garden-lifecycle-title">
			<h2 id="garden-lifecycle-title">Garden lifecycle</h2>
			<p>This Garden is closed and read-only. Reopening keeps its current status.</p>
			{error && <p class="garden-lifecycle__error" role="alert">{error}</p>}
			<button class="btn-outline" type="button" disabled={busy} onClick={onReopen}>
				{busy ? 'Updating…' : 'Reopen Garden'}
			</button>
		</section>
		);
	}

	return (
		<section class="garden-lifecycle" aria-labelledby="garden-lifecycle-title">
			<h2 id="garden-lifecycle-title">Garden lifecycle</h2>
			<p>Update this Garden manually. Its dates do not change its status.</p>
			{error && <p class="garden-lifecycle__error" role="alert">{error}</p>}
			<div class="garden-lifecycle__status">
				<label for="garden-lifecycle-status">Status</label>
				<select
					class="form-select"
					id="garden-lifecycle-status"
					value={selectedStatus}
					disabled={busy}
					onChange={(event) => onStatusChange(event.currentTarget.value)}
				>
					{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value}>{label}</option>)}
					<option value="archived">Archived</option>
				</select>
				<button
					class="btn-solid theme-primary"
					type="button"
					disabled={busy || selectedStatus === garden.status}
					onClick={onSaveStatus}
				>
					{busy ? 'Updating…' : 'Update Status'}
				</button>
			</div>
			{selectedStatus === 'completed' && garden.status !== 'completed' && (
				<div class="form-check">
					<input
						class="form-check-input"
						type="checkbox"
						id="garden-complete-and-close"
						checked={closeOnComplete}
						disabled={busy}
						onChange={(event) => onCloseOnCompleteChange(event.currentTarget.checked)}
					/>
					<label class="form-check-label" for="garden-complete-and-close">Close Garden after marking it Completed</label>
				</div>
			)}
			<div class="garden-lifecycle__actions">
				<button class="btn-outline" type="button" disabled={busy} onClick={onClose}>Close Garden</button>
				<button class="btn-text theme-danger" type="button" disabled={busy} onClick={onArchive}>Archive Garden</button>
			</div>
		</section>
	);
}

export function LifecycleDialog({ dialogRef, kind, garden, notes, onNotesChange, onCancel, onConfirm, busy, error = '' }) {
	const isArchive = kind === 'archive';
	return (
		<dialog class="dialog garden-lifecycle-dialog" ref={dialogRef} aria-labelledby="garden-lifecycle-dialog-title">
			<div class="dialog-header">
				<h2 class="dialog-title" id="garden-lifecycle-dialog-title">
					{isArchive ? 'Archive Garden?' : 'Close Garden?'}
				</h2>
				<button class="btn-close" type="button" aria-label="Cancel lifecycle change" disabled={busy} onClick={onCancel}></button>
			</div>
			<div class="dialog-body">
				{error && <p class="garden-lifecycle__error" role="alert">{error}</p>}
				{isArchive ? (
					<p>Archiving <strong>{garden.name}</strong> closes it and makes it read-only. You can unarchive it later.</p>
				) : (
					<>
						<p>Closing <strong>{garden.name}</strong> keeps it in your history and makes it read-only. You can reopen it later.</p>
						<label for="garden-close-notes">Garden Notes <span class="fg-muted">(optional)</span></label>
						<textarea
							class="form-control"
							id="garden-close-notes"
							rows="5"
							maxLength={1000}
							aria-describedby="garden-close-notes-counter"
							value={notes}
							disabled={busy}
							onInput={(event) => onNotesChange(event.currentTarget.value)}
						></textarea>
						<CharacterCounter value={notes} maxChars={1000} id="garden-close-notes-counter" />
					</>
				)}
			</div>
			<div class="dialog-footer">
				<button class="btn-outline" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
				<button class={`btn-solid ${isArchive ? 'theme-danger' : 'theme-primary'}`} type="button" disabled={busy} onClick={onConfirm}>
					{busy ? 'Updating…' : isArchive ? 'Archive Garden' : 'Close Garden'}
				</button>
			</div>
		</dialog>
	);
}

export function GardenLifecycle({ garden, repository, onChanged }) {
	const dialogElement = useRef(null);
	const dialogInstance = useRef(null);
	const triggerElement = useRef(null);
	const busyRef = useRef(false);
	const [selectedStatus, setSelectedStatus] = useState(garden.status);
	const [closeOnComplete, setCloseOnComplete] = useState(false);
	const [dialogKind, setDialogKind] = useState(null);
	const [notes, setNotes] = useState(garden.notes ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const lifecycle = createGardenLifecycleService(repository);

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		const handleHidden = () => setDialogKind(null);
		dialogInstance.current = instance;
		element.addEventListener('hidden.bs.dialog', handleHidden);
		return () => {
			element.removeEventListener('hidden.bs.dialog', handleHidden);
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	useEffect(() => {
		setSelectedStatus(garden.status);
		setCloseOnComplete(false);
		setNotes(garden.notes ?? '');
	}, [garden.status, garden.isClosed, garden.notes]);

	useEffect(() => {
		if (dialogKind) void dialogInstance.current?.show(triggerElement.current);
	}, [dialogKind]);

	function showDialog(kind, event) {
		triggerElement.current = event?.currentTarget ?? null;
		setError('');
		setNotes(garden.notes ?? '');
		setDialogKind(kind);
	}

	function hideDialog() {
		void dialogInstance.current?.hide();
		setDialogKind(null);
	}

	async function run(operation) {
		if (busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		setError('');
		try {
			const changed = await operation();
			if (!changed) throw new Error('Garden not found');
			hideDialog();
			onChanged();
		} catch (caught) {
			setError(caught?.code === 'STALE_GARDEN_LIFECYCLE'
				? caught.message
				: 'This Garden could not be updated. Reload the page and try again.');
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	}

	function saveStatus(event) {
		if (selectedStatus === 'archived') return showDialog('archive', event);
		if (selectedStatus === 'completed') {
			if (closeOnComplete) return showDialog('complete-close', event);
			return run(() => lifecycle.complete(garden.id, {}, expectation(garden)));
		}
		return run(() => lifecycle.setStatus(garden.id, selectedStatus, expectation(garden)));
	}

	return (
		<>
			<GardenLifecycleView
				garden={garden}
				selectedStatus={selectedStatus}
				onStatusChange={setSelectedStatus}
				onSaveStatus={saveStatus}
				onClose={(event) => showDialog('close', event)}
				onArchive={(event) => showDialog('archive', event)}
				onReopen={() => run(() => lifecycle.reopen(garden.id, expectation(garden)))}
				onUnarchive={() => run(() => lifecycle.unarchive(garden.id, expectation(garden)))}
				closeOnComplete={closeOnComplete}
				onCloseOnCompleteChange={setCloseOnComplete}
				busy={busy}
				error={error}
			/>
			<LifecycleDialog
				dialogRef={dialogElement}
				kind={dialogKind}
				garden={garden}
				notes={notes}
				onNotesChange={setNotes}
				onCancel={hideDialog}
				onConfirm={() => run(() => dialogKind === 'archive'
					? lifecycle.archive(garden.id, expectation(garden))
					: dialogKind === 'complete-close'
						? lifecycle.complete(garden.id, { close: true, notes }, expectation(garden))
						: lifecycle.close(garden.id, { notes }, expectation(garden)))}
				busy={busy}
				error={error}
			/>
		</>
	);
}
