import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ effects: [], ref: { current: null } }));

vi.mock('preact/hooks', () => ({
	useEffect: (effect, dependencies) => harness.effects.push({ effect, dependencies }),
	useMemo: (factory) => factory(),
	useRef: () => harness.ref,
}));

import {
	normalizeWizardSteps,
	scrollActiveStep,
	WizardStepper,
} from './WizardStepper.jsx';

const sourceSteps = [
	{ id: 'dates', order: 40, title: 'Garden Dates', stepperLabel: 'Dates' },
	{ id: 'identity', order: 10, title: 'Garden Identity', stepperLabel: 'Identity' },
	{ id: 'details', order: 20, title: 'Garden Details', stepperLabel: 'Details' },
];

function nodes(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	return [node, ...nodes(node.props?.children)];
}

beforeEach(() => {
	harness.effects = [];
	harness.ref = { current: null };
});

describe('WizardStepper presentation', () => {
	it('sorts by order, calculates numbering, and preserves stable step IDs', () => {
		const tree = WizardStepper({ steps: sourceSteps, activeStepId: 'details' });
		const list = nodes(tree).find(({ type }) => type === 'ol');
		const items = nodes(tree).filter(({ type }) => type === 'li');

		expect(tree.props.class).toBe('stepper-overflow wizard-stepper');
		expect(tree.props).toMatchObject({ role: 'region', 'aria-label': 'Wizard progress' });
		expect(list.props.class).toBe('stepper stepper-horizontal');
		expect(items.map(({ props }) => props['data-step-id'])).toEqual([
			'identity', 'details', 'dates',
		]);
		expect(items.map(({ props }) => props['aria-label'])).toEqual([
			'Step 1: Garden Identity, Complete',
			'Step 2: Garden Details, Current',
			'Step 3: Garden Dates, Upcoming',
		]);
	});

	it('uses compact visible labels while retaining full titles', () => {
		const tree = WizardStepper({ steps: sourceSteps, activeStepId: 'identity' });
		const items = nodes(tree).filter(({ type }) => type === 'li');
		const labels = nodes(tree).filter(({ props }) => props.class === 'wizard-stepper__label');

		expect(labels.map(({ props }) => props.children)).toEqual(['Identity', 'Details', 'Dates']);
		expect(items.map(({ props }) => props.title)).toEqual([
			'Garden Identity', 'Garden Details', 'Garden Dates',
		]);
	});

	it('marks completed, current, and upcoming states without clickable indicators', () => {
		const tree = WizardStepper({ steps: sourceSteps, activeStepId: 'details' });
		const items = nodes(tree).filter(({ type }) => type === 'li');

		expect(items.map(({ props }) => props['data-step-state'])).toEqual([
			'completed', 'active', 'upcoming',
		]);
		expect(items.map(({ props }) => props['aria-current'])).toEqual([
			undefined, 'step', undefined,
		]);
		expect(nodes(tree).some(({ type }) => type === 'a' || type === 'button')).toBe(false);
		expect(nodes(tree).filter(({ props }) => props.class === 'wizard-stepper__state')
			.map(({ props }) => props.children)).toEqual(['Complete', 'Current', 'Upcoming']);
	});

	it('filters malformed and duplicate definitions predictably and renders an empty state', () => {
		expect(normalizeWizardSteps([
			sourceSteps[1],
			{ ...sourceSteps[1], title: 'Duplicate' },
			null,
			{ id: 'missing-label', order: 2, title: 'Missing label' },
			{ id: 'bad-order', order: '3', title: 'Bad', stepperLabel: 'Bad' },
		])).toEqual([sourceSteps[1]]);
		expect(normalizeWizardSteps(null)).toEqual([]);

		const tree = WizardStepper({ steps: [{ id: '', order: 1 }], activeStepId: '' });
		expect(tree.type).toBe('p');
		expect(tree.props.children).toBe('Wizard progress is unavailable.');
	});
});

describe('WizardStepper scrolling', () => {
	it('centers the active item inside only its own container', () => {
		const scrollTo = vi.fn();
		const container = { clientWidth: 300, scrollTo };
		const active = { offsetLeft: 420, offsetWidth: 100 };

		scrollActiveStep(container, active, false);
		expect(scrollTo).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' });
	});

	it('uses immediate local scrolling for reduced motion and supports a simple fallback', () => {
		const scrollTo = vi.fn();
		scrollActiveStep({ clientWidth: 300, scrollTo }, { offsetLeft: 20, offsetWidth: 100 }, true);
		expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'auto' });

		const container = { clientWidth: 200, scrollLeft: 0 };
		scrollActiveStep(container, { offsetLeft: 250, offsetWidth: 50 }, false);
		expect(container.scrollLeft).toBe(175);
	});
});
