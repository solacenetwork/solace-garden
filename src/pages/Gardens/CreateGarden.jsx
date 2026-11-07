import { useMemo, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { useStorage } from '../../context/StorageContext.jsx';
import { createGardensService } from '../../services/gardens.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';

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

export function CreateGarden() {
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
		<section class="container gardens-page garden-create" aria-labelledby="create-garden-title">
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
				<h1 id="create-garden-title">Create Garden</h1>
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
