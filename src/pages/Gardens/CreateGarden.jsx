import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { GardenCreationBreadcrumb } from '../../components/GardenCreationBreadcrumb.jsx';
import { GardenColorChoices, GardenIconChoices } from '../../components/GardenIdentityChoices.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { CURATED_GARDEN_ICONS, GARDEN_NUMBER_ICONS } from '../../gardenIdentity.js';
import { createGardenTemplatesService } from '../../services/gardenTemplates.js';
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
	onChange,
	onSubmit,
}) {
	return (
		<section class="container gardens-page garden-quick-start" aria-labelledby="quick-start-garden-title">
			<GardenCreationBreadcrumb current="Quick Start" disabled={saving} />
			<header class="gardens-header">
				<p class="garden-create__eyebrow">Quick Start</p>
				<h1 id="quick-start-garden-title">Create Garden</h1>
				<p>Set up the essentials now, then add growing details and plants later.</p>
			</header>

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
						onClick={(event) => { if (saving) event.preventDefault(); }}
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

export function QuickStartGarden() {
	const { repositories } = useStorage();
	const { route } = useLocation();
	const [values, setValues] = useState(QUICK_START_INITIAL_VALUES);
	const [errors, setErrors] = useState({});
	const [saveError, setSaveError] = useState('');
	const [saving, setSaving] = useState(false);
	const gardens = useMemo(
		() => createGardensService(repositories.gardens),
		[repositories],
	);
	const submit = useMemo(() => createQuickStartSubmitter({
		createGarden: (input) => gardens.create(input),
		navigate: route,
		onSaving: setSaving,
		onFieldError: (field, message) => setErrors(field ? { [field]: message } : {}),
		onSaveError: setSaveError,
	}), [gardens, route]);

	useEffect(() => {
		if (!Object.values(errors).some(Boolean)) return;
		const firstInvalidField = globalThis.document?.querySelector?.(
			'.garden-create__form [aria-invalid="true"]',
		);
		revealInvalidField(firstInvalidField);
	}, [errors]);

	function updateField(field, value) {
		setValues((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
		setSaveError('');
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

	return <QuickStartGardenView values={values} errors={errors} saveError={saveError} saving={saving} onChange={updateField} onSubmit={handleSubmit} />;
}
