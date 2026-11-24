import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import {
	GARDEN_WIZARD_STEP_FORMS,
	GardenAdvancedOptionsStep,
	GardenWizardDatesStep,
	GardenWizardDetailsStep,
	GardenWizardIdentityStep,
	GardenWizardOptionsStep,
	GardenWizardTypesStep,
	gardenWizardStepRegistration,
	validateAdvancedOptions,
} from './gardenWizardSteps.jsx';
import { SaveAsTemplateField } from './SaveAsTemplateField.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}

function text(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node !== 'object') return String(node);
	if (Array.isArray(node)) return node.map(text).join('');
	return text(node.props?.children);
}

const fields = {
	name: '', subtitle: '', icon: null, color: null, description: '',
	locationId: DEFAULT_LOCATION_ID, typeIds: [], startDate: '', endDate: '',
	status: 'planned', isClosed: false, saveAsTemplate: false,
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

	it('hides the redundant Location field when the renamed system Default is the sole valid choice', () => {
		const onChange = vi.fn();
		const tree = GardenWizardDetailsStep({
			fields, errors: {}, onChange, disabled: false, idPrefix: 'details',
			locations: [{ id: DEFAULT_LOCATION_ID, name: 'Back Yard' }],
		});

		expect(text(tree)).not.toContain('Geographic Location');
		expect(nodes(tree).find(({ type }) => type === 'select')).toBeUndefined();
		expect(onChange).not.toHaveBeenCalled();
		expect(fields.locationId).toBe(DEFAULT_LOCATION_ID);
	});

	it('shows the Location field when custom choices exist and preserves a recovered custom selection', () => {
		const customId = 'custom-location';
		const tree = GardenWizardDetailsStep({
			fields: { ...fields, locationId: customId }, errors: {}, onChange: vi.fn(),
			disabled: false, idPrefix: 'details', locations: [
				{ id: DEFAULT_LOCATION_ID, name: 'Default' },
				{ id: customId, name: 'Community Plot' },
			],
		});
		const select = nodes(tree).find(({ type }) => type === 'select');

		expect(text(tree)).toContain('Geographic Location');
		expect(select.props.value).toBe(customId);
	});

	it('keeps an unavailable Location visible with an actionable Default recovery choice', () => {
		const onChange = vi.fn();
		const tree = GardenWizardDetailsStep({
			fields: { ...fields, locationId: 'deleted-location' },
			errors: { locationId: 'Select an available Location.' },
			onChange, disabled: false, idPrefix: 'details',
			locations: [{ id: DEFAULT_LOCATION_ID, name: 'Default' }],
		});
		const select = nodes(tree).find(({ type }) => type === 'select');

		expect(text(tree)).toContain('Unavailable Location (select another)');
		expect(text(tree)).toContain('Default');
		expect(select.props).toMatchObject({
			'aria-invalid': 'true',
			'aria-describedby': 'details-location-error',
		});
		expect(nodes(tree).find(({ props }) => props?.message === 'Select an available Location.')).toBeDefined();
		select.props.onChange({ currentTarget: { value: DEFAULT_LOCATION_ID } });
		expect(onChange).toHaveBeenCalledWith('locationId', DEFAULT_LOCATION_ID);
	});

	it('keeps Wizard status choices restricted and uses the shared Template field', () => {
		const tree = GardenWizardOptionsStep({
			fields, errors: {}, onChange: vi.fn(), disabled: false, idPrefix: 'wizard',
		});
		expect(nodes(tree).filter(({ props }) => props?.type === 'radio').map(({ props }) => props.value))
			.toEqual(['planned', 'active']);
		expect(nodes(tree).find(({ type }) => type === SaveAsTemplateField)).toBeDefined();
	});

	it('renders and edits all Advanced lifecycle choices with predictable Archived behavior', () => {
		const onChange = vi.fn();
		const tree = GardenAdvancedOptionsStep({
			fields, errors: {}, onChange, disabled: false, idPrefix: 'advanced',
		});
		const radios = nodes(tree).filter(({ props }) => props?.type === 'radio');
		expect(radios.map(({ props }) => props.value)).toEqual([
			'planned', 'active', 'completed', 'archived',
		]);
		radios.find(({ props }) => props.value === 'archived').props.onChange();
		expect(onChange.mock.calls).toEqual([
			['status', 'archived'], ['isClosed', true],
		]);
		expect(nodes(tree).find(({ type }) => type === SaveAsTemplateField)).toBeDefined();
	});

	it('requires Archived Gardens to be closed and lets other statuses retain either closed state', () => {
		expect(validateAdvancedOptions({ ...fields, status: 'archived', isClosed: false }))
			.toEqual({ valid: false, errors: { isClosed: 'Archived Gardens must be closed.' } });
		for (const status of ['planned', 'active', 'completed']) {
			expect(validateAdvancedOptions({ ...fields, status, isClosed: false }).valid).toBe(true);
			expect(validateAdvancedOptions({ ...fields, status, isClosed: true }).valid).toBe(true);
		}
		expect(validateAdvancedOptions({ ...fields, status: 'archived', isClosed: true }).valid).toBe(true);
		const archived = GardenAdvancedOptionsStep({
			fields: { ...fields, status: 'archived', isClosed: true }, errors: {},
			onChange: vi.fn(), disabled: false, idPrefix: 'advanced',
		});
		expect(nodes(archived).find(({ props }) => props?.id === 'advanced-isClosed').props.disabled).toBe(true);
		const onChange = vi.fn();
		const archivedWithChange = GardenAdvancedOptionsStep({
			fields: { ...fields, status: 'archived', isClosed: true }, errors: {},
			onChange, disabled: false, idPrefix: 'advanced',
		});
		nodes(archivedWithChange).find(({ props }) => props?.value === 'planned').props.onChange();
		expect(onChange).toHaveBeenCalledWith('status', 'planned');
		expect(onChange).not.toHaveBeenCalledWith('isClosed', false);
	});
});
