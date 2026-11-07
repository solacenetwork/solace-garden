import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GardenFields } from '../../components/GardenFields.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createGardensService } from '../../services/gardens.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createLocationsService } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/index.js';

export function gardenEditFields(garden) {
	return {
		name: garden.name,
		subtitle: garden.subtitle ?? '',
		description: garden.description ?? '',
		locationId: garden.locationId,
		typeIds: [...garden.typeIds],
		startDate: garden.startDate ?? '',
		endDate: garden.endDate ?? '',
		notes: garden.notes ?? '',
	};
}

export function gardenEditInput(fields) {
	return {
		name: fields.name,
		subtitle: fields.subtitle,
		description: fields.description,
		locationId: fields.locationId,
		typeIds: [...fields.typeIds],
		startDate: fields.startDate || null,
		endDate: fields.endDate || null,
		notes: fields.notes,
	};
}

export function validateGardenEdit(fields, references, gardens) {
	const input = gardenEditInput(fields);
	gardens.validate(input);
	if (!references.locations.some(({ id }) => id === input.locationId)) {
		throw new ValidationError('LOCATION_NOT_FOUND', 'Select an available Location.', { field: 'locationId' });
	}
	const availableTypeIds = new Set(references.types.map(({ id }) => id));
	if (input.typeIds.some((id) => !availableTypeIds.has(id))) {
		throw new ValidationError('UNKNOWN_GARDEN_TYPE', 'Remove unavailable Garden Types before saving.', { field: 'typeIds' });
	}
	return input;
}

export async function loadGardenEdit(workspace, id) {
	try {
		let garden;
		try {
			garden = await workspace.gardens.getById(id);
		} catch (error) {
			if (error instanceof ValidationError && error.code === 'INVALID_RECORD_ID') {
				return { status: 'not-found' };
			}
			throw error;
		}
		if (!garden) return { status: 'not-found' };
		const [locations, types] = await Promise.all([
			workspace.locations.list(), workspace.types.list(),
		]);
		return { status: 'ready', garden, references: { locations, types } };
	} catch {
		return { status: 'error' };
	}
}

function editError(error) {
	if (error instanceof ValidationError) return error.message;
	if (error instanceof StorageError) {
		return 'Changes could not be saved. Your entries are still here. Please try again.';
	}
	return 'Something unexpected prevented these changes from being saved. Please try again.';
}

export function GardenEditView({
	state,
	fields,
	errors = {},
	message = '',
	saving = false,
	onChange = () => {},
	onSubmit = () => {},
	onCancel = () => {},
	onRetry = () => {},
	forceReadOnly = false,
}) {
	if (state.status === 'loading') {
		return <section class="container gardens-page"><p class="gardens-state" role="status">Loading Garden editor…</p></section>;
	}
	if (state.status === 'error') {
		return <section class="container gardens-page"><div class="gardens-state" role="alert"><h1>Garden editor could not be loaded</h1><p>Garden data could not be loaded. Please try again.</p><div class="garden-edit__state-actions"><button class="btn-outline" type="button" onClick={onRetry}>Retry</button><a class="btn-text" href="/gardens">All Gardens</a></div></div></section>;
	}
	if (state.status === 'not-found') {
		return <section class="container gardens-page"><div class="gardens-state"><h1>Garden not found</h1><p>This Garden link is invalid or the record is no longer available.</p><a class="btn-outline" href="/gardens">All Gardens</a></div></section>;
	}

	const readOnly = forceReadOnly || state.garden.isClosed || state.garden.status === 'archived';
	const readOnlyReason = forceReadOnly
		? 'became read-only before these changes could be saved'
		: state.garden.isClosed ? 'is closed' : 'is archived';
	return (
		<section class="container gardens-page garden-edit" aria-labelledby="garden-edit-title">
			<header class="gardens-header">
				<p class="garden-create__eyebrow">Garden details</p>
				<h1 id="garden-edit-title">Edit {state.garden.name}</h1>
				<p>{readOnly ? 'Garden details are shown here for reference.' : 'Changes are saved only when you choose Save Changes.'}</p>
			</header>
			{readOnly && <div class="garden-edit__notice" role="status"><i class="bi bi-lock" aria-hidden="true"></i><span>This Garden is read-only because it {readOnlyReason}. It must be unlocked in a later lifecycle workflow before it can be edited.</span></div>}
			{message && <div class="garden-create__error" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{message}</span></div>}
			<form class="garden-full-create__form" noValidate onSubmit={readOnly ? (event) => event.preventDefault() : onSubmit}>
				<GardenFields
					fields={fields}
					errors={errors}
					locations={state.references.locations}
					types={state.references.types}
					onChange={onChange}
					disabled={saving || readOnly}
					includeNotes
					idPrefix="edit-garden"
				/>
				<div class="garden-full-create__actions garden-edit__actions">
					<button class="btn-outline" type="button" disabled={saving} onClick={onCancel}>Cancel</button>
					{!readOnly && <button class="btn-solid theme-primary" type="submit" disabled={saving}><i class="bi bi-check2" aria-hidden="true"></i>{saving ? 'Saving…' : 'Save Changes'}</button>}
				</div>
			</form>
		</section>
	);
}

function GardenEditRecord({ id }) {
	const { repositories } = useStorage();
	const { route } = useLocation();
	const workspace = useMemo(() => ({
		gardens: createGardensService(repositories.gardens),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
	}), [repositories]);
	const [attempt, setAttempt] = useState(0);
	const [state, setState] = useState({ status: 'loading' });
	const [fields, setFields] = useState(null);
	const [errors, setErrors] = useState({});
	const [message, setMessage] = useState('');
	const [saving, setSaving] = useState(false);
	const [forceReadOnly, setForceReadOnly] = useState(false);
	const submitting = useRef(false);

	useEffect(() => {
		let active = true;
		setState({ status: 'loading' });
		void loadGardenEdit(workspace, id).then((result) => {
			if (!active) return;
			setState(result);
			if (result.status === 'ready') setFields(gardenEditFields(result.garden));
		});
		setForceReadOnly(false);
		return () => { active = false; };
	}, [workspace, id, attempt]);

	function changeField(field, value) {
		setFields((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
		setMessage('');
	}

	async function save(event) {
		event?.preventDefault();
		if (submitting.current || state.status !== 'ready') return;
		let input;
		try {
			input = validateGardenEdit(fields, state.references, workspace.gardens);
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(editError(error));
			return;
		}

		submitting.current = true;
		setSaving(true);
		setErrors({});
		setMessage('');
		try {
			const updated = await workspace.gardens.update(id, input);
			if (!updated) {
				setMessage('This Garden is no longer available. Your entries have not been saved.');
				return;
			}
			route(`/gardens/${id}`, true);
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(error?.code === 'GARDEN_READ_ONLY'
				? 'This Garden became read-only before the save completed. Your entries have not been saved.'
				: editError(error));
			if (error?.code === 'GARDEN_READ_ONLY') {
				setForceReadOnly(true);
			}
		} finally {
			submitting.current = false;
			setSaving(false);
		}
	}

	if (state.status !== 'ready' || !fields) {
		return <GardenEditView state={state} onRetry={() => setAttempt((value) => value + 1)} />;
	}
	return <GardenEditView state={state} fields={fields} errors={errors} message={message} saving={saving} forceReadOnly={forceReadOnly} onChange={changeField} onSubmit={save} onCancel={() => route(`/gardens/${id}`)} />;
}

export function EditGarden({ id }) {
	return <GardenEditRecord key={id} id={id} />;
}
