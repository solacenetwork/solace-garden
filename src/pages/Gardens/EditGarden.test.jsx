import { describe, expect, it, vi } from 'vitest';
import { GardenFields } from '../../components/GardenFields.jsx';
import { createGardensService } from '../../services/gardens.js';
import { ValidationError } from '../../storage/index.js';
import {
	GardenEditView, gardenEditFields, gardenEditInput, loadGardenEdit, validateGardenEdit,
} from './EditGarden.jsx';

function nodes(node) {
	if (node === null || node === undefined || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props.children)];
}

function text(tree) {
	return nodes(tree).filter((node) => typeof node === 'string').join(' ');
}

const ID = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';
const LOCATION = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c02';
const references = {
	locations: [{ id: LOCATION, name: 'Community Garden' }],
	types: [{ id: 'outdoor', name: 'Outdoor' }, { id: 'raised-bed', name: 'Raised Bed' }],
};
const garden = {
	id: ID, name: 'Spring Garden', subtitle: null, description: null,
	locationId: LOCATION, typeIds: ['outdoor'], startDate: null, endDate: null,
	notes: null, status: 'completed', isClosed: false,
};
const fields = gardenEditFields(garden);

describe('Garden editing UI', () => {
	it('maps every editable field without changing nullable domain values prematurely', () => {
		expect(fields).toEqual({
			name: 'Spring Garden', subtitle: '', description: '', locationId: LOCATION,
			typeIds: ['outdoor'], startDate: '', endDate: '', notes: '',
		});
		expect(gardenEditInput(fields)).toEqual({
			...fields, startDate: null, endDate: null,
		});
	});

	it('validates names, dates, notes and loaded references before save', () => {
		const gardens = createGardensService({});
		expect(validateGardenEdit({ ...fields, notes: 'x'.repeat(1000) }, references, gardens).notes).toHaveLength(1000);
		for (const [changes, message] of [
			[{ name: ' ' }, 'Garden name'],
			[{ notes: 'x'.repeat(1001) }, '1,000'],
			[{ startDate: '2026-05-02', endDate: '2026-05-01' }, 'End date'],
			[{ locationId: ID }, 'available Location'],
			[{ typeIds: ['container'] }, 'unavailable Garden Types'],
		]) {
			expect(() => validateGardenEdit({ ...fields, ...changes }, references, gardens)).toThrow(message);
		}
	});

	it('shows the Garden Notes counter without silently truncating over-limit text', () => {
		const exact = GardenFields({ fields: { ...fields, notes: 'x'.repeat(1000) }, locations: references.locations, types: references.types, onChange: vi.fn(), includeNotes: true, idPrefix: 'test' });
		expect(text(exact)).toContain('0 characters remaining');
		const over = GardenFields({ fields: { ...fields, notes: 'x'.repeat(1001) }, locations: references.locations, types: references.types, onChange: vi.fn(), includeNotes: true, idPrefix: 'test' });
		expect(text(over)).toContain('1 character over the limit');
		expect(nodes(over).find((node) => node.type === 'textarea' && node.props.id === 'test-notes').props.value).toHaveLength(1001);
	});

	it('keeps stale references visible and lets a selection change remove stale type IDs', () => {
		const onChange = vi.fn();
		const tree = GardenFields({
			fields: { ...fields, locationId: ID, typeIds: ['missing', 'outdoor'] },
			locations: references.locations, types: references.types, onChange, includeNotes: true,
		});
		expect(text(tree)).toContain('Unavailable Location');
		expect(text(tree)).toContain('saved Garden Types are unavailable');
		nodes(tree).find((node) => node.type === 'button' && text(node).includes('Remove unavailable')).props.onClick();
		expect(onChange).toHaveBeenCalledWith('typeIds', ['outdoor']);
		const selector = nodes(tree).find((node) => node.type === 'input' && node.props.value === 'raised-bed');
		selector.props.onChange({ currentTarget: { checked: true } });
		expect(onChange).toHaveBeenLastCalledWith('typeIds', ['outdoor', 'raised-bed']);
	});

	it('offers explicit Save and Cancel for editable records but no Save for read-only records', () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		const editable = GardenEditView({ state: { status: 'ready', garden, references }, fields, onSubmit, onCancel });
		expect(text(editable)).toContain('Save Changes');
		expect(text(editable)).toContain('Garden Notes');
		nodes(editable).find((node) => node.type === 'form').props.onSubmit();
		nodes(editable).find((node) => node.type === 'button' && text(node).includes('Cancel')).props.onClick();
		expect(onSubmit).toHaveBeenCalledOnce();
		expect(onCancel).toHaveBeenCalledOnce();

		for (const readOnlyGarden of [{ ...garden, isClosed: true }, { ...garden, status: 'archived' }]) {
			const readOnly = GardenEditView({ state: { status: 'ready', garden: readOnlyGarden, references }, fields });
			expect(text(readOnly)).toContain('read-only');
			expect(nodes(readOnly).some((node) => node.type === 'button' && text(node).includes('Save Changes'))).toBe(false);
			expect(nodes(readOnly).filter((node) => ['input', 'select', 'textarea'].includes(node.type)).every((node) => node.props.disabled)).toBe(true);
		}
	});

	it('distinguishes loading, retryable failure, invalid IDs and missing records', async () => {
		expect(nodes(GardenEditView({ state: { status: 'loading' } })).some((node) => node.props?.role === 'status')).toBe(true);
		const retry = vi.fn();
		const error = GardenEditView({ state: { status: 'error' }, onRetry: retry });
		nodes(error).find((node) => node.type === 'button').props.onClick();
		expect(retry).toHaveBeenCalledOnce();
		expect(text(GardenEditView({ state: { status: 'not-found' } }))).toContain('Garden not found');

		const invalid = await loadGardenEdit({ gardens: { getById: () => { throw new ValidationError('INVALID_RECORD_ID', 'invalid'); } } }, 'invalid');
		expect(invalid).toEqual({ status: 'not-found' });
		const missing = await loadGardenEdit({ gardens: { getById: async () => null } }, ID);
		expect(missing).toEqual({ status: 'not-found' });
	});
});
