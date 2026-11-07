import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GardenTypeSelector } from '../../components/GardenTypeSelector.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import {
	createGardenDraftsService, gardenInputFromDraftFields,
} from '../../services/gardenDrafts.js';
import { createGardensService } from '../../services/gardens.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createLocationsService } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/index.js';

const STATUS_TEXT = {
	'all-saved': 'All changes saved',
	saving: 'Saving draft…',
	'draft-saved': 'Draft saved locally',
	error: 'Unable to save draft',
};

function creationError(error, action) {
	if (error instanceof ValidationError) return error.message;
	if (error instanceof StorageError) {
		return `Your Garden could not be ${action}. Your draft remains available.`;
	}
	return `Something unexpected prevented your Garden from being ${action}.`;
}

function useGardenCreationWorkspace() {
	const { repositories } = useStorage();
	return useMemo(() => ({
		gardens: createGardensService(repositories.gardens),
		drafts: createGardenDraftsService(repositories.drafts),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
	}), [repositories]);
}

export function validateGardenDraftForReview(fields, references, gardens) {
	const input = gardenInputFromDraftFields(fields);
	gardens.validate(input);
	if (!references.locations.some(({ id }) => id === input.locationId)) {
		throw new ValidationError('LOCATION_NOT_FOUND', 'Select an available Location.', { field: 'locationId' });
	}
	const typeIds = new Set(references.types.map(({ id }) => id));
	if (input.typeIds.some((id) => !typeIds.has(id))) {
		throw new ValidationError('UNKNOWN_GARDEN_TYPE', 'One or more selected Garden Types are unavailable.', { field: 'typeIds' });
	}
	return input;
}

export function GardenStepper({ stage }) {
	const labels = ['Start', 'Details', 'Review'];
	return (
		<div class="stepper-overflow garden-wizard__stepper-wrap">
			<ol class="stepper md:stepper-horizontal" aria-label="Garden creation progress">
				{labels.map((label, index) => (
					<li
						class={`stepper-item${index <= stage ? ' active' : ''}${index < stage ? ' garden-step--complete' : ''}${index === stage ? ' garden-step--current' : ''}`}
						aria-current={index === stage ? 'step' : undefined}
						key={label}
					>
						<span>{label}<span class="visually-hidden">{index < stage ? ' completed' : index === stage ? ' current' : ' upcoming'}</span></span>
					</li>
				))}
			</ol>
		</div>
	);
}

function FieldError({ id, message }) {
	return message ? <div id={id} class="invalid-feedback">{message}</div> : null;
}

