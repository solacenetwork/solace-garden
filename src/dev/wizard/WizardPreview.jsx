import { useMemo, useState } from 'preact/hooks';
import { normalizeWizardSteps, WizardStepper } from '../../components/WizardStepper.jsx';
import additionalFixture from './fixtures/additional.json';
import defaultFixture from './fixtures/default.json';
import longLabelsFixture from './fixtures/long-labels.json';
import reorderedFixture from './fixtures/reordered.json';
import './style.css';

export const wizardPreviewConfigurations = [
	defaultFixture,
	additionalFixture,
	longLabelsFixture,
	reorderedFixture,
];

export function adjacentStepId(steps, activeStepId, direction) {
	const normalizedSteps = normalizeWizardSteps(steps);
	const activeIndex = normalizedSteps.findIndex(({ id }) => id === activeStepId);
	const nextIndex = Math.min(
		normalizedSteps.length - 1,
		Math.max(0, activeIndex + direction),
	);
	return normalizedSteps[nextIndex]?.id ?? null;
}

export function WizardPreview() {
	const [configurationId, setConfigurationId] = useState(defaultFixture.id);
	const configuration = wizardPreviewConfigurations.find(({ id }) => id === configurationId)
		?? defaultFixture;
	const steps = useMemo(() => normalizeWizardSteps(configuration.steps), [configuration]);
	const [activeStepId, setActiveStepId] = useState(steps[0]?.id ?? null);
	const activeIndex = steps.findIndex(({ id }) => id === activeStepId);
	const activeStep = steps[activeIndex];

	function changeConfiguration(event) {
		const nextConfiguration = wizardPreviewConfigurations.find(
			({ id }) => id === event.currentTarget.value,
		) ?? defaultFixture;
		const nextSteps = normalizeWizardSteps(nextConfiguration.steps);
		setConfigurationId(nextConfiguration.id);
		setActiveStepId(nextSteps[0]?.id ?? null);
	}

	function move(direction) {
		setActiveStepId(adjacentStepId(steps, activeStepId, direction));
	}

	return (
		<main class="wizard-preview">
			<header class="wizard-preview__intro">
				<p class="wizard-preview__eyebrow">Development prototype</p>
				<h1>Wizard stepper preview</h1>
				<p>
					Static, in-memory test data only. This page does not create a Garden,
					save a draft, or initialize application storage.
				</p>
			</header>

			<section class="wizard-preview__controls" aria-labelledby="wizard-preview-controls-title">
				<h2 id="wizard-preview-controls-title">Preview controls</h2>
				<label for="wizard-preview-configuration">Step configuration</label>
				<select
					class="form-control"
					id="wizard-preview-configuration"
					value={configuration.id}
					onChange={changeConfiguration}
				>
					{wizardPreviewConfigurations.map((fixture) => (
						<option value={fixture.id} key={fixture.id}>{fixture.name}</option>
					))}
				</select>
				<p class="wizard-preview__position" aria-live="polite">
					Current step: <code>{activeStep?.id ?? 'none'}</code>
					{' '}({activeIndex + 1} of {steps.length})
				</p>
			</section>

			<section class="wizard-preview__demo" aria-labelledby="wizard-preview-active-title">
				<WizardStepper steps={configuration.steps} activeStepId={activeStepId} />
				<div class="wizard-preview__placeholder">
					<p>Placeholder step content</p>
					<h2 id="wizard-preview-active-title">{activeStep?.title ?? 'No valid step'}</h2>
					<p>
						This area stands in for the form owned by the active step. Navigation,
						validation, and persistence remain outside WizardStepper.
					</p>
				</div>
				<div class="wizard-preview__actions">
					<button
						class="btn-outline theme-secondary"
						type="button"
						disabled={activeIndex <= 0}
						onClick={() => move(-1)}
					>
						Back
					</button>
					<button
						class="btn-solid theme-primary"
						type="button"
						disabled={activeIndex < 0 || activeIndex >= steps.length - 1}
						onClick={() => move(1)}
					>
						Continue
					</button>
				</div>
			</section>
		</main>
	);
}
