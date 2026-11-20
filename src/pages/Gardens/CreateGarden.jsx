import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { useStorage } from '../../context/StorageContext.jsx';
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
	onNameError = () => {},
	onSaveError = () => {},
}) {
	let submitting = false;

	return async function submit(name) {
		if (submitting) return null;

		onNameError('');
		onSaveError('');

		submitting = true;
		onSaving(true);
		let garden;
		try {
			garden = await createGarden({
				name,
				locationId: DEFAULT_LOCATION_ID,
				typeIds: [...QUICK_START_TYPE_IDS],
			});
		} catch (error) {
			if (error?.field === 'name') {
				onNameError('Enter a Garden name.');
			} else {
				onSaveError('Your Garden could not be created. Your name is still here, so you can try again.');
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
	},
	{
		id: 'wizard',
		title: 'Guided Wizard',
		description: 'Create a Garden step by step.',
		icon: 'signpost-split',
		action: 'Start Guided Wizard',
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
					<a class="btn-outline theme-primary garden-create-method__action" href={`/gardens/new?type=${method.id}`}>
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
			<a class="btn-outline gardens-back" href="/gardens">
				<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to Gardens
			</a>
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
			<div class="gardens-state" role="alert">
				<h1 id="create-garden-error-title">Garden creation link not recognized</h1>
				<p>{dispatch.message}</p>
				<a class="btn-solid theme-primary" href="/gardens/new">Choose a creation method</a>
			</div>
		</section>
	);
}

export function QuickStartGarden() {
	const { repositories } = useStorage();
	const { route } = useLocation();
	const [name, setName] = useState('');
	const [nameError, setNameError] = useState('');
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
		onNameError: setNameError,
		onSaveError: setSaveError,
	}), [gardens, route]);

	function updateName(event) {
		setName(event.currentTarget.value);
		if (nameError) setNameError('');
		if (saveError) setSaveError('');
	}

	function handleSubmit(event) {
		event.preventDefault();
		void submit(name);
	}

	function blockNavigationWhileSaving(event) {
		if (saving) event.preventDefault();
	}

	return (
		<section class="container gardens-page garden-quick-start" aria-labelledby="quick-start-garden-title">
			<a
				class="btn-outline gardens-back"
				href="/gardens"
				aria-disabled={saving ? 'true' : undefined}
				tabIndex={saving ? -1 : undefined}
				onClick={blockNavigationWhileSaving}
			>
				<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to Gardens
			</a>
			<header class="gardens-header">
				<p class="garden-create__eyebrow">Quick Start</p>
				<h1 id="quick-start-garden-title">Create Garden</h1>
				<p>Name your Garden now, then add details and plants later.</p>
			</header>

			<form class="garden-create__form" noValidate onSubmit={handleSubmit}>
				<div class="form-field">
					<label class="form-label" for="garden-name">Garden name</label>
					<input
						id="garden-name"
						class={`form-control${nameError ? ' is-invalid' : ''}`}
						type="text"
						autoComplete="off"
						autoFocus
						required
						value={name}
						disabled={saving}
						aria-invalid={nameError ? 'true' : undefined}
						aria-describedby={nameError ? 'garden-name-error' : 'garden-quick-start-defaults'}
						onInput={updateName}
					/>
					{nameError && <div id="garden-name-error" class="invalid-feedback">{nameError}</div>}
				</div>

				<p id="garden-quick-start-defaults" class="garden-create__defaults">
					Quick Start uses your protected default Location, the In-Ground Garden Type,
					and Planned status.
				</p>
				<div class="garden-create__full-options">
					<p>Want to choose more details before creating?</p>
					<div><a class="btn-outline" href="/gardens/new/wizard">Guided Wizard</a><a class="btn-text" href="/gardens/new/advanced">Advanced Form</a></div>
				</div>

				{saveError && (
					<div class="garden-create__error" role="alert">
						<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
						<span>{saveError}</span>
					</div>
				)}

				<div class="garden-create__actions">
					<a
						class="btn-outline"
						href="/gardens"
						aria-disabled={saving ? 'true' : undefined}
						tabIndex={saving ? -1 : undefined}
						onClick={blockNavigationWhileSaving}
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
