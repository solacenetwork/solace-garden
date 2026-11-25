import { describe, expect, it, vi } from 'vitest';
import { GardenAssociationSelector, gardenAssociationLabel } from './GardenAssociationSelector.jsx';

function nodes(node) {
	if (node == null || typeof node === 'boolean') return [];
	if (Array.isArray(node)) return node.flatMap(nodes);
	if (typeof node !== 'object') return [node];
	if (typeof node.type === 'function') return nodes(node.type(node.props));
	return [node, ...nodes(node.props.children)];
}

describe('GardenAssociationSelector', () => {
	it('uses UUID values and distinguishing context for duplicate names', () => {
		const gardens = [
			{ id: 'first', name: 'Tomatoes', status: 'active', locationId: 'home' },
			{ id: 'second', name: 'Tomatoes', status: 'completed', locationId: 'plot' },
		];
		const locations = [{ id: 'home', name: 'Home' }, { id: 'plot', name: 'Community Plot' }];
		const tree = GardenAssociationSelector({ id: 'garden', value: 'second', gardens, locations, onChange: vi.fn() });
		const select = nodes(tree).find((node) => node.type === 'select');
		expect(select.props.value).toBe('second');
		expect(nodes(tree).filter((node) => node.type === 'option').map(({ props }) => props.value)).toEqual(['', 'first', 'second']);
		expect(gardenAssociationLabel(gardens[0], locations)).toBe('Tomatoes — Active, Home');
	});

	it('offers No Garden and explains an empty collection', () => {
		const tree = GardenAssociationSelector({ id: 'garden', gardens: [], onChange: vi.fn() });
		expect(nodes(tree).filter((node) => typeof node === 'string').join(' ')).toContain('No Garden');
		expect(nodes(tree).filter((node) => typeof node === 'string').join(' ')).toContain('No Gardens are available');
	});

	it('associates Garden validation feedback with the invalid selector', () => {
		const tree = GardenAssociationSelector({
			id: 'list-garden',
			gardens: [],
			onChange: vi.fn(),
			error: 'The selected garden does not exist.',
		});
		const select = nodes(tree).find((node) => node.type === 'select');
		const feedback = nodes(tree).find((node) => node.props?.id === 'list-garden-error');

		expect(select.props.class).toContain('is-invalid');
		expect(select.props['aria-invalid']).toBe('true');
		expect(select.props['aria-describedby']).toBe('list-garden-error');
		expect(nodes(feedback).filter((node) => typeof node === 'string').join(' '))
			.toContain('The selected garden does not exist.');
	});
});
