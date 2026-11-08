import { describe, expect, it, vi } from 'vitest';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import { DEFAULT_LOCATION_ID } from '../../services/locations.js';
import { createGardensService } from '../../services/gardens.js';
import {
	applyTemplateToGardenDraft,
	GardenStepper,
	resolveTemplateLocationForFinalization,
	validateGardenDraftForReview,
} from './FullGardenCreation.jsx';
import { GardenTemplateSelection } from './GardenTemplateSelection.jsx';

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

const template = {
	id: '550e8400-e29b-41d4-a716-446655440010',
	name: 'Favorite',
	configuration: {
		name: 'Template Garden', description: null, locationId: DEFAULT_LOCATION_ID,
		typeIds: ['indoor'], layoutMediaId: 'ignored-layout',
	},
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

	it('renders scratch and duplicate-name Templates as distinct accessible choices without raw IDs', () => {
		const second = { ...template, id: '550e8400-e29b-41d4-a716-446655440011', configuration: { ...template.configuration, name: 'Other Garden' } };
		const tree = GardenTemplateSelection({
			state: { status: 'ready', templates: [template, second] },
			references, selectedId: second.id, onSelect: () => {}, onApply: () => {}, onRetry: () => {},
			idPrefix: 'test',
		});
		const labels = nodes(tree).filter((node) => node.type === 'label');
		const radios = nodes(tree).filter((node) => node.type === 'input');
		const visibleText = nodes(tree).filter((node) => typeof node === 'string').join(' ');
		expect(labels).toHaveLength(3);
		expect(radios.map(({ props }) => props.checked)).toEqual([false, false, true]);
		expect(visibleText.match(/Favorite/g)).toHaveLength(2);
		expect(visibleText).toMatch(/Suggested Garden:\s+Template Garden/);
		expect(visibleText).not.toContain(template.id);
	});

	it.each([
		[{ status: 'loading' }, 'Loading saved Templates…'],
		[{ status: 'error' }, 'Saved Templates could not be loaded.'],
		[{ status: 'ready', templates: [] }, 'No saved Garden Templates yet.'],
	])('renders the Template list state %#', (state, expected) => {
		const tree = GardenTemplateSelection({
			state, references, selectedId: null, onSelect: () => {}, onApply: () => {}, onRetry: () => {}, idPrefix: 'state',
		});
		expect(nodes(tree).filter((node) => typeof node === 'string').join(' ')).toContain(expected);
	});
});

describe('Garden Template draft application', () => {
	it('maps only reusable fields, stops pending autosave before saving, and preserves draft-only fields', async () => {
		const events = [];
		const currentFields = {
			...fields, name: '', subtitle: 'Keep subtitle', startDate: '2026-04-01', endDate: '2026-04-30',
		};
		const result = await applyTemplateToGardenDraft({
			templateId: template.id,
			draft: { id: 'draft', createdAt: 'created' },
			currentFields,
			autosave: { stop: async () => { events.push('stop'); } },
			drafts: { save: async ({ fields: savedFields }) => { events.push('save'); return { fields: savedFields, createdAt: 'created' }; } },
			templates: { resolveConfiguration: async () => ({
				configuration: template.configuration,
				locationResolution: { fallbackOccurred: false },
			}) },
		});
		expect(events).toEqual(['stop', 'save']);
		expect(result.fields).toEqual({
			...currentFields,
			name: 'Template Garden', description: '', locationId: DEFAULT_LOCATION_ID, typeIds: ['indoor'],
		});
		expect(result.fields).not.toHaveProperty('layoutMediaId');
	});

	it('prevents a pending older autosave from overwriting the applied Template', async () => {
		let scheduledTimer;
		const savedValues = [];
		const save = async ({ fields: savedFields }) => {
			savedValues.push(savedFields);
			return { fields: savedFields, createdAt: 'created' };
		};
		const autosave = createDraftAutosave({
			write: (value) => save({ fields: value }),
			onStatus: () => {},
			setTimer: (callback) => { scheduledTimer = callback; return 1; },
			clearTimer: () => {},
		});
		autosave.schedule({ ...fields, name: 'Older pending value' });

		await applyTemplateToGardenDraft({
			templateId: template.id,
			draft: { id: 'draft', createdAt: 'created' },
			currentFields: { ...fields, name: '' },
			autosave,
			drafts: { save },
			templates: { resolveConfiguration: async () => ({
				configuration: template.configuration,
				locationResolution: { fallbackOccurred: false },
			}) },
		});
		await scheduledTimer();

		expect(savedValues).toHaveLength(1);
		expect(savedValues[0].name).toBe('Template Garden');
	});

	it('requires confirmation before replacing entered values and cancellation leaves autosave untouched', async () => {
		const stop = vi.fn();
		const save = vi.fn();
		const confirmReplacement = vi.fn(() => false);
		const result = await applyTemplateToGardenDraft({
			templateId: template.id,
			draft: { id: 'draft', createdAt: 'created' },
			currentFields: { ...fields, name: 'My work' },
			autosave: { stop }, drafts: { save }, confirmReplacement,
			templates: { resolveConfiguration: async () => ({ configuration: template.configuration, locationResolution: {} }) },
		});
		expect(result).toEqual({ status: 'cancelled' });
		expect(confirmReplacement).toHaveBeenCalledOnce();
		expect(stop).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});

	it('handles deletion before apply without mutating the draft', async () => {
		const stop = vi.fn();
		const save = vi.fn();
		const result = await applyTemplateToGardenDraft({
			templateId: template.id,
			draft: { id: 'draft', createdAt: 'created' }, currentFields: fields,
			autosave: { stop }, drafts: { save },
			templates: { resolveConfiguration: async () => null },
		});
		expect(result).toEqual({ status: 'missing' });
		expect(stop).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});

	it('propagates the durable save failure after stopping autosave', async () => {
		const error = new Error('storage failed');
		await expect(applyTemplateToGardenDraft({
			templateId: template.id,
			draft: { id: 'draft', createdAt: 'created' }, currentFields: { ...fields, name: '' },
			autosave: { stop: vi.fn() }, drafts: { save: async () => { throw error; } },
			templates: { resolveConfiguration: async () => ({ configuration: template.configuration, locationResolution: {} }) },
		})).rejects.toBe(error);
	});

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
});
