import Dialog from 'bootstrap/js/dist/dialog.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createLocationsService } from '../../services/locations.js';
import './style.css';

export async function loadTemplatesPage({ templates, locations, types }) {
	try {
		const [records, sites, definitions] = await Promise.all([
			templates.list(), locations.list(), types.list(),
		]);
		return {
			status: 'ready',
			items: [...records].sort((first, second) =>
				second.updatedAt.localeCompare(first.updatedAt) || first.id.localeCompare(second.id),
			).map((template) => {
				const location = sites.find(({ id }) => id === template.configuration.locationId);
				return {
					...template,
					locationName: location?.name ?? 'Saved Location unavailable',
					locationAvailable: Boolean(location),
					typeNames: template.configuration.typeIds.map((id) =>
						definitions.find((type) => type.id === id)?.name ?? 'Type unavailable',
					),
				};
			}),
		};
	} catch {
		return { status: 'error', items: [] };
	}
}

export function createTemplateDeleteSubmitter({
	removeTemplate,
	onDeleting = () => {},
	onDeleteError = () => {},
}) {
	let deleting = false;
	return async (id) => {
		if (deleting) return false;
		deleting = true;
		onDeleting(true);
		onDeleteError('');
		try {
			if (!await removeTemplate(id)) throw new Error('Template not found');
			return true;
		} catch {
			onDeleteError('This Template could not be deleted. Nothing else was changed. Please try again.');
			return false;
		} finally {
			deleting = false;
			onDeleting(false);
		}
	};
}

export function TemplateDeletionDialog({
	dialogRef, cancelRef, template, busy, error, onCancel, onConfirm,
}) {
	return (
		<dialog class="dialog dialog-scrollable template-deletion-dialog" ref={dialogRef} aria-labelledby="template-deletion-title" aria-describedby="template-deletion-description">
			<div class="dialog-header">
				<h2 class="dialog-title" id="template-deletion-title">Permanently delete Template?</h2>
				<button class="btn-close" type="button" aria-label="Cancel Template deletion" disabled={busy} onClick={onCancel}></button>
			</div>
			<div class="dialog-body" id="template-deletion-description">
				{error && <p class="templates-error" role="alert">{error}</p>}
				{template ? (
					<>
						<p><strong>{template.name}</strong> will be permanently removed.</p>
						<p>Suggested Garden: <strong>{template.configuration.name}</strong></p>
						<p class="template-record-id">Template ID: <code>{template.id}</code></p>
						<ul>
							<li>Existing Gardens are unaffected.</li>
							<li>The source Garden and other records will not be deleted.</li>
							<li>This Template cannot be recovered without restoring a backup.</li>
						</ul>
					</>
				) : <p>Select a Template to delete.</p>}
			</div>
			<div class="dialog-footer">
				<button ref={cancelRef} class="btn-outline" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
				<button class="btn-solid theme-danger" type="button" disabled={busy || !template} onClick={onConfirm}>
					{busy ? 'Deleting…' : 'Delete Template'}
				</button>
			</div>
		</dialog>
	);
}

