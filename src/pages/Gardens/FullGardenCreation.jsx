import Dialog from 'bootstrap/js/dist/dialog.js';
import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { WizardStepper } from '../../components/WizardStepper.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import {
	EMPTY_GARDEN_DRAFT_FIELDS,
	copyGardenDraftFields,
	createGardenDraftPersistence,
	createGardenDraftsService,
	gardenDraftFieldsFromTemplate,
	gardenInputFromDraftFields,
} from '../../services/gardenDrafts.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createGardensService } from '../../services/gardens.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createLocationsService, DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/errors.js';
import { revealInvalidField } from './CreateGarden.jsx';
import { SaveTemplateDialog, suggestedTemplateName } from './TemplateNameDialog.jsx';
import {
	GARDEN_FIELD_STEP_IDS, GardenAdvancedOptionsStep, GardenWizardDatesStep,
	GardenWizardDetailsStep, GardenWizardIdentityStep, GardenWizardTypesStep,
	gardenWizardStepRegistration, validateAdvancedOptions,
} from './gardenWizardSteps.jsx';
import { replaceGardenDraftUrl, templateSourceSearch } from './creationNavigation.js';
import {
	createGardenWizardUrl,
	loadGardenWizardSteps,
	navigateGardenWizardStep,
	requestedGardenWizardStep,
	resolveGardenWizardLocation,
} from './gardenWizardNavigation.js';
import { adjacentWizardStepId, findWizardStep } from '../../wizard/wizardNavigation.js';

const STATUS_TEXT = {
	pristine: 'Draft starts after your first change',
	'all-saved': 'All changes saved',
	saving: 'Saving draft…',
	'draft-saved': 'Draft saved locally',
	error: 'Unable to save draft',
};

const CREATION_ERROR_ID = 'garden-create-error';

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

