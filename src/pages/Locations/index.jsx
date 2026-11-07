import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { createLocationsService } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/index.js';
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

export function Locations() {
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
		if (adding) return;

		setAdding(true);
		setMessage('');
		try {
			await locations.create(newFields);
			setNewFields({ name: '', hardinessZone: '' });
			await loadLocations(false);
		} catch (error) {
			setMessage(errorMessage(error, 'added'));
		} finally {
			setAdding(false);
		}
	}

	function beginEdit(location) {
		setEditingId(location.id);
		setEditFields(editableFields(location));
		setMessage('');
	}

	function cancelEdit() {
		setEditingId(null);
		setEditFields(null);
		setMessage('');
	}

	async function saveLocation(event, location) {
		event.preventDefault();
		setPendingId(location.id);
		setMessage('');
		try {
			if (!await locations.update(location.id, editFields)) {
				throw new Error('The Location no longer exists.');
			}
			setEditingId(null);
			setEditFields(null);
			await loadLocations(false);
		} catch (error) {
			setMessage(errorMessage(error, 'saved'));
		} finally {
			setPendingId(null);
		}
	}

	async function deleteLocation(location) {
		if (!globalThis.confirm(`Permanently delete “${location.name}”? This cannot be undone.`)) {
			return;
		}

		setPendingId(location.id);
		setMessage('');
		try {
			if (!await locations.remove(location.id)) {
				throw new Error('The Location no longer exists.');
			}
			await loadLocations(false);
		} catch (error) {
			setMessage(errorMessage(error, 'deleted'));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<section class="container locations-page" aria-labelledby="locations-title">
			<header class="locations-page__header">
				<p class="locations-page__eyebrow">Garden geography</p>
				<h1 id="locations-title">Locations</h1>
				<p>
					Manage geographic growing sites such as Home or Community Garden.
					Beds, containers, and garden types are managed separately.
				</p>
			</header>

			<section class="locations-panel" aria-labelledby="add-location-title">
				<h2 id="add-location-title">Add a Location</h2>
				<form class="locations-form" autoComplete="off" onSubmit={addLocation}>
					<div class="form-field">
						<label class="form-label" for="new-location-name">Name</label>
						<input
							id="new-location-name"
							class="form-control"
							type="text"
							autoComplete="off"
							value={newFields.name}
							onInput={(event) => setNewFields({
								...newFields,
								name: event.currentTarget.value,
							})}
						/>
					</div>
					<div class="form-field">
						<label class="form-label" for="new-location-zone">
							USDA Hardiness Zone <span>(optional)</span>
						</label>
						<input
							id="new-location-zone"
							class="form-control"
							type="text"
							autoComplete="off"
							placeholder="For example, 7b"
							maxlength="3"
							value={newFields.hardinessZone}
							onInput={(event) => setNewFields({
								...newFields,
								hardinessZone: event.currentTarget.value,
							})}
						/>
					</div>
					<button class="btn-solid theme-primary" type="submit" disabled={adding}>
						<i class="bi bi-plus-lg" aria-hidden="true"></i>
						{adding ? 'Adding…' : 'Add Location'}
					</button>
				</form>
				<p class="locations-zone-help">
					Zones range from 1a through 13b.{' '}
					<a href="https://planthardiness.ars.usda.gov/" target="_blank" rel="noreferrer">
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
				<div class="locations-state">No Locations are available.</div>
			) : state.status === 'ready' && (
				<ul class="locations-list" aria-label="Saved Locations">
					{state.items.map((location) => (
						<li class="location-card" key={location.id}>
							{editingId === location.id ? (
								<form
									class="locations-edit"
									autoComplete="off"
									onSubmit={(event) => saveLocation(event, location)}
								>
									<div class="form-field">
										<label class="form-label" for={`location-name-${location.id}`}>Name</label>
										<input
											id={`location-name-${location.id}`}
											class="form-control"
											type="text"
											autoComplete="off"
											value={editFields.name}
											onInput={(event) => setEditFields({
												...editFields,
												name: event.currentTarget.value,
											})}
										/>
									</div>
									<div class="form-field">
										<label class="form-label" for={`location-zone-${location.id}`}>
											USDA Hardiness Zone <span>(optional)</span>
										</label>
										<input
											id={`location-zone-${location.id}`}
											class="form-control"
											type="text"
											autoComplete="off"
											maxlength="3"
											value={editFields.hardinessZone}
											onInput={(event) => setEditFields({
												...editFields,
												hardinessZone: event.currentTarget.value,
											})}
										/>
									</div>
									<div class="locations-edit__actions">
										<button class="btn-outline" type="button" onClick={cancelEdit} disabled={pendingId === location.id}>
											Cancel
										</button>
										<button class="btn-solid theme-primary" type="submit" disabled={pendingId === location.id}>
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
										<button class="btn-outline" type="button" onClick={() => beginEdit(location)} disabled={pendingId !== null}>
											<i class="bi bi-pencil" aria-hidden="true"></i>
											Edit
										</button>
										{!location.isSystemDefault && (
											<button class="btn-text theme-danger" type="button" onClick={() => deleteLocation(location)} disabled={pendingId !== null}>
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