export function TemplatesPageView({ state, message = '', onRetry, onRequestDelete }) {
	return (
		<section class="container templates-page" aria-labelledby="templates-title">
			<header class="templates-page__header">
				<p class="templates-page__eyebrow">Reusable Garden setup</p>
				<h1 id="templates-title">Templates</h1>
				<p>Save reusable Garden configuration without copying Notes, dates, plants, or activity history.</p>
			</header>
			{message && <p class="templates-message" role="status" aria-live="polite">{message}</p>}
			{state.status === 'loading' ? (
				<p class="templates-state" role="status">Loading Templates…</p>
			) : state.status === 'error' ? (
				<div class="templates-state" role="alert">
					<p>Templates could not be loaded. Please try again.</p>
					<button class="btn-outline" type="button" onClick={onRetry}>Retry</button>
				</div>
			) : state.items.length === 0 ? (
				<div class="templates-state templates-empty">
					<i class="bi bi-copy" aria-hidden="true"></i>
					<h2>No Templates saved yet</h2>
					<p>Open an existing Garden and choose <strong>Save as Template</strong> to create one.</p>
					<a class="btn-solid theme-primary" href="/gardens">Browse Gardens</a>
				</div>
			) : (
				<ul class="templates-list" aria-label="Saved Templates">
					{state.items.map((template) => (
						<li class="template-card" key={template.id}>
							<div class="template-card__header">
								<div>
									<p class="template-card__label">Template</p>
									<h2>{template.name}</h2>
								</div>
								<button class="btn-outline theme-danger" type="button" onClick={(event) => onRequestDelete(template, event.currentTarget)}>
									<i class="bi bi-trash3" aria-hidden="true"></i> Delete Template
								</button>
							</div>
							<dl class="template-card__facts">
								<div><dt>Suggested Garden name</dt><dd>{template.configuration.name}</dd></div>
								<div><dt>Location</dt><dd class={template.locationAvailable ? undefined : 'template-card__unavailable'}>{template.locationName}</dd></div>
								<div><dt>Garden Types</dt><dd>{template.typeNames.length ? template.typeNames.join(', ') : 'No types selected'}</dd></div>
							</dl>
							{template.configuration.description && <p class="template-card__description">{template.configuration.description}</p>}
							<p class="template-record-id">Template ID: <code>{template.id}</code></p>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export function Templates() {
	const { repositories } = useStorage();
	const services = useMemo(() => ({
		templates: createGardenTemplatesService(repositories.gardenTemplates),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
	}), [repositories]);
	const [state, setState] = useState({ status: 'loading', items: [] });
	const [message, setMessage] = useState('');
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [deleteError, setDeleteError] = useState('');
	const [deleting, setDeleting] = useState(false);
	const dialogElement = useRef(null);
	const cancelElement = useRef(null);
	const dialogInstance = useRef(null);
	const triggerElement = useRef(null);
	const deletingRef = useRef(false);

	const load = useCallback(async (showLoading = true) => {
		if (showLoading) setState((current) => ({ ...current, status: 'loading' }));
		const result = await loadTemplatesPage(services);
		setState(result);
		return result.status === 'ready';
	}, [services]);

	const deleteTemplate = useMemo(() => createTemplateDeleteSubmitter({
		removeTemplate: (id) => services.templates.removePermanently(id),
		onDeleting(value) {
			deletingRef.current = value;
			setDeleting(value);
		},
		onDeleteError: setDeleteError,
	}), [services]);

	useEffect(() => { void load(); }, [load]);

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		const focusCancel = () => cancelElement.current?.focus();
		const preventBusyHide = (event) => {
			if (deletingRef.current) event.preventDefault();
		};
		const afterHide = () => {
			setSelectedTemplate(null);
			triggerElement.current?.focus();
		};
		dialogInstance.current = instance;
		element.addEventListener('shown.bs.dialog', focusCancel);
		element.addEventListener('hide.bs.dialog', preventBusyHide);
		element.addEventListener('hidden.bs.dialog', afterHide);
		return () => {
			element.removeEventListener('shown.bs.dialog', focusCancel);
			element.removeEventListener('hide.bs.dialog', preventBusyHide);
			element.removeEventListener('hidden.bs.dialog', afterHide);
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	useEffect(() => {
		if (selectedTemplate) void dialogInstance.current?.show(triggerElement.current);
	}, [selectedTemplate]);

	function requestDelete(template, trigger) {
		triggerElement.current = trigger;
		setDeleteError('');
		setMessage('');
		setSelectedTemplate(template);
	}

	function cancelDelete() {
		if (!deletingRef.current) void dialogInstance.current?.hide();
	}

	async function confirmDelete() {
		if (!selectedTemplate) return;
		const removed = await deleteTemplate(selectedTemplate.id);
		if (!removed) return;
		const deletedName = selectedTemplate.name;
		await dialogInstance.current?.hide();
		await load(false);
		setMessage(`Template “${deletedName}” was permanently deleted. Existing Gardens were not changed.`);
	}

	return (
		<>
			<TemplatesPageView state={state} message={message} onRetry={() => load()} onRequestDelete={requestDelete} />
			<TemplateDeletionDialog
				dialogRef={dialogElement}
				cancelRef={cancelElement}
				template={selectedTemplate}
				busy={deleting}
				error={deleteError}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
			/>
		</>
	);
}
