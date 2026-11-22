import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GardenFields } from '../../components/GardenFields.jsx';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import { WizardStepper } from '../../components/WizardStepper.jsx';
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
import { StorageError, ValidationError } from '../../storage/errors.js';
import { GardenTemplateSelection } from './GardenTemplateSelection.jsx';
import { templateSourceSearch } from './creationNavigation.js';
import {
	createGardenWizardUrl,
	loadGardenWizardSteps,
	navigateGardenWizardStep,
	requestedGardenWizardStep,
	resolveGardenWizardLocation,
} from './gardenWizardNavigation.js';
import { adjacentWizardStepId, findWizardStep } from '../../wizard/wizardNavigation.js';

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
	const saved = await drafts.save({
		id: draft.id,
		fields,
		sourceTemplateId: templateId,
		preferredEditor: draft.preferredEditor,
		currentStepId: draft.currentStepId,
		createdAt: draft.createdAt,
	});
	return {
		status: 'applied',
		fields: saved.fields,
		sourceTemplateId: saved.sourceTemplateId,
		preferredEditor: saved.preferredEditor,
		currentStepId: saved.currentStepId,
		createdAt: saved.createdAt,
		locationResolution: resolution.locationResolution,
	};
}

export async function clearTemplateFromGardenDraft({ draft, currentFields, autosave, drafts }) {
	await autosave.stop();
	return drafts.save({
		id: draft.id,
		fields: currentFields,
		sourceTemplateId: null,
		preferredEditor: draft.preferredEditor,
		currentStepId: draft.currentStepId,
		createdAt: draft.createdAt,
	});
}

