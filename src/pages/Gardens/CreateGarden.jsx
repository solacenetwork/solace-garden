import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import { GardenColorChoices, GardenIconChoices } from '../../components/GardenIdentityChoices.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { CURATED_GARDEN_ICONS, GARDEN_NUMBER_ICONS } from '../../gardenIdentity.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import {
	EMPTY_GARDEN_DRAFT_FIELDS,
	copyGardenDraftFields,
	createGardenDraftPersistence,
	createGardenDraftsService,
	gardenDraftFieldsEqual,
} from '../../services/gardenDrafts.js';
import { createGardensService } from '../../services/gardens.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import {
	createTemplateDispatcherUrl,
	resolveCreateGardenDispatch,
} from './creationNavigation.js';

export const QUICK_START_TYPE_IDS = Object.freeze(['in-ground']);

export function createQuickStartSubmitter({
	createGarden,
	navigate,
	onSaving = () => {},
	onFieldError = () => {},
	onSaveError = () => {},
}) {
	let submitting = false;

	return async function submit(input) {
		if (submitting) return null;

		onFieldError('', '');
		onSaveError('');

		submitting = true;
		onSaving(true);
		let garden;
		try {
			garden = await createGarden({
				...input,
				locationId: DEFAULT_LOCATION_ID,
				typeIds: [...QUICK_START_TYPE_IDS],
			});
		} catch (error) {
			if (['name', 'subtitle', 'icon', 'color', 'status'].includes(error?.field)) {
				const messages = {
					name: 'Enter a Garden name.',
					subtitle: 'Enter a valid subtitle.',
					icon: 'Choose a valid Garden icon.',
					color: 'Choose a valid Garden color.',
					status: 'Choose Planned or Active.',
				};
				onFieldError(error.field, messages[error.field]);
			} else {
				onSaveError('Your Garden could not be created. Your entries are still here, so you can try again.');
			}
			return null;
		} finally {
			submitting = false;
			onSaving(false);
		}

		navigate(`/gardens/${garden.id}`);
		return garden;
	};
}

const QUICK_START_INITIAL_VALUES = Object.freeze({
	name: '', subtitle: '', icon: null, color: null, status: 'planned',
});

const QUICK_START_DRAFT_FIELDS = Object.freeze({
	...EMPTY_GARDEN_DRAFT_FIELDS,
	typeIds: QUICK_START_TYPE_IDS,
});

const QUICK_START_STATUS_TEXT = Object.freeze({
	pristine: 'Draft starts after your first change',
	'all-saved': 'All changes saved',
	saving: 'Saving draft…',
	'draft-saved': 'Draft saved locally',
	error: 'Unable to save draft',
});

function quickStartValuesFromFields(fields) {
	return {
		name: fields.name,
		subtitle: fields.subtitle,
		icon: fields.icon,
		color: fields.color,
		status: fields.status,
	};
}

function quickStartFieldsFromValues(values) {
	return {
		...copyGardenDraftFields(QUICK_START_DRAFT_FIELDS),
		...values,
	};
}

export async function loadCreateGardenTemplates(templates) {
	try {
		const records = await templates.list();
		return {
			status: 'ready',
			items: [...records].sort((left, right) => (
				left.name.localeCompare(right.name)
				|| left.configuration.name.localeCompare(right.configuration.name)
				|| left.id.localeCompare(right.id)
			)),
		};
	} catch {
		return { status: 'error', items: [] };
	}
}

const creationMethods = [
	{
		id: 'quickstart',
		title: 'Quick Start',
		description: 'Create a Garden with the essentials.',
		icon: 'lightning-charge',
		action: 'Open Quick Start',
		href: '/gardens/new/quickstart',
	},
	{
		id: 'wizard',
		title: 'Guided Wizard',
		description: 'Create a Garden step by step.',
		icon: 'signpost-split',
		action: 'Start Guided Wizard',
		href: '/gardens/new/wizard',
	},
	{
		id: 'template',
		title: 'From Template',
		description: 'Start using a saved Garden configuration.',
		icon: 'copy',
	},
	{
		id: 'advanced',
		title: 'Advanced Form',
		description: 'Configure all Garden details on one page.',
		icon: 'sliders',
		action: 'Open Advanced Form',
		href: '/gardens/new/advanced',
	},
];

