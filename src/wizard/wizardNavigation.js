export function findWizardStep(steps, stepId) {
	return steps.find((step) => step.id === stepId) ?? null;
}

export function resolveWizardStep(steps, {
	requestedStepId,
	persistedStepId = null,
} = {}) {
	if (requestedStepId !== undefined) {
		return findWizardStep(steps, requestedStepId)
			? { status: 'resolved', stepId: requestedStepId, source: 'url' }
			: { status: 'invalid', stepId: requestedStepId, source: 'url' };
	}
	if (persistedStepId !== null && persistedStepId !== undefined) {
		return findWizardStep(steps, persistedStepId)
			? { status: 'resolved', stepId: persistedStepId, source: 'persisted' }
			: { status: 'invalid', stepId: persistedStepId, source: 'persisted' };
	}
	return { status: 'resolved', stepId: steps[0]?.id ?? null, source: 'default' };
}

export function adjacentWizardStepId(steps, activeStepId, direction) {
	if (direction !== -1 && direction !== 1) return null;
	const activeIndex = steps.findIndex(({ id }) => id === activeStepId);
	if (activeIndex < 0) return null;
	const adjacentIndex = Math.min(steps.length - 1, Math.max(0, activeIndex + direction));
	return steps[adjacentIndex]?.id ?? null;
}
