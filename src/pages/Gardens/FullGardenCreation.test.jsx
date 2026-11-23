import { describe, expect, it, vi } from 'vitest';
vi.mock('bootstrap/js/dist/dialog.js', () => ({ default: class Dialog {} }));
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { createGardensService } from '../../services/gardens.js';
import {
	resolveTemplateLocationForFinalization,
	templateLocationOriginForDraft,
	validateGardenDraftForReview,
} from './FullGardenCreation.jsx';

const references = {
	locations: [{ id: DEFAULT_LOCATION_ID, name: 'Renamed Home' }],
	types: [{ id: 'indoor', name: 'Indoor' }, { id: 'container', name: 'Container' }],
};
const fields = {
	name: 'Garden', subtitle: '', icon: null, color: null, description: '', locationId: DEFAULT_LOCATION_ID,
	typeIds: [], startDate: '', endDate: '', status: 'planned', isClosed: false, saveAsTemplate: false,
};

const template = {
	id: '550e8400-e29b-41d4-a716-446655440010',
	name: 'Favorite',
	configuration: {
		name: 'Template Garden', description: null, locationId: DEFAULT_LOCATION_ID,
		typeIds: ['indoor'], layoutMediaId: 'ignored-layout',
	},
};

describe('Full Garden creation UI helpers', () => {
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

describe('Garden Template draft provenance', () => {
	it('falls back only while the missing Location still has live Template provenance', () => {
		const missingFields = { ...fields, locationId: 'deleted-location' };
		const locations = references.locations;
		expect(resolveTemplateLocationForFinalization(missingFields, locations, { locationId: 'deleted-location' }))
			.toMatchObject({ fallbackOccurred: true, locationUnavailable: false, fields: { locationId: DEFAULT_LOCATION_ID } });
		expect(resolveTemplateLocationForFinalization(missingFields, locations, null))
			.toMatchObject({ fallbackOccurred: false, locationUnavailable: true });
		expect(resolveTemplateLocationForFinalization(missingFields, locations, { locationId: 'different-location' }))
			.toMatchObject({ fallbackOccurred: false, locationUnavailable: true });
	});

	it('rehydrates Location provenance only when the persisted source still matches the draft Location', () => {
		const draft = { fields, sourceTemplateId: template.id };
		expect(templateLocationOriginForDraft(draft, [template])).toEqual({ locationId: DEFAULT_LOCATION_ID });
		expect(templateLocationOriginForDraft({
			...draft, fields: { ...fields, locationId: 'gardener-location' },
		}, [template])).toBeNull();
		expect(templateLocationOriginForDraft(draft, [])).toBeNull();
	});
});