function MethodCard({ method, children = null }) {
	return (
		<article class="card garden-create-method" data-creation-method={method.id}>
			<div class="garden-create-method__icon" aria-hidden="true">
				<i class={`bi bi-${method.icon}`}></i>
			</div>
			<div class="card-body garden-create-method__body">
				<h2>{method.title}</h2>
				<p>{method.description}</p>
				{children ?? (
					<a class="btn-outline theme-primary garden-create-method__action" href={method.href}>
						{method.action}
					</a>
				)}
			</div>
		</article>
	);
}

export function TemplateMethodContents({ state, selectedId, onSelect, onRetry }) {
	if (state.status === 'loading') {
		return <p class="garden-create-method__state" role="status">Loading Templates…</p>;
	}
	if (state.status === 'error') {
		return (
			<div class="garden-create-method__state" role="alert">
				<p>Templates could not be loaded.</p>
				<button class="btn-outline" type="button" onClick={onRetry}>Retry</button>
			</div>
		);
	}
	if (state.items.length === 0) {
		return (
			<div class="garden-create-method__state garden-create-method__state--empty">
				<p>No saved Templates are available yet.</p>
				<a class="btn-text" href="/templates">Manage Templates</a>
			</div>
		);
	}

	const wizardUrl = createTemplateDispatcherUrl('wizard', selectedId);
	const advancedUrl = createTemplateDispatcherUrl('advanced', selectedId);
	return (
		<div class="garden-create-template">
			<label class="form-label" for="garden-create-template">Saved Template</label>
			<select
				class="form-control"
				id="garden-create-template"
				value={selectedId}
				onChange={(event) => onSelect(event.currentTarget.value)}
			>
				<option value="">Choose a Template</option>
				{state.items.map((template) => (
					<option value={template.id} key={template.id}>
						{template.name} — {template.configuration.name}
					</option>
				))}
			</select>
			<div class="garden-create-template__actions">
				<a
					class="btn-outline theme-primary"
					href={wizardUrl ?? undefined}
					aria-disabled={wizardUrl ? undefined : 'true'}
					tabIndex={wizardUrl ? undefined : -1}
				>
					Use with Wizard
				</a>
				<a
					class="btn-outline theme-primary"
					href={advancedUrl ?? undefined}
					aria-disabled={advancedUrl ? undefined : 'true'}
					tabIndex={advancedUrl ? undefined : -1}
				>
					Use with Advanced
				</a>
			</div>
		</div>
	);
}

export function CreateGardenLandingView({ templateState, selectedTemplateId, onSelectTemplate, onRetryTemplates }) {
	return (
		<section class="container gardens-page garden-create" aria-labelledby="create-garden-title">
			<GardenCreationBreadcrumb current="Create Garden" />
			<header class="gardens-header">
				<p class="garden-create__eyebrow">Create a Garden</p>
				<h1 id="create-garden-title">Choose how to begin</h1>
				<p>Select the creation method that fits how much detail you want to enter now.</p>
			</header>
			<div class="garden-create-methods">
				{creationMethods.map((method) => (
					<MethodCard method={method} key={method.id}>
						{method.id === 'template' ? (
							<TemplateMethodContents
								state={templateState}
								selectedId={selectedTemplateId}
								onSelect={onSelectTemplate}
								onRetry={onRetryTemplates}
							/>
						) : null}
					</MethodCard>
				))}
			</div>
		</section>
	);
}

export function CreateGardenLanding() {
	const { repositories } = useStorage();
	const templates = useMemo(
		() => createGardenTemplatesService(repositories.gardenTemplates),
		[repositories],
	);
	const [templateState, setTemplateState] = useState({ status: 'loading', items: [] });
	const [selectedTemplateId, setSelectedTemplateId] = useState('');
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		let active = true;
		setTemplateState({ status: 'loading', items: [] });
		void loadCreateGardenTemplates(templates).then((result) => {
			if (!active) return;
			setTemplateState(result);
			setSelectedTemplateId((current) => (
				result.items.some(({ id }) => id === current) ? current : ''
			));
		});
		return () => { active = false; };
	}, [templates, attempt]);

	return (
		<CreateGardenLandingView
			templateState={templateState}
			selectedTemplateId={selectedTemplateId}
			onSelectTemplate={setSelectedTemplateId}
			onRetryTemplates={() => setAttempt((value) => value + 1)}
		/>
	);
}

