import { validateWizardDefinition } from '../../wizard/wizardDefinition.js';
import { resolveWizardStep } from '../../wizard/wizardNavigation.js';
import productionDefinition from './gardenWizard.steps.json';

export const GARDEN_WIZARD_STEP_COUNT = 5;

export function loadGardenWizardSteps(definition = productionDefinition) {
	return validateWizardDefinition(definition, { expectedStepCount: GARDEN_WIZARD_STEP_COUNT });
}

export function requestedGardenWizardStep(query = {}) {
	return Object.hasOwn(query, 'step') ? query.step : undefined;
}

export function resolveGardenWizardLocation({ steps, query = {}, persistedStepId = null }) {
	return resolveWizardStep(steps, {
		requestedStepId: requestedGardenWizardStep(query),
		persistedStepId,
	});
}

function appendQueryValue(parameters, key, value) {
	if (Array.isArray(value)) {
		for (const entry of value) parameters.append(key, entry);
	} else if (value !== undefined && value !== null) {
		parameters.append(key, value);
	}
}

export function createGardenWizardUrl(path, stepId, query = {}) {
	const parameters = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (key !== 'step') appendQueryValue(parameters, key, value);
	}
	parameters.set('step', stepId);
	return `${path}?${parameters}`;
}

export function navigateGardenWizardStep({
	route,
	path,
	query,
	stepId,
	replace = false,
}) {
	const destination = createGardenWizardUrl(path, stepId, query);
	route(destination, replace);
	return destination;
}
