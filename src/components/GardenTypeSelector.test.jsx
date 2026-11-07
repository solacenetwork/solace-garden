import { describe, expect, it, vi } from 'vitest';
import {
	GardenTypeSelector,
	nextGardenTypeSelection,
} from './GardenTypeSelector.jsx';

const TYPES = [
	{ id: 'in-ground', name: 'In-Ground', isSystem: true, sortOrder: 0 },
	{ id: 'container', name: 'Container', isSystem: true, sortOrder: 2 },
];

function inputsFor(props) {
	const selector = GardenTypeSelector(props);
	const grid = selector.props.children[1];
	return grid.props.children.map((label) => label.props.children[0]);
}

describe('GardenTypeSelector', () => {
	it('emits independent selections and deselections from the controlled value', () => {
		const onSelect = vi.fn();
		const [inGround] = inputsFor({
			types: TYPES,
			selectedIds: [],
			onChange: onSelect,
		});
		inGround.props.onChange({ currentTarget: { checked: true } });
		expect(onSelect).toHaveBeenCalledWith(['in-ground']);

		const onDeselect = vi.fn();
		const [, container] = inputsFor({
			types: TYPES,
			selectedIds: ['in-ground', 'container'],
			onChange: onDeselect,
		});
		container.props.onChange({ currentTarget: { checked: false } });
		expect(onDeselect).toHaveBeenCalledWith(['in-ground']);
	});

	it('preserves controlled selections across rerenders', () => {
		const firstInputs = inputsFor({ types: TYPES, selectedIds: ['container'], onChange() {} });
		const secondInputs = inputsFor({ types: TYPES, selectedIds: ['container'], onChange() {} });

		expect(firstInputs.map(({ props }) => props.checked)).toEqual([false, true]);
		expect(secondInputs.map(({ props }) => props.checked)).toEqual([false, true]);
	});

	it('does not emit changes while disabled', () => {
		const onChange = vi.fn();
		const inputs = inputsFor({
			types: TYPES,
			selectedIds: ['in-ground'],
			onChange,
			disabled: true,
		});

		expect(inputs.every(({ props }) => props.disabled)).toBe(true);
		inputs[0].props.onChange({ currentTarget: { checked: false } });
		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not duplicate an already-selected ID', () => {
		expect(nextGardenTypeSelection(['outdoor'], 'outdoor', true)).toEqual(['outdoor']);
	});
});
