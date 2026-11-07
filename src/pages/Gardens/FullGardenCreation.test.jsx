import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { createGardensService } from '../../services/gardens.js';
import { GardenStepper, validateGardenDraftForReview } from './FullGardenCreation.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props.children)];
}

const references = {
	locations: [{ id: DEFAULT_LOCATION_ID, name: 'Renamed Home' }],
	types: [{ id: 'indoor', name: 'Indoor' }, { id: 'container', name: 'Container' }],
};
const fields = {
	name: 'Garden', subtitle: '', description: '', locationId: DEFAULT_LOCATION_ID,
	typeIds: [], startDate: '', endDate: '',
};

describe('Full Garden creation UI helpers', () => {
	it('uses the Bootstrap Stepper states and accessible current step', () => {
		const tree = GardenStepper({ stage: 1 });
		const list = nodes(tree).find((node) => node.type === 'ol');
		const items = nodes(tree).filter((node) => node.type === 'li');
		expect(list.props.class).toBe('stepper md:stepper-horizontal');
		expect(items.map(({ props }) => props.class)).toEqual([
			'stepper-item active garden-step--complete',
			'stepper-item active garden-step--current',
			'stepper-item',
		]);
		expect(items.map(({ props }) => props['aria-current'])).toEqual([undefined, 'step', undefined]);
	});

	it('normalizes equivalent Wizard and Advanced fields through the shared validator', () => {
		const gardens = { validate: (input) => input };
		const wizard = validateGardenDraftForReview({ ...fields, typeIds: ['indoor', 'container'] }, references, gardens);
		const advanced = validateGardenDraftForReview({ ...fields, typeIds: ['indoor', 'container'] }, references, gardens);
		expect(wizard).toEqual(advanced);
		expect(wizard).toMatchObject({ startDate: null, endDate: null, typeIds: ['indoor', 'container'] });
	});

	it('rejects stale Location and Garden Type references before review', () => {
		const gardens = { validate: (input) => input };
		expect(() => validateGardenDraftForReview({ ...fields, locationId: 'missing-location' }, references, gardens))
			.toThrow('Select an available Location.');
		expect(() => validateGardenDraftForReview({ ...fields, typeIds: ['missing-type'] }, references, gardens))
			.toThrow('One or more selected Garden Types are unavailable.');
	});

	it('uses the Garden domain validator for blank names and date order', () => {
		const gardens = createGardensService({});
		expect(() => validateGardenDraftForReview({ ...fields, name: ' ' }, references, gardens)).toThrow('Garden name');
		expect(() => validateGardenDraftForReview({ ...fields, startDate: '2026-04-02', endDate: '2026-04-01' }, references, gardens)).toThrow('End date');
	});
});
