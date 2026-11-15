import { exec } from 'preact-iso/router';
import { describe, expect, it, vi } from 'vitest';
import { applicationRoutes, findRouteById, routeCatalog } from './routes.js';
import {
	navigationGroups,
	standardPrimaryIds,
	globalToolIds,
	moreDestinationIds,
	primaryActionIds,
	primaryActions,
	secondaryDestinationIds,
	secondaryDestinations,
} from './navigation.js';

// Register a test-only destination without changing any navigation definitions.
vi.mock('./routes.js', async (importOriginal) => {
	const routes = await importOriginal();
	const hidden = { id: 'test-hidden', path: '/test-hidden', label: 'Hidden destination' };
	const catalog = [...routes.routeCatalog, hidden];
	return {
		...routes,
		routeCatalog: catalog,
		applicationRoutes: [...routes.applicationRoutes, hidden],
		findRouteById: (id) => catalog.find((route) => route.id === id),
	};
});

describe('navigation presentation', () => {
	it('preserves group IDs, labels, membership and ordering', () => {
		expect(navigationGroups).toEqual([
			{ id: 'home', label: 'Home and gardens', destinationIds: ['home', 'gardens'] },
			{
				id: 'activities', label: 'Garden activities',
				destinationIds: ['plants', 'harvest', 'photos', 'tasks', 'wishlist', 'calendar', 'notes'],
			},
			{
				id: 'workspaces', label: 'Other workspaces',
				destinationIds: ['journal', 'search', 'templates', 'locations'],
			},
			{ id: 'settings', label: 'Settings', destinationIds: ['settings'] },
			{ id: 'other', label: 'Other Links', destinationIds: ['help', 'about'] },
		]);
	});

	it('keeps six Simple Mode actions while exposing Wish List elsewhere', () => {
		expect(primaryActions.map(({ id }) => id)).toEqual([
			'plants',
			'harvest',
			'photos',
			'tasks',
			'calendar',
			'notes',
		]);
		expect(secondaryDestinations).toContainEqual(
			expect.objectContaining({ id: 'wishlist', path: '/wishlist' }),
		);
	});

	it('preserves secondary destination ordering', () => {
		expect(secondaryDestinations.map(({ id }) => id)).toEqual([
			'wishlist', 'gardens', 'journal', 'search', 'templates', 'locations', 'settings', 'help', 'about',
		]);
	});

	it('resolves every reference to the original destination metadata', () => {
		const ids = [
			...navigationGroups.flatMap(({ destinationIds }) => destinationIds),
			...primaryActionIds,
			...secondaryDestinationIds,
		];
		for (const id of ids) {
			expect(findRouteById(id), id).toBeDefined();
		}
		for (const [ids, destinations] of [
			[primaryActionIds, primaryActions],
			[secondaryDestinationIds, secondaryDestinations],
		]) {
			expect(destinations).toHaveLength(ids.length);
			ids.forEach((id, index) => expect(destinations[index]).toBe(findRouteById(id)));
		}
	});

	it('has no duplicate destination IDs within any group', () => {
		for (const { destinationIds } of navigationGroups) {
			expect(new Set(destinationIds).size).toBe(destinationIds.length);
		}
	});

	it('registers destinations independently of navigation membership', () => {
		const hidden = routeCatalog.find(({ id }) => id === 'test-hidden');
		expect(hidden).toBeDefined();
		expect(applicationRoutes.find((route) => exec('/test-hidden', route.path, { params: {} }))).toBe(hidden);
		expect(navigationGroups.flatMap(({ destinationIds }) => destinationIds)).not.toContain(hidden.id);
		expect(primaryActionIds).not.toContain(hidden.id);
		expect(secondaryDestinationIds).not.toContain(hidden.id);
	});
});


describe('shared shell navigation', () => {
	it('defines approved primary, global tool and support IDs independently of Home', () => {
		expect(standardPrimaryIds).toEqual(['gardens', 'journal', 'photos', 'plants']);
		expect(globalToolIds).toEqual(['tasks', 'notes', 'wishlist', 'calendar']);
		expect(moreDestinationIds).toEqual(['help', 'about', 'settings']);
		for (const id of [...standardPrimaryIds, ...globalToolIds, ...moreDestinationIds]) {
			expect(findRouteById(id), id).toBeDefined();
		}
	});
});