export async function initializeGardenDraft({
	mode,
	templateId = null,
	drafts,
	templates,
}) {
	if (!templateId) {
		return drafts.create({ preferredEditor: mode });
	}

	const resolution = await templates.resolveConfiguration(templateId);
	if (!resolution) {
		throw new ValidationError(
			'TEMPLATE_NOT_FOUND',
			'That Template is no longer available. Choose another Template or start from scratch.',
			{ field: 'templateId' },
		);
	}

	return drafts.create({
		preferredEditor: mode,
		initialFields: gardenDraftFieldsFromTemplate(resolution.configuration),
		sourceTemplateId: templateId,
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

export function revealGardenCreationFeedback(field, {
	documentObject = globalThis.document,
	viewport = globalThis,
} = {}) {
	const suffixes = { locationId: 'location', startDate: 'start-date', endDate: 'end-date' };
	const fieldElement = field
		? documentObject?.getElementById?.(`create-garden-${suffixes[field] ?? field}`)
		: null;
	const feedbackElement = fieldElement ?? documentObject?.getElementById?.(CREATION_ERROR_ID);
	return revealInvalidField(feedbackElement, { documentObject, viewport });
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

export function GardenFinalizationTemplateDialog({ open, gardenName, busy, error, onCancel, onConfirm }) {
	const dialogElement = useRef(null);
	const inputElement = useRef(null);
	const dialogInstance = useRef(null);
	const busyRef = useRef(busy);
	const openRef = useRef(open);
	const [name, setName] = useState(() => suggestedTemplateName(gardenName));
	const [nameError, setNameError] = useState('');
	busyRef.current = busy;
	openRef.current = open;

	useEffect(() => {
		const element = dialogElement.current;
		if (!element) return undefined;
		const instance = new Dialog(element);
		const focusInput = () => { inputElement.current?.focus(); inputElement.current?.select(); };
		const preventBusyHide = (event) => { if (busyRef.current) event.preventDefault(); };
		dialogInstance.current = instance;
		element.addEventListener('shown.bs.dialog', focusInput);
		element.addEventListener('hide.bs.dialog', preventBusyHide);
		if (openRef.current) void instance.show();
		return () => {
			element.removeEventListener('shown.bs.dialog', focusInput);
			element.removeEventListener('hide.bs.dialog', preventBusyHide);
			instance.dispose();
			dialogInstance.current = null;
		};
	}, []);

	useEffect(() => {
		if (!open) return;
		setName(suggestedTemplateName(gardenName));
		setNameError('');
		void dialogInstance.current?.show();
	}, [open, gardenName]);

	function cancel() {
		if (busyRef.current) return;
		void dialogInstance.current?.hide();
		onCancel();
	}

	function submit(event) {
		event.preventDefault();
		if (!name.trim()) {
			setNameError('Enter a Template name.');
			inputElement.current?.focus();
			return;
		}
		onConfirm(name);
	}

	return (
		<SaveTemplateDialog
			dialogRef={dialogElement}
			inputRef={inputElement}
			garden={{ name: gardenName }}
			name={name}
			onNameChange={(value) => { setName(value); setNameError(''); }}
			nameError={nameError}
			saveError={error}
			busy={busy}
			onCancel={cancel}
			onSubmit={submit}
			submitLabel="Finish & Create Garden"
			description={<>Name the reusable Template snapshot that will be created with <strong>{gardenName}</strong>.</>}
		/>
	);
}

export function GardenDraftEditor({ draft, references, mode, workspace, wizardSteps }) {
	const { path, query = {}, route } = useLocation();
	const resolvedWizardSteps = gardenWizardStepRegistration(wizardSteps ?? loadGardenWizardSteps());
	const submitting = useRef(false);
	const fieldsRef = useRef(draft.fields);
	const initializedFields = useRef(copyGardenDraftFields(draft.fields));
	const sourceTemplateIdRef = useRef(draft.sourceTemplateId);
	const currentStepIdRef = useRef(draft.currentStepId);
	const pendingFocusField = useRef(undefined);
	// The route is the authoritative editor selection. Async route state may still
	// carry the previous draft snapshot during an editor-mode change.
	const preferredEditorRef = useRef(mode);
	const templateLocationOrigin = useRef(null);
	const [fields, setFields] = useState(draft.fields);
	const [currentReferences, setCurrentReferences] = useState(references);
	const [status, setStatus] = useState(draft.id ? 'draft-saved' : 'pristine');
	const [errors, setErrors] = useState({});
	const [message, setMessage] = useState('');
	const [autosaveError, setAutosaveError] = useState('');
	const [busy, setBusy] = useState(false);
	const [templateNotice, setTemplateNotice] = useState('');
	const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
	const [templateDialogError, setTemplateDialogError] = useState('');
	const [establishedId, setEstablishedId] = useState(draft.id ?? null);
	const [feedbackRequest, setFeedbackRequest] = useState(0);
	const wizardPath = establishedId
		? `/gardens/new/wizard/${establishedId}`
		: path ?? '/gardens/new/wizard';
	const stepResolution = mode === 'wizard'
		? resolveGardenWizardLocation({
			steps: resolvedWizardSteps,
			query,
			persistedStepId: currentStepIdRef.current,
		})
		: null;
	const activeStepId = stepResolution?.status === 'resolved' ? stepResolution.stepId : null;
	const activeStep = activeStepId ? findWizardStep(resolvedWizardSteps, activeStepId) : null;
	const ActiveStepForm = activeStep?.Component;
	useEffect(() => {
		if (!feedbackRequest || busy) return;
		const field = pendingFocusField.current;
		if (field === undefined) return;
		if (field && mode === 'wizard' && GARDEN_FIELD_STEP_IDS[field] !== activeStepId) return;
		pendingFocusField.current = undefined;
		revealGardenCreationFeedback(field);
	}, [activeStepId, busy, feedbackRequest, mode]);

	const persistence = useMemo(() => createGardenDraftPersistence({
		drafts: workspace.drafts,
		initialDraft: draft.id ? draft : null,
		initialFields: initializedFields.current,
		preferredEditor: mode,
		sourceTemplateId: draft.sourceTemplateId,
		currentStepId: draft.currentStepId,
		onEstablished: (record) => setEstablishedId(record.id),
	}), [draft.id, workspace.drafts]);

	const autosave = useMemo(() => createDraftAutosave({
		write: async (value) => {
			await persistence.persist(value, {
				sourceTemplateId: sourceTemplateIdRef.current,
				preferredEditor: preferredEditorRef.current,
				currentStepId: preferredEditorRef.current === 'wizard' ? currentStepIdRef.current : null,
			});
		},
		onStatus: (nextStatus, error) => {
			setStatus(nextStatus === 'draft-saved' && !persistence.getRecord() ? 'pristine' : nextStatus);
			if (error) setAutosaveError(creationError(error, 'saved'));
			else if (nextStatus === 'draft-saved' || nextStatus === 'all-saved') setAutosaveError('');
		},
	}), [persistence]);

	useEffect(() => {
		const flushBeforeReload = () => { void autosave.flush(); };
		globalThis.addEventListener?.('beforeunload', flushBeforeReload);
		return () => {
			globalThis.removeEventListener?.('beforeunload', flushBeforeReload);
			void autosave.flush();
		};
	}, [autosave]);

	useEffect(() => {
		if (draft.id || !establishedId || status !== 'draft-saved') return;
		const editorPath = `/gardens/new/${mode}/${establishedId}`;
		const destination = mode === 'wizard'
			? createGardenWizardUrl(editorPath, currentStepIdRef.current, query)
			: editorPath;
		replaceGardenDraftUrl(destination);
	}, [draft.id, establishedId, mode, query, status]);

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

	useEffect(() => {
		const sourceTemplateId = sourceTemplateIdRef.current;
		if (!sourceTemplateId) return undefined;
		let active = true;
		void workspace.templates.getById(sourceTemplateId).then((source) => {
			if (!active) return;
			templateLocationOrigin.current = templateLocationOriginForDraft({
				fields: fieldsRef.current,
				sourceTemplateId,
			}, source ? [source] : []);
			if (!source) {
				setTemplateNotice('The source Template is no longer available. Your independent draft and edits are preserved.');
			} else if (
				source.configuration.locationId !== fieldsRef.current.locationId
				&& fieldsRef.current.locationId === DEFAULT_LOCATION_ID
				&& !currentReferences.locations.some(({ id }) => id === source.configuration.locationId)
			) {
				setTemplateNotice('The Template’s saved Location is no longer available, so Default Location was selected.');
			}
		}, (error) => {
			if (active) setMessage(creationError(error, 'opened'));
		});
		return () => { active = false; };
	}, [workspace.templates]);

	function changeField(field, value) {
		if (field === 'locationId') {
			templateLocationOrigin.current = null;
		}
		setFields((current) => {
			const unchanged = field === 'typeIds'
				? current.typeIds.length === value.length && current.typeIds.every((id, index) => id === value[index])
				: Object.is(current[field], value);
			if (unchanged) return current;
			const next = { ...current, [field]: value };
			fieldsRef.current = next;
			autosave.schedule(next);
			return next;
		});
		setErrors((current) => ({ ...current, [field]: undefined }));
		setMessage('');
		setAutosaveError('');
	}

	async function persistCurrent({
		sourceTemplateId = sourceTemplateIdRef.current,
		preferredEditor = preferredEditorRef.current,
		currentStepId = preferredEditor === 'wizard' ? currentStepIdRef.current : null,
	} = {}) {
		await autosave.stop();
		const saved = await persistence.persist(fieldsRef.current, {
			sourceTemplateId,
			preferredEditor,
			currentStepId,
		});
		if (!saved) return null;
		sourceTemplateIdRef.current = saved.sourceTemplateId;
		preferredEditorRef.current = saved.preferredEditor;
		currentStepIdRef.current = saved.currentStepId;
		setStatus('draft-saved');
		setAutosaveError('');
		return saved;
	}

	async function persistTemplateLocationFallback(locationResult) {
		const saved = await persistence.persist(locationResult.fields, {
			sourceTemplateId: sourceTemplateIdRef.current,
			preferredEditor: preferredEditorRef.current,
			currentStepId: preferredEditorRef.current === 'wizard' ? currentStepIdRef.current : null,
		});
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
			const savedDraftId = persistence.getRecord()?.id;
			const currentPath = savedDraftId && path.startsWith('/gardens/new/')
				? `/gardens/new/${preferredEditor}/${savedDraftId}`
				: path;
			const destination = preferredEditor === 'wizard' && currentPath.includes('/wizard/')
				? createGardenWizardUrl(currentPath, nextStepId, query)
				: currentPath;
			route(destination);
		} catch (error) {
			setStatus('error');
			setMessage(creationError(error, 'saved'));
			setBusy(false);
		}
	}

	async function navigateToWizardStep(stepId, { replace = false, allowBusy = false } = {}) {
		if ((!allowBusy && busy) || !findWizardStep(resolvedWizardSteps, stepId)) return;
		setBusy(true);
		setMessage('');
		try {
			await persistCurrent({ currentStepId: stepId });
			const savedDraftId = persistence.getRecord()?.id;
			navigateGardenWizardStep({
				route,
				path: savedDraftId ? `/gardens/new/wizard/${savedDraftId}` : wizardPath,
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

	function focusWizardField(field) {
		const suffixes = { locationId: 'location', startDate: 'start-date', endDate: 'end-date' };
		const element = globalThis.document?.getElementById?.(`create-garden-${suffixes[field] ?? field}`);
		element?.focus?.();
	}

	function validateActiveStep() {
		const result = activeStep.validate(fieldsRef.current, currentReferences);
		setErrors(result.errors);
		if (!result.valid) {
			const field = Object.keys(result.errors)[0];
			setMessage(result.errors[field]);
			focusWizardField(field);
			return false;
		}
		const stage = globalThis.document?.querySelector?.('.garden-wizard__stage');
		const invalid = stage?.querySelector?.(':invalid');
		if (invalid) {
			invalid?.reportValidity?.();
			invalid?.focus?.();
			return false;
		}
		return true;
	}

	async function continueWizard() {
		if (!validateActiveStep()) return;
		await navigateToWizardStep(nextStepId);
	}

	async function discard() {
		if (!globalThis.confirm('Permanently discard this unfinished Garden draft?')) return;
		setBusy(true);
		setMessage('');
		await autosave.stop();
		try {
			await persistence.discard();
			route('/gardens', true);
		} catch (error) {
			setMessage(creationError(error, 'discarded'));
			setStatus('error');
			setBusy(false);
		}
	}

	async function completeInputValidation() {
		await persistCurrent();
		const [locations, types] = await Promise.all([
			workspace.locations.list(), workspace.types.list(),
		]);
		const freshReferences = { locations, types };
		setCurrentReferences(freshReferences);
		const locationResult = resolveTemplateLocationForFinalization(
			fieldsRef.current, locations, templateLocationOrigin.current,
		);
		if (locationResult.locationUnavailable) {
			throw new ValidationError('LOCATION_NOT_FOUND', 'Select an available Location.', { field: 'locationId' });
		}
		if (locationResult.fallbackOccurred) {
			await persistTemplateLocationFallback(locationResult);
			throw new ValidationError('LOCATION_FALLBACK_REVIEW', 'Default Location was selected. Review it before creating this Garden.', { field: 'locationId' });
		}
		if (mode === 'advanced') {
			const options = validateAdvancedOptions(fieldsRef.current);
			if (!options.valid) {
				const field = Object.keys(options.errors)[0];
				throw new ValidationError('INVALID_GARDEN_LIFECYCLE', options.errors[field], { field });
			}
		}
		const creation = mode === 'advanced' ? workspace.gardens.advanced : workspace.gardens;
		return validateGardenDraftForReview(fieldsRef.current, freshReferences, creation);
	}

	async function showFinalValidationError(error) {
		const field = error?.field;
		pendingFocusField.current = field ?? null;
		setErrors(field ? { [field]: error.message } : {});
		setMessage(error instanceof ValidationError ? error.message : creationError(error, 'created'));
		const stepId = mode === 'wizard' ? GARDEN_FIELD_STEP_IDS[field] : null;
		if (stepId && stepId !== activeStepId) {
			await navigateToWizardStep(stepId, { allowBusy: true });
			setMessage(`Review ${findWizardStep(resolvedWizardSteps, stepId).title}: ${error.message}`);
		}
		setFeedbackRequest((current) => current + 1);
	}

	async function finalizeGarden(templateName = null) {
		if (submitting.current) return null;
		submitting.current = true;
		setBusy(true);
		setMessage('');
		setTemplateDialogError('');
		try {
			const input = await completeInputValidation();
			const activeDraftId = persistence.getRecord()?.id;
			setErrors({});
			const creation = mode === 'advanced' ? workspace.gardens.advanced : workspace.gardens;
			let result;
			try {
				result = activeDraftId
					? templateName === null
						? await creation.createFromDraft(input, activeDraftId)
						: await creation.createFromDraftWithTemplate(input, activeDraftId, templateName)
					: await creation.create(input);
			} catch (error) {
				if (error?.code !== 'LOCATION_NOT_FOUND' || !templateLocationOrigin.current) throw error;
				const latestLocations = await workspace.locations.list();
				setCurrentReferences((current) => ({ ...current, locations: latestLocations }));
				const raceResult = resolveTemplateLocationForFinalization(
					fieldsRef.current, latestLocations, templateLocationOrigin.current,
				);
				if (!raceResult.fallbackOccurred) throw error;
				await persistTemplateLocationFallback(raceResult);
				throw new ValidationError(
					'LOCATION_FALLBACK_REVIEW',
					'Default Location was selected. Review it before creating this Garden.',
					{ field: 'locationId' },
				);
			}
			const garden = result.garden ?? result;
			await persistence.close();
			route(`/gardens/${garden.id}`);
			return garden;
		} catch (error) {
			if (templateName !== null && !(error instanceof ValidationError && GARDEN_FIELD_STEP_IDS[error.field])) {
				setTemplateDialogError(error instanceof ValidationError
					? error.message
					: 'Your Garden and Template could not be created. Your draft remains available, so you can try again.');
			} else {
				await showFinalValidationError(error);
			}
			return null;
		} finally {
			setBusy(false);
			submitting.current = false;
		}
	}

	async function createGarden(event) {
		event?.preventDefault();
		if (submitting.current) return;
		if (fieldsRef.current.saveAsTemplate) {
			submitting.current = true;
			setBusy(true);
			try {
				await completeInputValidation();
				setErrors({});
				setTemplateDialogError('');
				setTemplateDialogOpen(true);
			} catch (error) {
				await showFinalValidationError(error);
			} finally {
				setBusy(false);
				submitting.current = false;
			}
			return;
		}
		await finalizeGarden();
	}

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
	return (
		<section class="workspace-page gardens-page garden-full-create" aria-labelledby="full-create-title">
			<PageHeader
				breadcrumbs={(
					<GardenCreationBreadcrumb
						current={mode === 'wizard' ? 'Guided Wizard' : 'Advanced Form'}
						disabled={busy}
						onNavigate={(path) => navigatePreservingDraft(path)}
					/>
				)}
				eyebrow={establishedId ? 'Recoverable draft' : 'New Garden'}
				title={title}
				titleId="full-create-title"
				description={establishedId ? 'Your progress is saved locally until you create or discard this Garden.' : 'Your progress will be saved locally after your first change.'}
				status={<p class={`garden-draft-status garden-draft-status--${status}`} role="status">{STATUS_TEXT[status]}</p>}
			/>
			<div class="page-content">
			{(message || autosaveError) && <div id={CREATION_ERROR_ID} class="garden-create__error" role="alert" tabIndex={-1}><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{message || autosaveError}</span></div>}
			{templateNotice && <div class="garden-template-notice" role="status"><i class="bi bi-info-circle" aria-hidden="true"></i><span>{templateNotice}</span></div>}
			<div
				class={`garden-full-create__toolbar garden-full-create__toolbar--discard${establishedId ? '' : ' garden-full-create__toolbar--pending'}`}
				aria-hidden={establishedId ? undefined : 'true'}
			>
				<button class="btn-text theme-danger" type="button" disabled={busy || !establishedId} tabIndex={establishedId ? undefined : -1} onClick={discard}><i class="bi bi-trash3" aria-hidden="true"></i> Discard Draft</button>
			</div>

			<form class="garden-full-create__form" noValidate onSubmit={createGarden}>
				{mode === 'wizard' ? <>
					<WizardStepper steps={resolvedWizardSteps} activeStepId={activeStepId} label="Garden creation progress" />
					<section class="garden-wizard__stage" aria-labelledby="wizard-stage-title">
						<h2 id="wizard-stage-title">{activeStep.title}</h2>
						<ActiveStepForm fields={fields} errors={errors} locations={currentReferences.locations} types={currentReferences.types} onChange={changeField} disabled={busy} idPrefix="create-garden" />
					</section>
					<div class="garden-full-create__actions">
						<button class="btn-outline" type="button" disabled={busy} onClick={() => previousStepId ? navigateToWizardStep(previousStepId) : navigatePreservingDraft('/gardens')}>{previousStepId ? 'Back' : 'Back to Gardens'}</button>
						{nextStepId
							? <button class="btn-solid theme-primary" type="button" disabled={busy} onClick={continueWizard}>Continue</button>
							: <button class="btn-solid theme-primary" type="submit" disabled={busy}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Finish & Create Garden'}</button>}
					</div>
				</> : <>
					<section class="garden-advanced__section" aria-labelledby="advanced-identity-title"><h2 id="advanced-identity-title">Identity</h2><GardenWizardIdentityStep fields={fields} errors={errors} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
					<section class="garden-advanced__section" aria-labelledby="advanced-details-title"><h2 id="advanced-details-title">Details</h2><GardenWizardDetailsStep fields={fields} errors={errors} locations={currentReferences.locations} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
					<section class="garden-advanced__section" aria-labelledby="advanced-types-title"><h2 id="advanced-types-title">Garden Type</h2><GardenWizardTypesStep fields={fields} errors={errors} types={currentReferences.types} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
					<section class="garden-advanced__section" aria-labelledby="advanced-dates-title"><h2 id="advanced-dates-title">Dates</h2><GardenWizardDatesStep fields={fields} errors={errors} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
					<section class="garden-advanced__section" aria-labelledby="advanced-options-title"><h2 id="advanced-options-title">Additional Options</h2><GardenAdvancedOptionsStep fields={fields} errors={errors} onChange={changeField} disabled={busy} idPrefix="create-garden" /></section>
					<div class="garden-full-create__actions"><button class="btn-outline" type="button" disabled={busy} onClick={() => navigatePreservingDraft('/gardens')}>Back to Gardens</button><button class="btn-solid theme-primary" type="submit" disabled={busy}><i class="bi bi-check2" aria-hidden="true"></i>{busy ? 'Creating…' : 'Create Garden'}</button></div>
				</>}
			</form>
			<GardenFinalizationTemplateDialog
				open={templateDialogOpen}
				gardenName={fields.name}
				busy={busy}
				error={templateDialogError}
				onCancel={() => setTemplateDialogOpen(false)}
				onConfirm={(name) => { void finalizeGarden(name); }}
			/>
			</div>
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
		wizardSteps = gardenWizardStepRegistration(loadGardenWizardSteps(wizardDefinition));
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
	const workspace = useGardenCreationWorkspace();
	const { drafts, templates } = workspace;
	const started = useRef(false);
	const [state, setState] = useState({ status: 'loading' });
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		let active = true;
		const templateId = templateSourceSearch(query) ? query.id : null;
		const load = templateId
			? initializeGardenDraft({ mode, templateId, drafts, templates }).then((draft) => ({ draft }))
			: Promise.all([workspace.locations.list(), workspace.types.list()]).then(([locations, types]) => ({
				draft: {
					id: null,
					fields: copyGardenDraftFields(EMPTY_GARDEN_DRAFT_FIELDS),
					sourceTemplateId: null,
					preferredEditor: mode,
					currentStepId: mode === 'wizard' ? 'identity' : null,
					createdAt: null,
				},
				references: { locations, types },
			}));
		load.then(({ draft, references }) => {
			if (!active) return;
			if (templateId) {
				const path = `/gardens/new/${mode}/${draft.id}`;
				route(mode === 'wizard' ? createGardenWizardUrl(path, draft.currentStepId) : path, true);
				return;
			}
			setState({ status: 'ready', draft, references });
		}, (creationFailure) => {
			if (active) setState({ status: 'error', message: creationError(creationFailure, 'started') });
		});
		return () => { active = false; };
	}, [drafts, mode, query, route, templates, workspace]);
	if (state.status !== 'ready') return <GardenDraftLoadState state={state} />;
	return <GardenDraftEditor draft={state.draft} references={state.references} mode={mode} workspace={workspace} />;
}
