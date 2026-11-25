import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { getLocationsReturn } from '../../routes.js';
import { createLocationsService } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/errors.js';
import './style.css';

function errorMessage(error, action) {
	if (error instanceof ValidationError) {
		return error.message;
	}
	if (error instanceof StorageError) {
		return `The Location could not be ${action}. Existing Location data was not discarded.`;
	}
	return `Something unexpected prevented the Location from being ${action}.`;
}

function editableFields(location) {
	return {
		name: location.name,
		hardinessZone: location.hardinessZone ?? '',
	};
}

const EMPTY_FIELD_ERRORS = Object.freeze({ name: '', hardinessZone: '' });

function validationField(error) {
	return error instanceof ValidationError && ['name', 'hardinessZone'].includes(error.field)
		? error.field
		: null;
}

export function revealLocationField(field, {
	documentObject = globalThis.document,
	viewport = globalThis,
} = {}) {
	if (!field) return false;

	const describedBy = field.getAttribute?.('aria-describedby')?.trim().split(/\s+/).filter(Boolean) ?? [];
	const elements = [field, ...describedBy.map((id) => documentObject?.getElementById(id)).filter(Boolean)];
	const rectangles = elements.map((element) => element.getBoundingClientRect?.()).filter(Boolean);
	const headerBottom = Math.max(
		0,
		documentObject?.querySelector?.('.app-header')?.getBoundingClientRect?.().bottom ?? 0,
	);
	const viewportHeight = viewport.innerHeight ?? documentObject?.documentElement?.clientHeight ?? 0;
	const top = rectangles.length ? Math.min(...rectangles.map((rectangle) => rectangle.top)) : 0;
	const bottom = rectangles.length ? Math.max(...rectangles.map((rectangle) => rectangle.bottom)) : 0;
	const isVisible = rectangles.length > 0 && top >= headerBottom && bottom <= viewportHeight;

	if (!isVisible) {
		const reduceMotion = viewport.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
		field.scrollIntoView?.({
			behavior: reduceMotion ? 'auto' : 'smooth',
			block: 'center',
			inline: 'nearest',
		});
	}
	field.focus?.({ preventScroll: true });
	return true;
}

