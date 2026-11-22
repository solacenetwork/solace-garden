import { describe, expect, it } from 'vitest';
import { validateWizardDefinition, WizardDefinitionError } from './wizardDefinition.js';

const steps = [
	{ id: 'details', order: 20, title: 'Details', stepperLabel: 'Details' },
	{ id: 'identity', order: 10, title: 'Identity', stepperLabel: 'Identity' },
];

describe('Wizard definition validation', () => {
	it('strictly validates, orders, copies, and freezes a definition', () => {
		const definition = validateWizardDefinition(steps, { expectedStepCount: 2 });
		expect(definition.map(({ id }) => id)).toEqual(['identity', 'details']);
		expect(definition).not.toBe(steps);
		expect(Object.isFrozen(definition)).toBe(true);
		expect(definition.every(Object.isFrozen)).toBe(true);
	});

	it.each([
		[null, 'non-empty array'],
		[[], 'non-empty array'],
		[[{ ...steps[0], extra: true }], 'unexpected property'],
		[[{ id: 'details', order: 20, title: 'Details' }], 'missing property'],
		[[{ ...steps[0], id: 'Bad ID' }], 'invalid id'],
		[[{ ...steps[0], order: 1.5 }], 'invalid order'],
		[[{ ...steps[0], title: ' ' }], 'invalid title'],
		[[{ ...steps[0], stepperLabel: ' padded ' }], 'invalid stepperLabel'],
	])('rejects malformed definitions %#', (definition, message) => {
		expect(() => validateWizardDefinition(definition)).toThrow(message);
	});

	it('rejects duplicate IDs, duplicate orders, and an unexpected production count', () => {
		expect(() => validateWizardDefinition([steps[0], { ...steps[1], id: steps[0].id }]))
			.toThrow('duplicated');
		expect(() => validateWizardDefinition([steps[0], { ...steps[1], order: steps[0].order }]))
			.toThrow('duplicated');
		expect(() => validateWizardDefinition(steps, { expectedStepCount: 5 }))
			.toThrow('exactly 5');
	});

	it('reports validation context without retaining Garden data', () => {
		try {
			validateWizardDefinition([{ ...steps[0], privateDraftValue: 'secret' }]);
		} catch (error) {
			expect(error).toBeInstanceOf(WizardDefinitionError);
			expect(error.details).toEqual({ index: 0, field: 'privateDraftValue' });
		}
	});
});