function GardenDetailsFields({ fields, errors, locations, types, onChange, disabled }) {
	return (
		<div class="garden-fields">
			<div class="form-field garden-fields__wide">
				<label class="form-label" for="full-garden-name">Garden name</label>
				<input id="full-garden-name" class={`form-control${errors.name ? ' is-invalid' : ''}`} type="text" required value={fields.name} disabled={disabled} aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? 'garden-name-error' : undefined} onInput={(event) => onChange('name', event.currentTarget.value)} />
				<FieldError id="garden-name-error" message={errors.name} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for="garden-subtitle">Subtitle <span>(optional)</span></label>
				<input id="garden-subtitle" class={`form-control${errors.subtitle ? ' is-invalid' : ''}`} type="text" value={fields.subtitle} disabled={disabled} aria-invalid={errors.subtitle ? 'true' : undefined} aria-describedby={errors.subtitle ? 'garden-subtitle-error' : undefined} onInput={(event) => onChange('subtitle', event.currentTarget.value)} />
				<FieldError id="garden-subtitle-error" message={errors.subtitle} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for="garden-description">Description <span>(optional)</span></label>
				<textarea id="garden-description" class={`form-control${errors.description ? ' is-invalid' : ''}`} rows="4" value={fields.description} disabled={disabled} aria-invalid={errors.description ? 'true' : undefined} aria-describedby={errors.description ? 'garden-description-error' : undefined} onInput={(event) => onChange('description', event.currentTarget.value)}></textarea>
				<FieldError id="garden-description-error" message={errors.description} />
			</div>
			<div class="form-field garden-fields__wide">
				<label class="form-label" for="garden-location">Location</label>
				<select id="garden-location" class={`form-control${errors.locationId ? ' is-invalid' : ''}`} required value={fields.locationId} disabled={disabled} aria-invalid={errors.locationId ? 'true' : undefined} aria-describedby={errors.locationId ? 'garden-location-error' : undefined} onChange={(event) => onChange('locationId', event.currentTarget.value)}>
					{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
				</select>
				<FieldError id="garden-location-error" message={errors.locationId} />
			</div>
			<div class="garden-fields__wide">
				<GardenTypeSelector types={types} selectedIds={fields.typeIds} onChange={(value) => onChange('typeIds', value)} disabled={disabled} />
				{errors.typeIds && <p class="garden-fields__error" role="alert">{errors.typeIds}</p>}
			</div>
			<div class="form-field">
				<label class="form-label" for="garden-start-date">Start date <span>(optional)</span></label>
				<input id="garden-start-date" class={`form-control${errors.startDate ? ' is-invalid' : ''}`} type="date" value={fields.startDate} disabled={disabled} aria-invalid={errors.startDate ? 'true' : undefined} aria-describedby={errors.startDate ? 'garden-start-date-error' : undefined} onInput={(event) => onChange('startDate', event.currentTarget.value)} />
				<FieldError id="garden-start-date-error" message={errors.startDate} />
			</div>
			<div class="form-field">
				<label class="form-label" for="garden-end-date">End date <span>(optional)</span></label>
				<input id="garden-end-date" class={`form-control${errors.endDate ? ' is-invalid' : ''}`} type="date" value={fields.endDate} disabled={disabled} aria-invalid={errors.endDate ? 'true' : undefined} aria-describedby={errors.endDate ? 'garden-end-date-error' : undefined} onInput={(event) => onChange('endDate', event.currentTarget.value)} />
				<FieldError id="garden-end-date-error" message={errors.endDate} />
			</div>
		</div>
	);
}

function GardenReview({ fields, locations, types }) {
	const location = locations.find(({ id }) => id === fields.locationId)?.name ?? 'Unavailable Location';
	const selectedTypes = fields.typeIds.map((id) => types.find((type) => type.id === id)?.name ?? 'Unavailable type');
	return (
		<div class="garden-review">
			<h2>Review your Garden</h2>
			<p>Confirm these details before creating the persistent Planned Garden.</p>
			<dl class="garden-facts">
				<div><dt>Name</dt><dd>{fields.name.trim() || 'Untitled Garden'}</dd></div>
				<div><dt>Subtitle</dt><dd>{fields.subtitle.trim() || 'None'}</dd></div>
				<div><dt>Location</dt><dd>{location}</dd></div>
				<div><dt>Garden Types</dt><dd>{selectedTypes.length ? selectedTypes.join(', ') : 'No types selected'}</dd></div>
				<div><dt>Start date</dt><dd>{fields.startDate || 'Not set'}</dd></div>
				<div><dt>End date</dt><dd>{fields.endDate || 'Not set'}</dd></div>
			</dl>
			{fields.description.trim() && <div class="garden-review__description"><h3>Description</h3><p>{fields.description}</p></div>}
		</div>
	);
}

