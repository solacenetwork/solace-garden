import { describe, expect, it } from 'vitest';
import { adjacentWizardStepId, resolveWizardStep } from './wizardNavigation.js';

const steps = [
	{ id: 'identity' }, { id: 'details' }, { id: 'options' },
];

describe('Wizard navigation', () => {
	it('uses a valid explicit URL step before the persisted step', () => {
		expect(resolveWizardStep(steps, {
			requestedStepId: 'details', persistedStepId: 'options',
		})).toEqual({ status: 'resolved', stepId: 'details', source: 'url' });
	});

	it('resumes a valid persisted step and otherwise starts first', () => {
		expect(resolveWizardStep(steps, { persistedStepId: 'options' }))
			.toEqual({ status: 'resolved', stepId: 'options', source: 'persisted' });
		expect(resolveWizardStep(steps, { persistedStepId: null }))
			.toEqual({ status: 'resolved', stepId: 'identity', source: 'default' });
	});

	it('does not fall through from invalid URL or persisted IDs', () => {
		expect(resolveWizardStep(steps, { requestedStepId: 'missing', persistedStepId: 'details' }))
			.toEqual({ status: 'invalid', stepId: 'missing', source: 'url' });
		expect(resolveWizardStep(steps, { persistedStepId: 'retired' }))
			.toEqual({ status: 'invalid', stepId: 'retired', source: 'persisted' });
	});

	it('uses bounded stable-ID adjacency', () => {
		expect(adjacentWizardStepId(steps, 'identity', -1)).toBe('identity');
		expect(adjacentWizardStepId(steps, 'identity', 1)).toBe('details');
		expect(adjacentWizardStepId(steps, 'options', 1)).toBe('options');
		expect(adjacentWizardStepId(steps, 'missing', 1)).toBeNull();
		expect(adjacentWizardStepId(steps, 'details', 0)).toBeNull();
	});
});