export function CreateGarden() {
	const { query, route } = useLocation();
	const dispatch = resolveCreateGardenDispatch(query);

	useEffect(() => {
		if (dispatch.status === 'redirect') route(dispatch.destination, true);
	}, [dispatch.destination, dispatch.status, route]);

	if (dispatch.status === 'landing') return <CreateGardenLanding />;
	if (dispatch.status === 'redirect') {
		return <p class="gardens-state" role="status">Opening Garden creation…</p>;
	}
	return (
		<section class="container gardens-page garden-create" aria-labelledby="create-garden-error-title">
			<GardenCreationBreadcrumb current="Create Garden" />
			<div class="gardens-state" role="alert">
				<h1 id="create-garden-error-title">Garden creation link not recognized</h1>
				<p>{dispatch.message}</p>
				<a class="btn-solid theme-primary" href="/gardens/new">Choose a creation method</a>
			</div>
		</section>
	);
}

export function QuickStartGardenView({
	values,
	errors = {},
	saveError = '',
	saving = false,
	draftStatus = null,
	onChange,
	onSubmit,
	onCancel,
	onDiscard,
}) {
	return (
		<section class="container gardens-page garden-quick-start" aria-labelledby="quick-start-garden-title">
			<GardenCreationBreadcrumb current="Quick Start" disabled={saving} onNavigate={onCancel} />
			<header class="gardens-header">
				<p class="garden-create__eyebrow">Quick Start</p>
				<h1 id="quick-start-garden-title">Create Garden</h1>
				<p>Set up the essentials now, then add growing details and plants later.</p>
				{draftStatus && <p class={`garden-draft-status garden-draft-status--${draftStatus}`} role="status">{QUICK_START_STATUS_TEXT[draftStatus]}</p>}
			</header>
			{onDiscard && <div class="garden-full-create__toolbar garden-full-create__toolbar--discard"><button class="btn-text theme-danger" type="button" disabled={saving} onClick={onDiscard}><i class="bi bi-trash3" aria-hidden="true"></i> Discard Draft</button></div>}

			<form class="garden-create__form" noValidate onSubmit={onSubmit}>
				<div class="form-field">
					<label class="form-label" for="garden-name">Garden Name</label>
					<input
						id="garden-name"
						name="name"
						class={`form-control${errors.name ? ' is-invalid' : ''}`}
						type="text"
						autoComplete="off"
						autoFocus
						required
						value={values.name}
						disabled={saving}
						aria-invalid={errors.name ? 'true' : undefined}
						aria-describedby={errors.name ? 'garden-name-error' : undefined}
						onInput={(event) => {
							event.currentTarget.setCustomValidity('');
							onChange('name', event.currentTarget.value);
						}}
					/>
					{errors.name && <div id="garden-name-error" class="invalid-feedback">{errors.name}</div>}
				</div>

				<div class="form-field">
					<label class="form-label" for="garden-subtitle">Subtitle <span class="garden-create__optional">(optional)</span></label>
					<input
						id="garden-subtitle"
						class={`form-control${errors.subtitle ? ' is-invalid' : ''}`}
						type="text"
						autoComplete="off"
						value={values.subtitle}
						disabled={saving}
						aria-invalid={errors.subtitle ? 'true' : undefined}
						aria-describedby={errors.subtitle ? 'garden-subtitle-error' : undefined}
						onInput={(event) => onChange('subtitle', event.currentTarget.value)}
					/>
					{errors.subtitle && <div id="garden-subtitle-error" class="invalid-feedback">{errors.subtitle}</div>}
				</div>

				<fieldset class="garden-create__identity-field">
					<legend>Icon <span class="garden-create__optional">(optional)</span></legend>
					<GardenIconChoices
						values={[...CURATED_GARDEN_ICONS, ...GARDEN_NUMBER_ICONS]}
						selected={values.icon}
						disabled={saving}
						onSelect={(value) => onChange('icon', value)}
					/>
					<button class="btn-text garden-create__clear-identity" type="button" disabled={saving || values.icon === null} onClick={() => onChange('icon', null)}>No icon</button>
					{errors.icon && <p class="garden-create__field-error" role="alert">{errors.icon}</p>}
				</fieldset>

				<fieldset class="garden-create__identity-field">
					<legend>Color <span class="garden-create__optional">(optional)</span></legend>
					<GardenColorChoices selected={values.color} disabled={saving} onSelect={(value) => onChange('color', value)} />
					<button class="btn-text garden-create__clear-identity" type="button" disabled={saving || values.color === null} onClick={() => onChange('color', null)}>No color</button>
					{errors.color && <p class="garden-create__field-error" role="alert">{errors.color}</p>}
				</fieldset>

				<div class="form-field">
					<label class="form-label" for="garden-thumbnail">Garden Image <span class="garden-create__optional">(optional)</span></label>
					<input id="garden-thumbnail" class="form-control" type="file" accept="image/*" disabled aria-describedby="garden-thumbnail-help" />
					<p id="garden-thumbnail-help" class="form-text">Garden image selection will be available after Gallery and media support is implemented.</p>
				</div>

				<fieldset class="garden-create__status">
					<legend>Status</legend>
					<label><input class="radio" type="radio" name="garden-status" value="planned" checked={values.status === 'planned'} disabled={saving} onChange={() => onChange('status', 'planned')} /> Planned</label>
					<label><input class="radio" type="radio" name="garden-status" value="active" checked={values.status === 'active'} disabled={saving} onChange={() => onChange('status', 'active')} /> Active</label>
					{errors.status && <p class="garden-create__field-error" role="alert">{errors.status}</p>}
				</fieldset>

				<p id="garden-quick-start-defaults" class="garden-create__defaults">
					Quick Start uses your protected Default Location and the In-Ground Garden Type.
				</p>

				{saveError && (
					<div class="garden-create__error" role="alert">
						<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
						<span>{saveError}</span>
					</div>
				)}

				<div class="garden-create__actions">
					<a
						class="btn-outline"
						href="/gardens/new"
						aria-disabled={saving ? 'true' : undefined}
						tabIndex={saving ? -1 : undefined}
						onClick={(event) => {
							if (saving) event.preventDefault();
							else if (onCancel) { event.preventDefault(); onCancel('/gardens/new'); }
						}}
					>
						Cancel
					</a>
					<button class="btn-solid theme-primary" type="submit" disabled={saving}>
						<i class="bi bi-plus-lg" aria-hidden="true"></i>
						{saving ? 'Creating…' : 'Create Garden'}
					</button>
				</div>
			</form>
		</section>
	);
}

