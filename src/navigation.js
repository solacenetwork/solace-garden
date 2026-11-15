import { findRouteById } from './routes.js';

// Placement is explicit: registering a destination does not add it to a menu.
export const navigationGroups = [
	{ id: 'home', label: 'Home and gardens', destinationIds: ['home', 'gardens'] },
	{
		id: 'activities',
		label: 'Garden activities',
		destinationIds: ['plants', 'harvest', 'photos', 'tasks', 'wishlist', 'calendar', 'notes'],
	},
	{
		id: 'workspaces',
		label: 'Other workspaces',
		destinationIds: ['journal', 'search', 'templates', 'locations'],
	},
	{ id: 'settings', label: 'Settings', destinationIds: ['settings'] },
	{ id: 'other', label: 'Other Links', destinationIds: ['help', 'about'] },
];

export const primaryActionIds = ['plants', 'harvest', 'photos', 'tasks', 'calendar', 'notes'];
export const secondaryDestinationIds = [
	'wishlist', 'gardens', 'journal', 'search', 'templates', 'locations', 'settings', 'help', 'about',
];

export const primaryActions = primaryActionIds.map(findRouteById);
export const secondaryDestinations = secondaryDestinationIds.map(findRouteById);

// Shared shell placement; legacy Home configuration above remains independent.
export const standardPrimaryIds = ['gardens', 'journal', 'photos', 'plants'];
export const globalToolIds = ['tasks', 'notes', 'wishlist', 'calendar'];
export const moreDestinationIds = ['help', 'about', 'settings'];
