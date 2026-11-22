export class WizardDefinitionError extends Error {
	constructor(message, details = {}) {
		super(message);
		this.name = 'WizardDefinitionError';
		this.details = details;
	}
}

const STEP_FIELDS = Object.freeze(['id', 'order', 'title', 'stepperLabel']);
const STEP_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function definitionError(message, details) {
	throw new WizardDefinitionError(message, details);
}

function validateStep(step, index) {
	if (!step || typeof step !== 'object' || Array.isArray(step) || Object.getPrototypeOf(step) !== Object.prototype) {
		definitionError(`Wizard step ${index + 1} must be an object.`, { index });
	}

	const keys = Object.keys(step);
	const unexpected = keys.find((key) => !STEP_FIELDS.includes(key));
	if (unexpected) {
		definitionError(`Wizard step ${index + 1} contains unexpected property "${unexpected}".`, {
			index,
			field: unexpected,
		});
	}
	const missing = STEP_FIELDS.find((key) => !Object.hasOwn(step, key));
	if (missing) {
		definitionError(`Wizard step ${index + 1} is missing property "${missing}".`, {
			index,
			field: missing,
		});
	}
	if (typeof step.id !== 'string' || !STEP_ID_PATTERN.test(step.id)) {
		definitionError(`Wizard step ${index + 1} has an invalid id.`, { index, field: 'id' });
	}
	if (!Number.isSafeInteger(step.order) || step.order < 0) {
		definitionError(`Wizard step ${index + 1} has an invalid order.`, { index, field: 'order' });
	}
	for (const field of ['title', 'stepperLabel']) {
		if (typeof step[field] !== 'string' || step[field].trim() === '' || step[field] !== step[field].trim()) {
			definitionError(`Wizard step ${index + 1} has an invalid ${field}.`, { index, field });
		}
	}

	return Object.freeze({
		id: step.id,
		order: step.order,
		title: step.title,
		stepperLabel: step.stepperLabel,
	});
}

export function validateWizardDefinition(definition, { expectedStepCount } = {}) {
	if (!Array.isArray(definition) || definition.length === 0) {
		definitionError('Wizard definition must be a non-empty array of steps.');
	}
	if (
		expectedStepCount !== undefined
		&& (!Number.isSafeInteger(expectedStepCount) || expectedStepCount < 1)
	) {
		definitionError('Expected Wizard step count must be a positive integer.', { expectedStepCount });
	}
	if (expectedStepCount !== undefined && definition.length !== expectedStepCount) {
		definitionError(`Wizard definition must contain exactly ${expectedStepCount} steps.`, {
			expectedStepCount,
			actualStepCount: definition.length,
		});
	}

	const steps = definition.map(validateStep);
	const seenIds = new Set();
	const seenOrders = new Set();
	for (const [index, step] of steps.entries()) {
		if (seenIds.has(step.id)) {
			definitionError(`Wizard step id "${step.id}" is duplicated.`, { index, field: 'id' });
		}
		if (seenOrders.has(step.order)) {
			definitionError(`Wizard step order "${step.order}" is duplicated.`, { index, field: 'order' });
		}
		seenIds.add(step.id);
		seenOrders.add(step.order);
	}

	return Object.freeze([...steps].sort((left, right) => left.order - right.order));
}
