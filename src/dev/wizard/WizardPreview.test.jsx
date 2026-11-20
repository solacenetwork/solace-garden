import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ state: [], setters: [] }));

vi.mock('preact/hooks', () => ({
	useMemo: (factory) => factory(),
	useState: (initial) => {
		const index = harness.setters.length;
		const setter = vi.fn();
		harness.setters.push(setter);
		return [harness.state[index] ?? (typeof initial === 'function' ? initial() : initial), setter];
	},
}));

vi.mock('../../components/WizardStepper.jsx', async (importOriginal) => {
	const original = await importOriginal();
	return {
		...original,
		WizardStepper: (props) => <div data-wizard-stepper="true" {...props} />,
	};
});

import { WizardStepper } from '../../components/WizardStepper.jsx';
import {
	adjacentStepId,
	WizardPreview,
	wizardPreviewConfigurations,
} from './WizardPreview.jsx';

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}

function button(tree, label) {
	return nodes(tree).find(({ type, props }) => type === 'button' && props.children === label);
}

beforeEach(() => {
	harness.state = [];
	harness.setters = [];
});

describe('Wizard development preview', () => {
	it('loads four JSON configurations through the reusable component', () => {
		const tree = WizardPreview();
		const selector = nodes(tree).find(({ type }) => type === 'select');
		const stepper = nodes(tree).find(({ type }) => type === WizardStepper);

		expect(wizardPreviewConfigurations.map(({ id }) => id)).toEqual([
			'default', 'additional', 'long-labels', 'reordered',
		]);
		expect(nodes(selector).filter(({ type }) => type === 'option')).toHaveLength(4);
		expect(stepper.props.activeStepId).toBe('identity');
		expect(stepper.props.steps).toHaveLength(5);
	});

	it('simulates bounded Back and Continue navigation in memory', () => {
		const first = WizardPreview();
		expect(button(first, 'Back').props.disabled).toBe(true);
		expect(button(first, 'Continue').props.disabled).toBe(false);
		button(first, 'Continue').props.onClick();
		expect(harness.setters[1]).toHaveBeenCalledWith('details');

		harness.state = ['default', 'options'];
		harness.setters = [];
		const last = WizardPreview();
		expect(button(last, 'Back').props.disabled).toBe(false);
		expect(button(last, 'Continue').props.disabled).toBe(true);
		expect(adjacentStepId(wizardPreviewConfigurations[0].steps, 'options', 1)).toBe('options');
		expect(adjacentStepId(wizardPreviewConfigurations[0].steps, 'identity', -1)).toBe('identity');
	});

	it('resets to the first ordered step when the configuration changes', () => {
		const tree = WizardPreview();
		const selector = nodes(tree).find(({ type }) => type === 'select');
		selector.props.onChange({ currentTarget: { value: 'reordered' } });

		expect(harness.setters[0]).toHaveBeenCalledWith('reordered');
		expect(harness.setters[1]).toHaveBeenCalledWith('identity');
	});

	it('does not access IndexedDB while rendering the isolated preview', () => {
		Object.defineProperty(globalThis, 'indexedDB', {
			configurable: true,
			get() { throw new Error('Preview must not access IndexedDB'); },
		});
		try {
			expect(WizardPreview().type).toBe('main');
		} finally {
			delete globalThis.indexedDB;
		}
	});
});
