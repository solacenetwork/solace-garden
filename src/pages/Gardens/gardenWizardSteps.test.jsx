import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import {
	GARDEN_WIZARD_STEP_FORMS,
	GardenWizardDatesStep,
	GardenWizardDetailsStep,
	GardenWizardIdentityStep,
	GardenWizardOptionsStep,
	GardenWizardTypesStep,
	gardenWizardStepRegistration,
} from './gardenWizardSteps.jsx';

const fields = {
	name: '', subtitle: '', icon: null, color: null, description: '',
	locationId: DEFAULT_LOCATION_ID, typeIds: [], startDate: '', endDate: '',
	status: 'planned', saveAsTemplate: false,
};
const references = {
	locations: [{ id: DEFAULT_LOCATION_ID, name: 'Default Location' }],
	types: [{ id: 'container', name: 'Container' }],
};
const steps = [
	['identity', GardenWizardIdentityStep], ['details', GardenWizardDetailsStep],
	['types', GardenWizardTypesStep], ['dates', GardenWizardDatesStep],
	['options', GardenWizardOptionsStep],
];

describe('Garden Wizard step-form registry', () => {
	it('maps every production stable ID to its Garden-specific form and validator', () => {
		const registered = gardenWizardStepRegistration(steps.map(([id], order) => ({ id, order, title: id, stepperLabel: id })));
		expect(registered.map(({ id, Component }) => [id, Component])).toEqual(steps);
		expect(registered.every(({ validate }) => typeof validate === 'function')).toBe(true);
	});

	it('fails configuration when production metadata and form registration diverge', () => {
		expect(() => gardenWizardStepRegistration([{ id: 'identity' }])).toThrow('does not match');
		expect(() => gardenWizardStepRegistration([...steps, ['retired', () => null]].map(([id], order) => ({ id, order })))).toThrow('retired');
	});

	it('renders each form independently with the shared durable fields', () => {
		for (const [id, Component] of steps) {
			const tree = Component({ fields, errors: {}, ...references, onChange: vi.fn(), disabled: false, idPrefix: 'test' });
			expect(tree).toBeTruthy();
			expect(GARDEN_WIZARD_STEP_FORMS[id].Component).toBe(Component);
		}
	});

	it('requires only the Garden name on Identity and keeps empty optional fields valid', () => {
		expect(GARDEN_WIZARD_STEP_FORMS.identity.validate(fields, references)).toEqual({
			valid: false, errors: { name: 'Enter a Garden name.' },
		});
		expect(GARDEN_WIZARD_STEP_FORMS.identity.validate({ ...fields, name: 'Patio' }, references)).toEqual({ valid: true, errors: {} });
	});

	it('validates unavailable references, optional types, date order, and Planned/Active status per step', () => {
		expect(GARDEN_WIZARD_STEP_FORMS.details.validate({ ...fields, locationId: 'missing' }, references).errors).toHaveProperty('locationId');
		expect(GARDEN_WIZARD_STEP_FORMS.types.validate(fields, references)).toEqual({ valid: true, errors: {} });
		expect(GARDEN_WIZARD_STEP_FORMS.types.validate({ ...fields, typeIds: ['deleted'] }, references).errors).toHaveProperty('typeIds');
		expect(GARDEN_WIZARD_STEP_FORMS.dates.validate({ ...fields, startDate: '2027-05-02', endDate: '2027-05-01' }, references).errors).toHaveProperty('endDate');
		expect(GARDEN_WIZARD_STEP_FORMS.options.validate({ ...fields, status: 'archived' }, references).errors).toHaveProperty('status');
	});
});
