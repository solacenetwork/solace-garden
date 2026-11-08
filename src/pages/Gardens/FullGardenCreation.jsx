import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GardenFields } from '../../components/GardenFields.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import {
	createGardenDraftsService,
	gardenDraftFieldsFromTemplate,
	gardenInputFromDraftFields,
	gardenTemplateWouldOverwriteDraft,
} from '../../services/gardenDrafts.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardensService } from '../../services/gardens.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createLocationsService, DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/index.js';
import { GardenTemplateSelection } from './GardenTemplateSelection.jsx';

const templateLocationOrigins = new Map();

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
		templates: createGardenTemplatesService(repositories.gardenTemplates),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
	}), [repositories]);
}

export async function applyTemplateToGardenDraft({
	templateId,
	draft,
	currentFields,
	autosave,
	drafts,
	templates,
	confirmReplacement = () => globalThis.confirm('Applying this Template will replace details already entered in this draft. Continue?'),
}) {
	const resolution = await templates.resolveConfiguration(templateId);
	if (!resolution) return { status: 'missing' };
	const fields = gardenDraftFieldsFromTemplate(resolution.configuration, currentFields);
	if (gardenTemplateWouldOverwriteDraft(currentFields, fields) && !confirmReplacement()) {
		return { status: 'cancelled' };
	}
	await autosave.stop();
	const saved = await drafts.save({ id: draft.id, fields, createdAt: draft.createdAt });
	return {
		status: 'applied',
		fields: saved.fields,
		createdAt: saved.createdAt,
		locationResolution: resolution.locationResolution,
	};
}