export function templateLocationOriginForDraft(draft, templates) {
	const source = templates.find(({ id }) => id === draft.sourceTemplateId);
	return source && draft.fields.locationId === source.configuration.locationId
		? { locationId: draft.fields.locationId }
		: null;
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

export function GardenDraftEditor({ draft, references, mode, workspace, wizardSteps }) {
	const { path, query = {}, route } = useLocation();
	const resolvedWizardSteps = wizardSteps ?? loadGardenWizardSteps();
	const createdAt = useRef(draft.createdAt);
	const submitting = useRef(false);
	const fieldsRef = useRef(draft.fields);
	const sourceTemplateIdRef = useRef(draft.sourceTemplateId);
	const currentStepIdRef = useRef(draft.currentStepId);
	const persistenceChain = useRef(Promise.resolve());
	// The route is the authoritative editor selection. Async route state may still
	// carry the previous draft snapshot during an editor-mode change.
	const preferredEditorRef = useRef(mode);
	const templateLocationOrigin = useRef(null);
	const [fields, setFields] = useState(draft.fields);
	const [currentReferences, setCurrentReferences] = useState(references);
	const [status, setStatus] = useState('draft-saved');
	const [errors, setErrors] = useState({});
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [selectedTemplateId, setSelectedTemplateId] = useState(draft.sourceTemplateId);
	const [templateState, setTemplateState] = useState({ status: 'loading' });
	const [templateNotice, setTemplateNotice] = useState('');
	const wizardPath = path ?? `/gardens/new/wizard/${draft.id}`;
	const stepResolution = mode === 'wizard'
		? resolveGardenWizardLocation({
			steps: resolvedWizardSteps,
			query,
			persistedStepId: currentStepIdRef.current,
		})
		: null;
	const activeStepId = stepResolution?.status === 'resolved' ? stepResolution.stepId : null;
	const activeStep = activeStepId ? findWizardStep(resolvedWizardSteps, activeStepId) : null;

	function saveDraft(record) {
		const operation = persistenceChain.current
			.catch(() => undefined)
			.then(() => workspace.drafts.save(record));
		persistenceChain.current = operation;
		return operation;
	}

	const autosave = useMemo(() => createDraftAutosave({
		write: async (value) => {
			const saved = await saveDraft({
				id: draft.id,
				fields: value,
				sourceTemplateId: sourceTemplateIdRef.current,
				preferredEditor: preferredEditorRef.current,
				currentStepId: preferredEditorRef.current === 'wizard' ? currentStepIdRef.current : null,
				createdAt: createdAt.current,
			});
			createdAt.current = saved.createdAt;
		},
		onStatus: (nextStatus, error) => {
			setStatus(nextStatus);
			if (error) setMessage(creationError(error, 'saved'));
		},
	}), [draft.id, workspace.drafts]);

	useEffect(() => () => { void autosave.flush(); }, [autosave]);

	const requestedStepId = mode === 'wizard' ? requestedGardenWizardStep(query) : undefined;
	useEffect(() => {
		if (mode === 'advanced') {
			if (currentStepIdRef.current !== null) {
				currentStepIdRef.current = null;
				void persistCurrent({ currentStepId: null }).catch((error) => {
					setStatus('error');
					setMessage(creationError(error, 'saved'));
				});
			}
			return;
		}
		if (stepResolution.status !== 'resolved') return;
		if (requestedStepId === undefined) {
			navigateGardenWizardStep({
				route,
				path: wizardPath,
				query,
				stepId: stepResolution.stepId,
				replace: true,
			});
			return;
		}
		if (currentStepIdRef.current !== stepResolution.stepId) {
			currentStepIdRef.current = stepResolution.stepId;
			setStatus('saving');
			void persistCurrent({ currentStepId: stepResolution.stepId }).catch((error) => {
				setStatus('error');
				setMessage(creationError(error, 'saved'));
			});
		}
	}, [mode, requestedStepId, route, stepResolution?.status, stepResolution?.stepId, wizardPath]);

	async function loadTemplates() {
		setTemplateState({ status: 'loading' });
		try {
			const templates = await workspace.templates.list();
			setTemplateState({ status: 'ready', templates });
			const source = templates.find(({ id }) => id === sourceTemplateIdRef.current);
			templateLocationOrigin.current = templateLocationOriginForDraft({
				fields: fieldsRef.current,
				sourceTemplateId: sourceTemplateIdRef.current,
			}, templates);
			if (sourceTemplateIdRef.current && !source) {
				setTemplateNotice('The source Template is no longer available. Your independent draft and edits are preserved.');
			}
		} catch (error) {
			setTemplateState({ status: 'error', error });
		}
	}

	useEffect(() => { void loadTemplates(); }, [workspace.templates]);

	function changeField(field, value) {
		if (field === 'locationId') {
			templateLocationOrigin.current = null;
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

	async function applySelectedTemplate() {
		if (!selectedTemplateId || busy) return;
		setBusy(true);
		setMessage('');
		setTemplateNotice('');
		try {
			const result = await applyTemplateToGardenDraft({
				templateId: selectedTemplateId,
				draft: {
					id: draft.id,
					createdAt: createdAt.current,
					preferredEditor: preferredEditorRef.current,
					currentStepId: currentStepIdRef.current,
				},
				currentFields: fieldsRef.current,
				autosave,
				drafts: { save: saveDraft },
				templates: workspace.templates,
			});
			if (result.status === 'cancelled') return;
			if (result.status === 'missing') {
				setSelectedTemplateId(sourceTemplateIdRef.current);
				setMessage('That Template was deleted before it could be applied. Choose another Template or continue from scratch.');
				await loadTemplates();
				return;
			}
			createdAt.current = result.createdAt;
			sourceTemplateIdRef.current = result.sourceTemplateId;
			preferredEditorRef.current = result.preferredEditor;
			fieldsRef.current = result.fields;
			setFields(result.fields);
			setErrors({});
			setStatus('draft-saved');
			templateLocationOrigin.current = { locationId: result.fields.locationId };
			setTemplateNotice(result.locationResolution.fallbackOccurred
				? 'Template applied. Its saved Location is no longer available, so Default Location was selected.'
				: 'Template applied to this draft. The Garden remains independent of the Template.');
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
		} finally {
			setBusy(false);
		}
	}

	async function selectTemplateSource(templateId) {
		if (templateId !== null) {
			setSelectedTemplateId(templateId);
			return;
		}
		if (busy) return;
		if (sourceTemplateIdRef.current === null) {
			setSelectedTemplateId(null);
			return;
		}
		setBusy(true);
		setMessage('');
		try {
			const saved = await clearTemplateFromGardenDraft({
				draft: {
					id: draft.id,
					preferredEditor: preferredEditorRef.current,
					currentStepId: currentStepIdRef.current,
					createdAt: createdAt.current,
				},
				currentFields: fieldsRef.current,
				autosave,
				drafts: { save: saveDraft },
			});
			createdAt.current = saved.createdAt;
			sourceTemplateIdRef.current = null;
			setSelectedTemplateId(null);
			templateLocationOrigin.current = null;
			setTemplateNotice('Start from Scratch selected. Existing draft fields were kept.');
			setStatus('draft-saved');
		} catch (error) {
			setSelectedTemplateId(sourceTemplateIdRef.current);
			setStatus('error');
			setMessage(creationError(error, 'saved'));
		} finally {
			setBusy(false);
		}
	}

	async function persistCurrent({
		sourceTemplateId = sourceTemplateIdRef.current,
		preferredEditor = preferredEditorRef.current,
		currentStepId = preferredEditor === 'wizard' ? currentStepIdRef.current : null,
	} = {}) {
		await autosave.stop();
		const saved = await saveDraft({
			id: draft.id,
			fields: fieldsRef.current,
			sourceTemplateId,
			preferredEditor,
			currentStepId,
			createdAt: createdAt.current,
		});
		createdAt.current = saved.createdAt;
		sourceTemplateIdRef.current = saved.sourceTemplateId;
		preferredEditorRef.current = saved.preferredEditor;
		currentStepIdRef.current = saved.currentStepId;
		setStatus('draft-saved');
	}

	async function persistTemplateLocationFallback(locationResult) {
		const saved = await saveDraft({
			id: draft.id,
			fields: locationResult.fields,
			sourceTemplateId: sourceTemplateIdRef.current,
			preferredEditor: preferredEditorRef.current,
			currentStepId: preferredEditorRef.current === 'wizard' ? currentStepIdRef.current : null,
			createdAt: createdAt.current,
		});
		createdAt.current = saved.createdAt;
		fieldsRef.current = saved.fields;
		setFields(saved.fields);
		setErrors({});
		setStatus('draft-saved');
		templateLocationOrigin.current = null;
		setTemplateNotice('The Template Location became unavailable. Default Location was selected; review it, then create the Garden again.');
	}

	async function navigatePreservingDraft(path, preferredEditor = preferredEditorRef.current) {
		if (busy) return;
		setBusy(true);
		setMessage('');
		try {
			const nextStepId = preferredEditor === 'wizard'
				? (findWizardStep(resolvedWizardSteps, currentStepIdRef.current)?.id ?? resolvedWizardSteps[0].id)
				: null;
			await persistCurrent({ preferredEditor, currentStepId: nextStepId });
			const destination = preferredEditor === 'wizard' && path.includes('/wizard/')
				? createGardenWizardUrl(path, nextStepId, query)
				: path;
			route(destination);
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
			setBusy(false);
		}
	}

	async function navigateToWizardStep(stepId, { replace = false } = {}) {
		if (busy || !findWizardStep(resolvedWizardSteps, stepId)) return;
		setBusy(true);
		setMessage('');
		currentStepIdRef.current = stepId;
		try {
			await persistCurrent({ currentStepId: stepId });
			navigateGardenWizardStep({
				route,
				path: wizardPath,
				query,
				stepId,
				replace,
			});
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
		} finally {
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
			route(`/gardens/${garden.id}`);
		} catch (error) {
			setErrors(error?.field ? { [error.field]: error.message } : {});
			setMessage(creationError(error, 'created'));
		} finally {
			setBusy(false);
			submitting.current = false;
		}
	}

	const otherMode = mode === 'wizard' ? 'advanced' : 'wizard';
	const title = mode === 'wizard' ? 'Create Garden Wizard' : 'Advanced Garden Creation';
	if (mode === 'wizard' && stepResolution.status === 'invalid') {
		const invalidSource = stepResolution.source === 'url'
			? 'The requested Wizard step is not available.'
			: 'The saved Wizard step is no longer available.';
		return (
			<section class="container gardens-page garden-full-create" aria-labelledby="wizard-step-error-title">
				<GardenCreationBreadcrumb current="Guided Wizard" disabled={busy} />
				<div class="gardens-state" role="alert">
					<h1 id="wizard-step-error-title">Wizard step could not be opened</h1>
					<p>{invalidSource} Your draft fields are still saved.</p>
					<button
						class="btn-solid theme-primary"
						type="button"
						disabled={busy}
						onClick={() => navigateToWizardStep(resolvedWizardSteps[0].id, { replace: true })}
					>
						Return to First Step
					</button>
				</div>
			</section>
		);
	}
	const activeStepIndex = mode === 'wizard'
		? resolvedWizardSteps.findIndex(({ id }) => id === activeStepId)
		: -1;
	const previousStepId = activeStepIndex > 0
		? adjacentWizardStepId(resolvedWizardSteps, activeStepId, -1)
		: null;
	const nextStepId = activeStepIndex >= 0 && activeStepIndex < resolvedWizardSteps.length - 1
		? adjacentWizardStepId(resolvedWizardSteps, activeStepId, 1)
		: null;
	const pendingTemplateSelection = selectedTemplateId !== null
		&& selectedTemplateId !== sourceTemplateIdRef.current;
	return (
		<section class="container gardens-page garden-full-create" aria-labelledby="full-create-title">
			<GardenCreationBreadcrumb
				current={mode === 'wizard' ? 'Guided Wizard' : 'Advanced Form'}
				disabled={busy}
				onNavigate={(path) => navigatePreservingDraft(path)}
			/>
			<header class="gardens-header garden-full-create__header">
				<div><p class="garden-create__eyebrow">Recoverable draft</p><h1 id="full-create-title">{title}</h1><p>Your progress is saved locally until you create or discard this Garden.</p></div>
				<p class={`garden-draft-status garden-draft-status--${status}`} role="status">{STATUS_TEXT[status]}</p>
			</header>
			{message && <div class="garden-create__error" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{message}</span></div>}
			{templateNotice && <div class="garden-template-notice" role="status"><i class="bi bi-info-circle" aria-hidden="true"></i><span>{templateNotice}</span></div>}
			<div class="garden-full-create__toolbar">
				<button class="btn-outline" type="button" disabled={busy} onClick={() => navigatePreservingDraft(`/gardens/new/${otherMode}/${draft.id}`, otherMode)}>Switch to {otherMode === 'wizard' ? 'Wizard' : 'Advanced'}</button>
				<button class="btn-text theme-danger" type="button" disabled={busy} onClick={discard}><i class="bi bi-trash3" aria-hidden="true"></i> Discard Draft</button>
			</div>

			<form class="garden-full-create__form" noValidate onSubmit={createGarden}>
				{mode === 'wizard' ? <>
					<GardenTemplateSelection state={templateState} references={currentReferences} selectedId={selectedTemplateId} sourceTemplateId={sourceTemplateIdRef.current} onSelect={selectTemplateSource} onApply={applySelectedTemplate} onRetry={loadTemplates} busy={busy} idPrefix="wizard-garden" />
					<WizardStepper steps={resolvedWizardSteps} activeStepId={activeStepId} label="Garden creation progress" />
					<section class="garden-wizard__stage" aria-labelledby="wizard-stage-title">
						<h2 id="wizard-stage-title">{activeStep.title}</h2>
						<GardenFields fields={fields} errors={errors} locations={currentReferences.locations} types={currentReferences.types} onChange={changeField} disabled={busy} idPrefix="create-garden" />
					</section>
					<div class="garden-full-create__actions">
						<button class="btn-outline" type="button" disabled={busy} onClick={() => previousStepId ? navigateToWizardStep(previousStepId) : navigatePreservingDraft('/gardens')}>{previousStepId ? 'Back' : 'Back to Gardens'}</button>
						{nextStepId
							? <button class="btn-solid theme-primary" type="button" disabled={busy || pendingTemplateSelection} onClick={() => navigateToWizardStep(nextStepId)}>Continue</button>
							: <button class="btn-solid theme-primary" type="submit" disabled={busy || pendingTemplateSelection}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Create Garden'}</button>}
					</div>
				</> : <>
					<GardenTemplateSelection state={templateState} references={currentReferences} selectedId={selectedTemplateId} sourceTemplateId={sourceTemplateIdRef.current} onSelect={selectTemplateSource} onApply={applySelectedTemplate} onRetry={loadTemplates} busy={busy} idPrefix="advanced-garden" />
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

export function GardenDraftRoute({ params, mode, wizardDefinition }) {
	const workspace = useGardenCreationWorkspace();
	const draftId = params?.draftId;
	let wizardSteps;
	try {
		wizardSteps = loadGardenWizardSteps(wizardDefinition);
	} catch (error) {
			console.error('[Garden Wizard] Invalid production step configuration.', {
				name: error?.name,
				message: error?.message,
				details: error?.details,
			});
		return (
				<div class="container gardens-page">
					<div class="gardens-state" role="alert">
						<h1>Garden Wizard is unavailable</h1>
						<p>The Wizard step configuration is invalid. No draft fields were changed.</p>
						<a class="btn-solid theme-primary" href="/gardens">Back to Gardens</a>
					</div>
				</div>
		);
	}
	const [state, setState] = useState({ status: 'loading' });
	const loadKey = `${draftId}:${mode}`;
	useEffect(() => {
		let active = true;
		setState({ status: 'loading', loadKey });
		Promise.all([workspace.drafts.getById(draftId), workspace.locations.list(), workspace.types.list()])
			.then(([draft, locations, types]) => {
				if (!active) return;
				setState(draft
					? { status: 'ready', loadKey, draft, references: { locations, types } }
					: { status: 'error', loadKey, message: 'This draft may have been discarded, created already, or the address may be incorrect.' });
			}, (error) => active && setState({ status: 'error', loadKey, message: creationError(error, 'opened') }));
		return () => { active = false; };
	}, [draftId, loadKey, mode, workspace]);
	if (state.loadKey !== loadKey || state.status !== 'ready') {
		return <GardenDraftLoadState state={state.loadKey === loadKey ? state : { status: 'loading' }} />;
	}
	return <GardenDraftEditor key={`${draftId}-${mode}`} draft={state.draft} references={state.references} mode={mode} workspace={workspace} wizardSteps={wizardSteps} />;
}

export function NewGardenDraftRoute({ mode }) {
	const { query, route } = useLocation();
	const { drafts } = useGardenCreationWorkspace();
	const started = useRef(false);
	const [error, setError] = useState('');
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		let active = true;
		drafts.create({ preferredEditor: mode }).then((draft) => {
			if (!active) return;
			const path = `/gardens/new/${mode}/${draft.id}`;
			if (mode === 'wizard') {
				const templateSearch = templateSourceSearch(query);
				const preservedQuery = templateSearch
					? Object.fromEntries(new URLSearchParams(templateSearch.slice(1)))
					: {};
				route(createGardenWizardUrl(path, draft.currentStepId, preservedQuery), true);
			} else {
				route(`${path}${templateSourceSearch(query)}`, true);
			}
		}, (creationFailure) => {
			if (active) setError(creationError(creationFailure, 'started'));
		});
		return () => { active = false; };
	}, [drafts, mode, query, route]);
	return <GardenDraftLoadState state={error ? { status: 'error', message: error } : { status: 'loading' }} />;
}
