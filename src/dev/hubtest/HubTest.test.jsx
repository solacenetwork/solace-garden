import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
	expanded: false,
	setExpanded: vi.fn(),
}));

vi.mock('../../components/CardCarousel.jsx', () => ({
	CardCarousel: ({ children, ...props }) => (
		<div data-card-carousel="true" {...props}>{children}</div>
	),
}));

vi.mock('preact/hooks', () => ({
	useState: () => [harness.expanded, harness.setExpanded],
}));

import { CardCarousel } from '../../components/CardCarousel.jsx';
import { gardenSamples } from '../carousel/CarouselPoc.jsx';
import { GardenCollection } from './HubTest.jsx';

function nodes(node, resolveComponents = false) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap((child) => nodes(child, resolveComponents));
	if (resolveComponents && typeof node.type === 'function') {
		return nodes(node.type(node.props), resolveComponents);
	}
	return [node, ...nodes(node.props?.children, resolveComponents)];
}

function button(tree) {
	return nodes(tree).find(({ type }) => type === 'button');
}

function gardenLinks(tree) {
	return nodes(tree, true).filter(({ type, props }) => (
		type === 'a' && props.class === 'prototype-card prototype-garden-card'
	));
}

beforeEach(() => {
	harness.expanded = false;
	harness.setExpanded.mockReset();
});

describe('Expandable Garden collection', () => {
	it('defaults to the shared filmstrip with an accessible View All control', () => {
		const tree = GardenCollection();
		const carousel = nodes(tree).find(({ type }) => type === CardCarousel);
		const toggle = button(tree);

		expect(carousel).toBeTruthy();
		expect(carousel.props).toMatchObject({
			id: 'hubtest-current-gardens-carousel',
			label: 'Current Gardens',
		});
		expect(nodes(tree).some(({ props }) => props.class === 'hubtest-garden-grid')).toBe(false);
		expect(toggle.props.children).toBe('View All');
		expect(toggle.props['aria-expanded']).toBe(false);
		expect(toggle.props['aria-controls']).toBe('hubtest-current-gardens-collection');
	});

	it('switches View All to the complete responsive grid', () => {
		const compact = GardenCollection();
		button(compact).props.onClick();
		expect(harness.setExpanded).toHaveBeenCalledOnce();
		expect(harness.setExpanded.mock.calls[0][0](false)).toBe(true);

		harness.expanded = true;
		const expanded = GardenCollection();
		expect(nodes(expanded).some(({ type }) => type === CardCarousel)).toBe(false);
		expect(nodes(expanded).find(({ props }) => props.class === 'hubtest-garden-grid')).toBeTruthy();
		expect(button(expanded).props.children).toBe('Collapse');
		expect(button(expanded).props['aria-expanded']).toBe(true);
		expect(gardenLinks(expanded)).toHaveLength(gardenSamples.length);
	});

	it('restores the ordinary filmstrip when Collapse is activated', () => {
		harness.expanded = true;
		const expanded = GardenCollection();
		button(expanded).props.onClick();

		expect(harness.setExpanded.mock.calls[0][0](true)).toBe(false);
		harness.expanded = false;
		const compact = GardenCollection();
		expect(nodes(compact).some(({ type }) => type === CardCarousel)).toBe(true);
		expect(button(compact).props.children).toBe('View All');
	});

	it('renders the same Garden items and card links in both presentations', () => {
		const compactIds = gardenLinks(GardenCollection()).map(({ props }) => props.href);
		harness.expanded = true;
		const expandedIds = gardenLinks(GardenCollection()).map(({ props }) => props.href);

		expect(compactIds).toEqual(expandedIds);
		expect(compactIds).toEqual(gardenSamples.map(({ id }) => `#prototype-${id}`));
	});
});