export function resolveTemplateLocationForFinalization(fields, locations, origin) {
	if (locations.some(({ id }) => id === fields.locationId)) {
		return { fields, fallbackOccurred: false, locationUnavailable: false };
	}
	if (
		origin?.locationId === fields.locationId
		&& locations.some(({ id }) => id === DEFAULT_LOCATION_ID)
	) {
		return {
			fields: { ...fields, typeIds: [...fields.typeIds], locationId: DEFAULT_LOCATION_ID },
			fallbackOccurred: true,
			locationUnavailable: false,
		};
	}
	return { fields, fallbackOccurred: false, locationUnavailable: true };
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

export function GardenDraftEditor({ draft, references, mode, workspace }) {
	const { route } = useLocation();
	const createdAt = useRef(draft.createdAt);
	const submitting = useRef(false);
	const fieldsRef = useRef(draft.fields);
	const templateLocationOrigin = useRef(templateLocationOrigins.get(draft.id) ?? null);
	const [fields, setFields] = useState(draft.fields);
	const [currentReferences, setCurrentReferences] = useState(references);
	const [stage, setStage] = useState(0);
	const [status, setStatus] = useState('draft-saved');
	const [errors, setErrors] = useState({});
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [selectedTemplateId, setSelectedTemplateId] = useState(null);
	const [templateState, setTemplateState] = useState({ status: 'loading' });
	const [templateNotice, setTemplateNotice] = useState('');
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

	async function loadTemplates() {
		setTemplateState({ status: 'loading' });
		try {
			setTemplateState({ status: 'ready', templates: await workspace.templates.list() });
		} catch (error) {
			setTemplateState({ status: 'error', error });
		}
	}

	useEffect(() => { void loadTemplates(); }, [workspace.templates]);

	function changeField(field, value) {
		if (field === 'locationId') {
			templateLocationOrigin.current = null;
			templateLocationOrigins.delete(draft.id);
		}
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
			const input = validateGardenDraftForReview(fieldsRef.current, currentReferences, workspace.gardens);
			setErrors({});
			return input;
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(creationError(error, 'validated'));
			return null;
		}
	}

	async function applySelectedTemplate() {
		if (!selectedTemplateId || busy) return;
		setBusy(true);
		setMessage('');
		setTemplateNotice('');
		try {
			const result = await applyTemplateToGardenDraft({
				templateId: selectedTemplateId,
				draft: { id: draft.id, createdAt: createdAt.current },
				currentFields: fieldsRef.current,
				autosave,
				drafts: workspace.drafts,
				templates: workspace.templates,
			});
			if (result.status === 'cancelled') return;
			if (result.status === 'missing') {
				setSelectedTemplateId(null);
				setMessage('That Template was deleted before it could be applied. Choose another Template or continue from scratch.');
				await loadTemplates();
				return;
			}
			createdAt.current = result.createdAt;
			fieldsRef.current = result.fields;
			setFields(result.fields);
			setErrors({});
			setStatus('draft-saved');
			templateLocationOrigin.current = { locationId: result.fields.locationId };
			templateLocationOrigins.set(draft.id, templateLocationOrigin.current);
			setTemplateNotice(result.locationResolution.fallbackOccurred
				? 'Template applied. Its saved Location is no longer available, so Default Location was selected.'
				: 'Template applied to this draft. The Garden remains independent of the Template.');
			if (mode === 'wizard') setStage(1);
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
		} finally {
			setBusy(false);
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

	async function persistTemplateLocationFallback(locationResult) {
		const saved = await workspace.drafts.save({
			id: draft.id,
			fields: locationResult.fields,
			createdAt: createdAt.current,
		});
		createdAt.current = saved.createdAt;
		fieldsRef.current = saved.fields;
		setFields(saved.fields);
		setErrors({});
		setStatus('draft-saved');
		templateLocationOrigin.current = null;
		templateLocationOrigins.delete(draft.id);
		setTemplateNotice('The Template Location became unavailable. Default Location was selected; review it, then create the Garden again.');
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
			templateLocationOrigins.delete(draft.id);
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
		submitting.current = true;
		setBusy(true);
		setMessage('');
		try {
			await persistCurrent();
			const [locations, types] = await Promise.all([
				workspace.locations.list(),
				workspace.types.list(),
			]);
			const freshReferences = { locations, types };
			setCurrentReferences(freshReferences);
			const locationResult = resolveTemplateLocationForFinalization(
				fieldsRef.current,
				locations,
				templateLocationOrigin.current,
			);
			if (locationResult.locationUnavailable) {
				setErrors({ locationId: 'Select an available Location.' });
				setMessage('The selected Location is no longer available. Choose another Location before creating this Garden.');
				return;
			}
			if (locationResult.fallbackOccurred) {
				await persistTemplateLocationFallback(locationResult);
				return;
			}
			const input = validateGardenDraftForReview(fieldsRef.current, freshReferences, workspace.gardens);
			setErrors({});
			let garden;
			try {
				garden = await workspace.gardens.createFromDraft(input, draft.id);
			} catch (error) {
				if (error?.code !== 'LOCATION_NOT_FOUND' || !templateLocationOrigin.current) throw error;
				const latestLocations = await workspace.locations.list();
				setCurrentReferences((current) => ({ ...current, locations: latestLocations }));
				const raceResult = resolveTemplateLocationForFinalization(
					fieldsRef.current,
					latestLocations,
					templateLocationOrigin.current,
				);
				if (!raceResult.fallbackOccurred) throw error;
				await persistTemplateLocationFallback(raceResult);
				return;
			}
			templateLocationOrigins.delete(draft.id);
			route(`/gardens/${garden.id}`);
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(creationError(error, 'created'));
		} finally {
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
			{templateNotice && <div class="garden-template-notice" role="status"><i class="bi bi-info-circle" aria-hidden="true"></i><span>{templateNotice}</span></div>}
			<div class="garden-full-create__toolbar">
				<button class="btn-outline" type="button" disabled={busy} onClick={() => navigatePreservingDraft(`/gardens/new/${otherMode}/${draft.id}`)}>Switch to {otherMode === 'wizard' ? 'Wizard' : 'Advanced'}</button>
				<button class="btn-text theme-danger" type="button" disabled={busy} onClick={discard}><i class="bi bi-trash3" aria-hidden="true"></i> Discard Draft</button>
			</div>

			<form class="garden-full-create__form" noValidate onSubmit={createGarden}>
				{mode === 'wizard' ? <>
					<GardenStepper stage={stage} />
					{stage === 0 && <GardenTemplateSelection state={templateState} references={currentReferences} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} onApply={applySelectedTemplate} onRetry={loadTemplates} busy={busy} idPrefix="wizard-garden" applyLabel="Apply Template and Continue" />}
					{stage === 1 && <section class="garden-wizard__stage" aria-labelledby="details-stage-title"><h2 id="details-stage-title">Garden details</h2><GardenFields fields={fields} errors={errors} locations={currentReferences.locations} types={currentReferences.types} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>}
					{stage === 2 && <section class="garden-wizard__stage"><GardenReview fields={fields} locations={currentReferences.locations} types={currentReferences.types} /></section>}
					<div class="garden-full-create__actions">
						<button class="btn-outline" type="button" disabled={busy} onClick={() => stage === 0 ? navigatePreservingDraft('/gardens') : setStage((value) => value - 1)}>{stage === 0 ? 'Back to Gardens' : 'Back'}</button>
						{stage < 2 ? <button class="btn-solid theme-primary" type="button" disabled={busy || (stage === 0 && selectedTemplateId !== null)} onClick={() => stage === 1 ? review() : setStage(1)}>Continue</button> : <button class="btn-solid theme-primary" type="submit" disabled={busy}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Create Garden'}</button>}
					</div>
				</> : <>
					<GardenTemplateSelection state={templateState} references={currentReferences} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} onApply={applySelectedTemplate} onRetry={loadTemplates} busy={busy} idPrefix="advanced-garden" />
					<section aria-labelledby="advanced-details-title"><h2 id="advanced-details-title">Garden details</h2><GardenFields fields={fields} errors={errors} locations={currentReferences.locations} types={currentReferences.types} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
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
