import { useEffect, useMemo, useRef } from 'preact/hooks';
import './WizardStepper.css';

function isValidStep(step) {
	return step
		&& typeof step.id === 'string'
		&& step.id.trim().length > 0
		&& Number.isFinite(step.order)
		&& typeof step.title === 'string'
		&& step.title.trim().length > 0
		&& typeof step.stepperLabel === 'string'
		&& step.stepperLabel.trim().length > 0;
}

export function normalizeWizardSteps(steps) {
	if (!Array.isArray(steps)) return [];

	const seenIds = new Set();
	return steps
		.filter((step) => {
			if (!isValidStep(step) || seenIds.has(step.id)) return false;
			seenIds.add(step.id);
			return true;
		})
		.map((step) => ({
			id: step.id,
			order: step.order,
			title: step.title,
			stepperLabel: step.stepperLabel,
		}))
		.sort((left, right) => left.order - right.order);
}

export function scrollActiveStep(container, activeStep, reduceMotion = false) {
	if (!container || !activeStep) return;

	const left = Math.max(
		0,
		activeStep.offsetLeft - ((container.clientWidth - activeStep.offsetWidth) / 2),
	);
	const options = { left, behavior: reduceMotion ? 'auto' : 'smooth' };

	if (typeof container.scrollTo === 'function') container.scrollTo(options);
	else container.scrollLeft = left;
}

function stepState(index, activeIndex) {
	if (activeIndex < 0 || index > activeIndex) return 'upcoming';
	if (index < activeIndex) return 'completed';
	return 'active';
}

const stateLabels = {
	completed: 'Complete',
	active: 'Current',
	upcoming: 'Upcoming',
};

export function WizardStepper({ steps, activeStepId, label = 'Wizard progress' }) {
	const containerRef = useRef(null);
	const normalizedSteps = useMemo(() => normalizeWizardSteps(steps), [steps]);
	const activeIndex = normalizedSteps.findIndex(({ id }) => id === activeStepId);

	useEffect(() => {
		const container = containerRef.current;
		const activeStep = container?.querySelector('[aria-current="step"]');
		const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
		scrollActiveStep(container, activeStep, reduceMotion);
	}, [activeStepId, normalizedSteps]);

	if (normalizedSteps.length === 0) {
		return <p class="wizard-stepper__empty" role="status">Wizard progress is unavailable.</p>;
	}

	return (
		<div class="stepper-overflow wizard-stepper" role="region" aria-label={label} ref={containerRef}>
			<ol class="stepper stepper-horizontal">
				{normalizedSteps.map((step, index) => {
					const state = stepState(index, activeIndex);
					return (
						<li
							class={`stepper-item wizard-stepper__item wizard-stepper__item--${state}${state !== 'upcoming' ? ' active' : ''}`}
							aria-current={state === 'active' ? 'step' : undefined}
							aria-label={`Step ${index + 1}: ${step.title}, ${stateLabels[state]}`}
							data-step-id={step.id}
							data-step-state={state}
							key={step.id}
							title={step.title}
						>
							<span class="wizard-stepper__text" aria-hidden="true">
								<span class="wizard-stepper__label">{step.stepperLabel}</span>
								<span class="wizard-stepper__state">{stateLabels[state]}</span>
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