export function revealInvalidField(field, {
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
	const top = Math.min(...rectangles.map((rectangle) => rectangle.top));
	const bottom = Math.max(...rectangles.map((rectangle) => rectangle.bottom));
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

export function QuickStartGarden({ params } = {}) {
	const { repositories } = useStorage();
	const { route } = useLocation();
	const drafts = useMemo(() => createGardenDraftsService(repositories.drafts), [repositories]);
	const [loadState, setLoadState] = useState(params?.draftId ? { status: 'loading' } : { status: 'ready', draft: null });

	useEffect(() => {
		if (!params?.draftId) {
			setLoadState((current) => current.status === 'ready' && current.draft === null
				? current
				: { status: 'ready', draft: null });
			return undefined;
		}
		let active = true;
		setLoadState({ status: 'loading' });
		void drafts.getById(params.draftId).then((draft) => {
			if (!active) return;
			setLoadState(draft && draft.preferredEditor === 'quickstart'
				? { status: 'ready', draft }
				: { status: 'error', message: 'This Quick Start draft is no longer available.' });
		}, () => active && setLoadState({ status: 'error', message: 'This Quick Start draft could not be opened.' }));
		return () => { active = false; };
	}, [drafts, params?.draftId]);

	if (loadState.status === 'loading') return <div class="container gardens-page"><p class="gardens-state" role="status">Loading Garden draft…</p></div>;
	if (loadState.status === 'error') return <div class="container gardens-page"><div class="gardens-state" role="alert"><h1>Garden draft could not be opened</h1><p>{loadState.message}</p><a class="btn-solid theme-primary" href="/gardens">Back to Gardens</a></div></div>;
	return <QuickStartGardenEditor key={loadState.draft?.id ?? 'pristine'} draft={loadState.draft} drafts={drafts} repositories={repositories} route={route} />;
}

export function QuickStartGardenEditor({ draft, drafts, repositories, route }) {
	const initialValues = draft ? quickStartValuesFromFields(draft.fields) : QUICK_START_INITIAL_VALUES;
	const [values, setValues] = useState(initialValues);
	const [errors, setErrors] = useState({});
	const [saveError, setSaveError] = useState('');
	const [saving, setSaving] = useState(false);
	const [draftStatus, setDraftStatus] = useState(draft ? 'draft-saved' : 'pristine');
	const [establishedId, setEstablishedId] = useState(draft?.id ?? null);
	const gardens = useMemo(
		() => createGardensService(repositories.gardens),
		[repositories],
	);
	const persistence = useMemo(() => createGardenDraftPersistence({
		drafts,
		initialDraft: draft,
		initialFields: draft?.fields ?? QUICK_START_DRAFT_FIELDS,
		preferredEditor: 'quickstart',
		currentStepId: null,
		onEstablished: (record) => setEstablishedId(record.id),
	}), [draft?.id, drafts]);
	const autosave = useMemo(() => createDraftAutosave({
		write: (nextValues) => persistence.persist(quickStartFieldsFromValues(nextValues), {
			preferredEditor: 'quickstart', currentStepId: null,
		}),
		onStatus: (status, error) => {
			setDraftStatus(status === 'draft-saved' && !persistence.getRecord() ? 'pristine' : status);
			if (error) setSaveError('Your draft could not be saved. Your entries are still here, so you can try again.');
		},
	}), [persistence]);
	const submit = useMemo(() => createQuickStartSubmitter({
		createGarden: async (input) => {
			await autosave.flush();
			const activeDraftId = persistence.getRecord()?.id;
			const created = activeDraftId
				? await gardens.createFromDraft(input, activeDraftId)
				: await gardens.create(input);
			await persistence.close();
			return created;
		},
		navigate: route,
		onSaving: setSaving,
		onFieldError: (field, message) => setErrors(field ? { [field]: message } : {}),
		onSaveError: setSaveError,
	}), [autosave, gardens, persistence, route]);

	useEffect(() => {
		const flushBeforeReload = () => { void autosave.flush(); };
		globalThis.addEventListener?.('beforeunload', flushBeforeReload);
		return () => {
			globalThis.removeEventListener?.('beforeunload', flushBeforeReload);
			void autosave.flush();
		};
	}, [autosave]);
	useEffect(() => {
		if (draft || !establishedId || draftStatus !== 'draft-saved') return;
		route(`/gardens/new/quickstart/${establishedId}`, true);
	}, [draft, draftStatus, establishedId, route]);

	useEffect(() => {
		if (!Object.values(errors).some(Boolean)) return;
		const firstInvalidField = globalThis.document?.querySelector?.(
			'.garden-create__form [aria-invalid="true"]',
		);
		revealInvalidField(firstInvalidField);
	}, [errors]);

	function updateField(field, value) {
		setValues((current) => {
			if (Object.is(current[field], value)) return current;
			const next = { ...current, [field]: value };
			autosave.schedule(next);
			return next;
		});
		setErrors((current) => ({ ...current, [field]: undefined }));
		setSaveError('');
	}

	async function leave(path) {
		if (saving) return;
		setSaving(true);
		await autosave.flush();
		const desiredFields = quickStartFieldsFromValues(values);
		const persisted = persistence.getRecord();
		const stillPristine = gardenDraftFieldsEqual(desiredFields, QUICK_START_DRAFT_FIELDS);
		if ((!persisted && !stillPristine) || (persisted && !gardenDraftFieldsEqual(persisted.fields, desiredFields))) {
			setSaveError('Your latest changes could not be saved. Try again before leaving Quick Start.');
			setSaving(false);
			return;
		}
		route(path);
	}

	async function discard() {
		if (!globalThis.confirm('Permanently discard this unfinished Garden draft?')) return;
		setSaving(true);
		await autosave.stop();
		try {
			await persistence.discard();
			route('/gardens', true);
		} catch {
			setSaveError('This Garden draft could not be discarded. Please try again.');
			setSaving(false);
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		const nameField = event.currentTarget.elements.namedItem('name');
		nameField.setCustomValidity(values.name.trim() ? '' : 'Enter a Garden name.');
		if (!event.currentTarget.checkValidity()) {
			setErrors({ name: nameField.validationMessage });
			return;
		}
		void submit(values);
	}

	return <QuickStartGardenView values={values} errors={errors} saveError={saveError} saving={saving} draftStatus={draftStatus} onChange={updateField} onSubmit={handleSubmit} onCancel={leave} onDiscard={establishedId ? discard : null} />;
}
