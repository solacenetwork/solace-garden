import { describe, expect, it, vi } from 'vitest';
import {
	createGardenWizardUrl,
	loadGardenWizardSteps,
	navigateGardenWizardStep,
	resolveGardenWizardLocation,
} from './gardenWizardNavigation.js';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440010';

describe('Garden Wizard navigation adapter', () => {
	it('loads the exact ordered production definition independently of preview fixtures', () => {
		const steps = loadGardenWizardSteps();
		expect(steps.map(({ id }) => id)).toEqual([
			'identity', 'details', 'types', 'dates', 'options',
		]);
		expect(steps).toHaveLength(5);
	});

	it('applies URL precedence and treats an explicit invalid value as recoverable', () => {
		const steps = loadGardenWizardSteps();
		expect(resolveGardenWizardLocation({
			steps, query: { step: 'dates' }, persistedStepId: 'details',
		})).toEqual({ status: 'resolved', stepId: 'dates', source: 'url' });
		expect(resolveGardenWizardLocation({
			steps, query: { step: '' }, persistedStepId: 'details',
		})).toEqual({ status: 'invalid', stepId: '', source: 'url' });
	});

	it('preserves Template and other query parameters while replacing only step', () => {
		const url = createGardenWizardUrl('/gardens/new/wizard/draft', 'details', {
			source: 'template', id: TEMPLATE_ID, step: 'identity', future: 'value',
		});
		expect(url).toBe(
			`/gardens/new/wizard/draft?source=template&id=${TEMPLATE_ID}&future=value&step=details`,
		);
	});

	it.each([
		[false, 'push'],
		[true, 'replace'],
	])('uses the requested %s history policy without a second navigation', (replace) => {
		const route = vi.fn();
		const destination = navigateGardenWizardStep({
			route,
			path: '/gardens/new/wizard/draft',
			query: { source: 'template', id: TEMPLATE_ID },
			stepId: 'types',
			replace,
		});
		expect(route).toHaveBeenCalledOnce();
		expect(route).toHaveBeenCalledWith(destination, replace);
	});

	it('fails invalid production configuration instead of skipping it', () => {
		expect(() => loadGardenWizardSteps([
			{ id: 'identity', order: 10, title: 'Identity', stepperLabel: 'Identity' },
		])).toThrow('exactly 5');
	});
});
