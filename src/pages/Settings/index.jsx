import { useLocation } from 'preact-iso';
import { useInterfaceMode } from '../../context/InterfaceModeContext.jsx';
import { getSettingsReturnPath } from '../../navigation.js';
import './style.css';

const modeOptions = [
	{
		value: 'auto',
		label: 'Automatic',
		description: 'Use Simple Mode on narrow screens and Standard Mode on wider screens.',
	},
	{
		value: 'simple',
		label: 'Simple',
		description: 'Keep the focused, touch-friendly Simple Mode at every screen size.',
	},
	{
		value: 'standard',
		label: 'Standard',
		description: 'Keep the desktop-oriented Standard Mode at every screen size.',
	},
];

export function Settings() {
	const { query } = useLocation();
	const returnPath = getSettingsReturnPath(query.ref);
	const {
		preference,
		effectiveMode,
		storageAvailable,
		setPreference,
	} = useInterfaceMode();

	return (
		<section class="container settings-page" aria-labelledby="settings-title">
			<header class="settings-page__header">
				<div class="settings-page__title-row">
					<div>
						<p class="settings-page__eyebrow">Application preferences</p>
						<h1 id="settings-title">Settings</h1>
					</div>
					<a class="settings-close" href={returnPath}>
						<i class="bi bi-x-lg" aria-hidden="true"></i>
						<span>Close</span>
					</a>
				</div>
				<p>Choose how SOLACE Garden presents its workspace.</p>
			</header>

			<fieldset class="settings-card" aria-describedby="interface-mode-help">
				<legend>Interface mode</legend>
				<p id="interface-mode-help" class="settings-card__help">
					Automatic chooses Simple Mode on smaller screens and Standard Mode on
					larger screens.
				</p>

				<div class="settings-mode-options">
					{modeOptions.map((option) => (
						<div class="form-field form-field-card settings-mode-option" key={option.value}>
							<input
								class="radio radio-lg"
								type="radio"
								name="interface-mode"
								id={`interface-mode-${option.value}`}
								value={option.value}
								checked={preference === option.value}
								onChange={(event) => setPreference(event.currentTarget.value)}
							/>
							<label for={`interface-mode-${option.value}`}>
								<span class="settings-mode-option__label">{option.label}</span>
								<span class="settings-mode-option__description">{option.description}</span>
							</label>
						</div>
					))}
				</div>

				<p class="settings-mode-status" aria-live="polite">
					<span>Currently showing </span>
					<strong>{effectiveMode === 'simple' ? 'Simple Mode' : 'Standard Mode'}</strong>
					{preference === 'auto' && (
						<span> based on your screen size.</span>
					)}
				</p>

				{!storageAvailable && (
					<p class="settings-storage-warning" role="status">
						<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
						Your choice is active for this visit, but this browser did not allow it
						to be saved.
					</p>
				)}
			</fieldset>
		</section>
	);
}