export function Locations() {
	const lookupUrl = 'https://www.almanac.com/planting-zones-by-zip-code';
	const { query } = useLocation();
	const returnDestination = getLocationsReturn(query.ref, query.settingsRef);
	const storage = useStorage();
	const locations = useMemo(
		() => createLocationsService(storage.repositories.locations),
		[storage],
	);
	const [state, setState] = useState({ status: 'loading', items: [] });
	const [newFields, setNewFields] = useState({ name: '', hardinessZone: '' });
	const [editingId, setEditingId] = useState(null);
	const [editFields, setEditFields] = useState(null);
	const [pendingId, setPendingId] = useState(null);
	const [adding, setAdding] = useState(false);
	const [message, setMessage] = useState('');
	const [newErrors, setNewErrors] = useState(EMPTY_FIELD_ERRORS);
	const [editErrors, setEditErrors] = useState(EMPTY_FIELD_ERRORS);
	const pendingFeedbackId = useRef(null);
	const operationPending = useRef(false);
	const [feedbackRequest, setFeedbackRequest] = useState(0);
	const busy = adding || pendingId !== null;

	const requestFocus = useCallback((id, reveal = false) => {
		const focus = () => {
			const element = globalThis.document?.getElementById?.(id);
			if (reveal) revealLocationField(element);
			else element?.focus?.({ preventScroll: true });
		};
		if (globalThis.requestAnimationFrame) globalThis.requestAnimationFrame(focus);
		else focus();
	}, []);

	useEffect(() => {
		if (!feedbackRequest || busy || !pendingFeedbackId.current) return;
		const id = pendingFeedbackId.current;
		pendingFeedbackId.current = null;
		requestFocus(id, true);
	}, [busy, feedbackRequest, requestFocus]);

	useEffect(() => {
		if (editingId) requestFocus(`location-name-${editingId}`);
	}, [editingId, requestFocus]);

	function reportSubmissionError(error, action, scope, locationId = null) {
		const field = validationField(error);
		if (!field) {
			setMessage(errorMessage(error, action));
			return;
		}
		const setErrors = scope === 'new' ? setNewErrors : setEditErrors;
		setErrors({ ...EMPTY_FIELD_ERRORS, [field]: error.message });
		pendingFeedbackId.current = scope === 'new'
			? `new-location-${field === 'hardinessZone' ? 'zone' : field}`
			: `location-${field === 'hardinessZone' ? 'zone' : field}-${locationId}`;
		setFeedbackRequest((current) => current + 1);
	}

	const loadLocations = useCallback(async (showLoading = true) => {
		if (showLoading) {
			setState((current) => ({ ...current, status: 'loading' }));
		}
		try {
			setState({ status: 'ready', items: await locations.list() });
			return true;
		} catch (error) {
			setState((current) => ({ ...current, status: 'error' }));
			setMessage(errorMessage(error, 'loaded'));
			return false;
		}
	}, [locations]);

	useEffect(() => {
		void loadLocations();
	}, [loadLocations]);

	async function addLocation(event) {
		event.preventDefault();
		if (operationPending.current) return;

		operationPending.current = true;
		setAdding(true);
		setMessage('');
		setNewErrors(EMPTY_FIELD_ERRORS);
		try {
			await locations.create(newFields);
			setNewFields({ name: '', hardinessZone: '' });
			await loadLocations(false);
			requestFocus('new-location-name');
		} catch (error) {
			reportSubmissionError(error, 'added', 'new');
		} finally {
			operationPending.current = false;
			setAdding(false);
		}
	}

	function beginEdit(location) {
		if (busy) return;
		setEditingId(location.id);
		setEditFields(editableFields(location));
		setEditErrors(EMPTY_FIELD_ERRORS);
		setMessage('');
	}

	function cancelEdit() {
		if (pendingId !== null) return;
		const previousEditingId = editingId;
		setEditingId(null);
		setEditFields(null);
		setEditErrors(EMPTY_FIELD_ERRORS);
		setMessage('');
		if (previousEditingId) requestFocus(`edit-location-${previousEditingId}`);
	}

	async function saveLocation(event, location) {
		event.preventDefault();
		if (operationPending.current) return;
		operationPending.current = true;
		setPendingId(location.id);
		setMessage('');
		setEditErrors(EMPTY_FIELD_ERRORS);
		try {
			if (!await locations.update(location.id, editFields)) {
				throw new Error('The Location no longer exists.');
			}
			setEditingId(null);
			setEditFields(null);
			await loadLocations(false);
			requestFocus(`edit-location-${location.id}`);
		} catch (error) {
			reportSubmissionError(error, 'saved', 'edit', location.id);
		} finally {
			operationPending.current = false;
			setPendingId(null);
		}
	}

	async function deleteLocation(location) {
		if (operationPending.current) return;
		if (!globalThis.confirm(`Permanently delete “${location.name}”? This cannot be undone.`)) {
			return;
		}

		operationPending.current = true;
		setPendingId(location.id);
		setMessage('');
		try {
			if (!await locations.remove(location.id)) {
				throw new Error('The Location no longer exists.');
			}
			await loadLocations(false);
			requestFocus('new-location-name');
		} catch (error) {
			setMessage(errorMessage(error, 'deleted'));
		} finally {
			operationPending.current = false;
			setPendingId(null);
		}
	}

	return (
		<section class="container locations-page" aria-labelledby="locations-title" aria-busy={busy ? 'true' : undefined}>
			<header class="locations-page__header">
				<a class="btn-outline locations-page__return" href={returnDestination.href}>
					<i class="bi bi-arrow-left" aria-hidden="true"></i>
					{returnDestination.label}
				</a>
				<p class="locations-page__eyebrow">Garden geography</p>
				<h1 id="locations-title"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> Geographic Locations</h1>
				<p>
					Manage the growing sites associated with your Gardens, such as your home, a second property, or a community garden. Each Location can include an optional USDA Hardiness Zone.
				</p>
			</header>

			<section class="locations-panel" aria-labelledby="add-location-title">
				<h2 id="add-location-title">Add a Location</h2>
				<form class="locations-form" autoComplete="off" noValidate onSubmit={addLocation}>
					<div class="form-field">
						<label class="form-label" for="new-location-name">Name</label>
						<input
							id="new-location-name"
							class={`form-control${newErrors.name ? ' is-invalid' : ''}`}
							type="text"
							autoComplete="off"
							required
							disabled={busy}
							value={newFields.name}
							aria-invalid={newErrors.name ? 'true' : undefined}
							aria-describedby={newErrors.name ? 'new-location-name-error' : undefined}
							onInput={(event) => {
								setNewFields({ ...newFields, name: event.currentTarget.value });
								setNewErrors({ ...newErrors, name: '' });
							}}
						/>
						{newErrors.name && <div id="new-location-name-error" class="invalid-feedback">{newErrors.name}</div>}
					</div>
					<div class="form-field">
						<label class="form-label" for="new-location-zone">
							USDA Hardiness Zone <span>(optional)</span>
						</label>
						<input
							id="new-location-zone"
							class={`form-control${newErrors.hardinessZone ? ' is-invalid' : ''}`}
							type="text"
							autoComplete="off"
							placeholder="For example, 7b"
							maxlength="3"
							disabled={busy}
							value={newFields.hardinessZone}
							aria-invalid={newErrors.hardinessZone ? 'true' : undefined}
							aria-describedby={newErrors.hardinessZone ? 'new-location-zone-error locations-zone-help' : 'locations-zone-help'}
							onInput={(event) => {
								setNewFields({ ...newFields, hardinessZone: event.currentTarget.value });
								setNewErrors({ ...newErrors, hardinessZone: '' });
							}}
						/>
						{newErrors.hardinessZone && <div id="new-location-zone-error" class="invalid-feedback">{newErrors.hardinessZone}</div>}
					</div>
					<button class="btn-solid theme-primary" type="submit" disabled={busy}>
						<i class="bi bi-plus-lg" aria-hidden="true"></i>
						{adding ? 'Adding…' : 'Add Location'}
					</button>
				</form>
				<p class="locations-zone-help" id="locations-zone-help">
					Zones range from 1a through 13b.{' '}
					<a href={lookupUrl} target="_blank" rel="noreferrer">
						Find your USDA Plant Hardiness Zone
						<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
					</a>
				</p>
			</section>

			{message && (
				<div class="locations-message" role="alert">
					<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
					<span>{message}</span>
					{state.status === 'error' && (
						<button class="btn-outline" type="button" onClick={() => loadLocations()}>
							Retry
						</button>
					)}
				</div>
			)}

			{state.status === 'loading' ? (
				<div class="locations-state" role="status">Loading Locations…</div>
			) : state.status === 'ready' && state.items.length === 0 ? (
				<div class="locations-state">No Geographic Locations are available. Return to Settings and try again.</div>
			) : state.status === 'ready' && (
				<ul class="locations-list" aria-label="Saved Locations">
					{state.items.map((location) => (
						<li class="location-card" key={location.id}>
							{editingId === location.id ? (
								<form
									class="locations-edit"
									autoComplete="off"
									noValidate
									onSubmit={(event) => saveLocation(event, location)}
								>
									<div class="form-field">
										<label class="form-label" for={`location-name-${location.id}`}>Name</label>
										<input
											id={`location-name-${location.id}`}
											class={`form-control${editErrors.name ? ' is-invalid' : ''}`}
											type="text"
											autoComplete="off"
											required
											disabled={busy}
											value={editFields.name}
											aria-invalid={editErrors.name ? 'true' : undefined}
											aria-describedby={editErrors.name ? `location-name-error-${location.id}` : undefined}
											onInput={(event) => {
												setEditFields({ ...editFields, name: event.currentTarget.value });
												setEditErrors({ ...editErrors, name: '' });
											}}
										/>
										{editErrors.name && <div id={`location-name-error-${location.id}`} class="invalid-feedback">{editErrors.name}</div>}
									</div>
									<div class="form-field">
										<label class="form-label" for={`location-zone-${location.id}`}>
											USDA Hardiness Zone <span>(optional)</span>
										</label>
										<input
											id={`location-zone-${location.id}`}
											class={`form-control${editErrors.hardinessZone ? ' is-invalid' : ''}`}
											type="text"
											autoComplete="off"
											maxlength="3"
											disabled={busy}
											value={editFields.hardinessZone}
											aria-invalid={editErrors.hardinessZone ? 'true' : undefined}
											aria-describedby={editErrors.hardinessZone ? `location-zone-error-${location.id}` : undefined}
											onInput={(event) => {
												setEditFields({ ...editFields, hardinessZone: event.currentTarget.value });
												setEditErrors({ ...editErrors, hardinessZone: '' });
											}}
										/>
										{editErrors.hardinessZone && <div id={`location-zone-error-${location.id}`} class="invalid-feedback">{editErrors.hardinessZone}</div>}
									</div>
									<div class="locations-edit__actions">
										<button class="btn-outline" type="button" onClick={cancelEdit} disabled={busy}>
											Cancel
										</button>
										<button class="btn-solid theme-primary" type="submit" disabled={busy}>
											{pendingId === location.id ? 'Saving…' : 'Save'}
										</button>
									</div>
								</form>
							) : (
								<>
									<div class="location-card__content">
										<div class="location-card__title-row">
											<h2>{location.name}</h2>
											{location.isSystemDefault && (
												<span class="badge theme-primary">Built-in Default</span>
											)}
										</div>
										<p>
											USDA Hardiness Zone:{' '}
											<strong>{location.hardinessZone ?? 'Not set'}</strong>
										</p>
										{location.isSystemDefault && (
											<p class="location-card__protection">
												Used by Quick Start and protected from deletion, even if renamed.
											</p>
										)}
									</div>
									<div class="location-card__actions">
										<button id={`edit-location-${location.id}`} class="btn-outline" type="button" onClick={() => beginEdit(location)} disabled={busy}>
											<i class="bi bi-pencil" aria-hidden="true"></i>
											Edit
										</button>
										{!location.isSystemDefault && (
											<button class="btn-text theme-danger" type="button" onClick={() => deleteLocation(location)} disabled={busy}>
												<i class="bi bi-trash3" aria-hidden="true"></i>
												{pendingId === location.id ? 'Deleting…' : 'Delete'}
											</button>
										)}
									</div>
								</>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