function GardenDraftEditor({ draft, references, mode, workspace }) {
	const { route } = useLocation();
	const createdAt = useRef(draft.createdAt);
	const submitting = useRef(false);
	const fieldsRef = useRef(draft.fields);
	const [fields, setFields] = useState(draft.fields);
	const [stage, setStage] = useState(0);
	const [status, setStatus] = useState('draft-saved');
	const [errors, setErrors] = useState({});
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const autosave = useMemo(() => createDraftAutosave({
		write: async (value) => {
			const saved = await workspace.drafts.save({ id: draft.id, fields: value, createdAt: createdAt.current });
			createdAt.current = saved.createdAt;
		},
		onStatus: (nextStatus, error) => {
			setStatus(nextStatus);
			if (error) setMessage(creationError(error, 'saved'));
		},
	}), [draft.id, workspace.drafts]);

	useEffect(() => () => { void autosave.flush(); }, [autosave]);

	function changeField(field, value) {
		setFields((current) => {
			const next = { ...current, [field]: value };
			fieldsRef.current = next;
			autosave.schedule(next);
			return next;
		});
		setErrors((current) => ({ ...current, [field]: undefined }));
		setMessage('');
	}

	function validate() {
		try {
			const input = validateGardenDraftForReview(fieldsRef.current, references, workspace.gardens);
			setErrors({});
			return input;
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(creationError(error, 'validated'));
			return null;
		}
	}

	async function persistCurrent() {
		await autosave.stop();
		const saved = await workspace.drafts.save({
			id: draft.id,
			fields: fieldsRef.current,
			createdAt: createdAt.current,
		});
		createdAt.current = saved.createdAt;
		setStatus('draft-saved');
	}

	async function navigatePreservingDraft(path) {
		if (busy) return;
		setBusy(true);
		setMessage('');
		try {
			await persistCurrent();
			route(path);
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
			setBusy(false);
		}
	}

	async function discard() {
		if (!globalThis.confirm('Permanently discard this unfinished Garden draft?')) return;
		setBusy(true);
		setMessage('');
		await autosave.stop();
		try {
			await workspace.drafts.remove(draft.id);
			route('/gardens', true);
		} catch (error) {
			setMessage(creationError(error, 'discarded'));
			setStatus('error');
			setBusy(false);
		}
	}

	async function createGarden(event) {
		event?.preventDefault();
		if (submitting.current) return;
		const input = validate();
		if (!input) return;
		submitting.current = true;
		setBusy(true);
		setMessage('');
		try {
			await persistCurrent();
			const garden = await workspace.gardens.createFromDraft(input, draft.id);
			route(`/gardens/${garden.id}`);
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(creationError(error, 'created'));
			setBusy(false);
			submitting.current = false;
		}
	}

	function review() {
		if (validate()) setStage(2);
	}

	const otherMode = mode === 'wizard' ? 'advanced' : 'wizard';
	const title = mode === 'wizard' ? 'Create Garden Wizard' : 'Advanced Garden Creation';
	return (
		<section class="container gardens-page garden-full-create" aria-labelledby="full-create-title">
			<header class="gardens-header garden-full-create__header">
				<div><p class="garden-create__eyebrow">Recoverable draft</p><h1 id="full-create-title">{title}</h1><p>Your progress is saved locally until you create or discard this Garden.</p></div>
				<p class={`garden-draft-status garden-draft-status--${status}`} role="status">{STATUS_TEXT[status]}</p>
			</header>
			{message && <div class="garden-create__error" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{message}</span></div>}
			<div class="garden-full-create__toolbar">
				<button class="btn-outline" type="button" disabled={busy} onClick={() => navigatePreservingDraft(`/gardens/new/${otherMode}/${draft.id}`)}>Switch to {otherMode === 'wizard' ? 'Wizard' : 'Advanced'}</button>
				<button class="btn-text theme-danger" type="button" disabled={busy} onClick={discard}><i class="bi bi-trash3" aria-hidden="true"></i> Discard Draft</button>
			</div>

			<form class="garden-full-create__form" noValidate onSubmit={createGarden}>
				{mode === 'wizard' ? <>
					<GardenStepper stage={stage} />
					{stage === 0 && <section class="garden-wizard__stage" aria-labelledby="start-stage-title"><h2 id="start-stage-title">Start from scratch</h2><p>Create an independent Planned Garden using the details you choose.</p><div class="garden-start-option"><i class="bi bi-flower1" aria-hidden="true"></i><div><strong>Start from Scratch</strong><span>Selected for this draft</span></div></div><p class="garden-template-future"><i class="bi bi-lock" aria-hidden="true"></i> Saved Garden Templates arrive in Milestone 8F.</p></section>}
					{stage === 1 && <section class="garden-wizard__stage" aria-labelledby="details-stage-title"><h2 id="details-stage-title">Garden details</h2><GardenDetailsFields fields={fields} errors={errors} locations={references.locations} types={references.types} onChange={changeField} disabled={busy} /></section>}
					{stage === 2 && <section class="garden-wizard__stage"><GardenReview fields={fields} locations={references.locations} types={references.types} /></section>}
					<div class="garden-full-create__actions">
						<button class="btn-outline" type="button" disabled={busy} onClick={() => stage === 0 ? navigatePreservingDraft('/gardens') : setStage((value) => value - 1)}>{stage === 0 ? 'Back to Gardens' : 'Back'}</button>
						{stage < 2 ? <button class="btn-solid theme-primary" type="button" disabled={busy} onClick={() => stage === 1 ? review() : setStage(1)}>Continue</button> : <button class="btn-solid theme-primary" type="submit" disabled={busy}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Create Garden'}</button>}
					</div>
				</> : <>
					<section aria-labelledby="advanced-details-title"><h2 id="advanced-details-title">Garden details</h2><GardenDetailsFields fields={fields} errors={errors} locations={references.locations} types={references.types} onChange={changeField} disabled={busy} /></section>
					<div class="garden-full-create__actions"><button class="btn-outline" type="button" disabled={busy} onClick={() => navigatePreservingDraft('/gardens')}>Back to Gardens</button><button class="btn-solid theme-primary" type="submit" disabled={busy}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Create Garden'}</button></div>
				</>}
			</form>
		</section>
	);
}

function GardenDraftLoadState({ state }) {
	if (state.status === 'loading') return <div class="container gardens-page"><div class="gardens-state" role="status">Loading Garden draft…</div></div>;
	return <div class="container gardens-page"><div class="gardens-state" role="alert"><h1>Garden draft could not be opened</h1><p>{state.message}</p><a class="btn-solid theme-primary" href="/gardens">Back to Gardens</a></div></div>;
}

export function GardenDraftRoute({ params, mode }) {
	const workspace = useGardenCreationWorkspace();
	const draftId = params?.draftId;
	const [state, setState] = useState({ status: 'loading' });
	useEffect(() => {
		let active = true;
		Promise.all([workspace.drafts.getById(draftId), workspace.locations.list(), workspace.types.list()])
			.then(([draft, locations, types]) => {
				if (!active) return;
				setState(draft
					? { status: 'ready', draft, references: { locations, types } }
					: { status: 'error', message: 'This draft may have been discarded, created already, or the address may be incorrect.' });
			}, (error) => active && setState({ status: 'error', message: creationError(error, 'opened') }));
		return () => { active = false; };
	}, [draftId, workspace]);
	if (state.status !== 'ready') return <GardenDraftLoadState state={state} />;
	return <GardenDraftEditor key={`${draftId}-${mode}`} draft={state.draft} references={state.references} mode={mode} workspace={workspace} />;
}

export function NewGardenDraftRoute({ mode }) {
	const { route } = useLocation();
	const { drafts } = useGardenCreationWorkspace();
	const started = useRef(false);
	const [error, setError] = useState('');
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		let active = true;
		drafts.create().then((draft) => {
			if (active) route(`/gardens/new/${mode}/${draft.id}`, true);
		}, (creationFailure) => {
			if (active) setError(creationError(creationFailure, 'started'));
		});
		return () => { active = false; };
	}, [drafts, mode, route]);
	return <GardenDraftLoadState state={error ? { status: 'error', message: error } : { status: 'loading' }} />;
}
