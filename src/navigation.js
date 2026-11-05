export const routeCatalog = [
	{
		path: '/',
		label: 'Home',
		icon: 'house-door',
		description: 'Choose a SOLACE Garden workspace.',
		section: 'home',
		navigationGroup: 'home',
		view: 'home',
	},
	{
		path: '/plants',
		label: 'Plants',
		detail: 'Update Plants',
		icon: 'flower2',
		description: 'Review plant groups and record growing progress.',
		section: 'primary',
		navigationGroup: 'activities',
		view: 'plants',
	},
	{
		path: '/harvest',
		label: 'Harvest',
		detail: 'Record a harvest',
		icon: 'basket2',
		description: 'Record what you picked and review harvest history.',
		section: 'primary',
		navigationGroup: 'activities',
	},
	{
		path: '/photos',
		label: 'Photos',
		detail: 'Open Gallery',
		icon: 'camera',
		description: 'Capture garden photos and browse the Gallery.',
		section: 'primary',
		navigationGroup: 'activities',
	},
	{
		path: '/tasks',
		label: 'Tasks',
		detail: 'View garden tasks',
		icon: 'check2-square',
		description: 'Keep track of garden to-dos and shopping needs.',
		section: 'primary',
		navigationGroup: 'activities',
	},
	{
		path: '/calendar',
		label: 'Calendar',
		detail: 'View schedule',
		icon: 'calendar3',
		description: 'See upcoming garden events and reminders.',
		section: 'primary',
		navigationGroup: 'activities',
	},
	{
		path: '/notes',
		label: 'Notes',
		detail: 'Open notes',
		icon: 'journal-text',
		description: 'Capture a quick observation while it is fresh.',
		section: 'primary',
		navigationGroup: 'activities',
	},
	{
		path: '/gardens',
		label: 'Gardens',
		icon: 'tree',
		description: 'Manage current and previous gardens and growing projects.',
		section: 'secondary',
		navigationGroup: 'home',
	},
	{
		path: '/journal',
		label: 'Journal',
		icon: 'journal-richtext',
		description: 'Create and browse private, dated garden journal entries.',
		section: 'secondary',
		navigationGroup: 'workspaces',
	},
	{
		path: '/search',
		label: 'Search',
		icon: 'search',
		description:
			'Find gardens, plant groups, lists, calendar events, and journal entries.',
		section: 'secondary',
		navigationGroup: 'workspaces',
	},
	{
		path: '/templates',
		label: 'Templates',
		icon: 'copy',
		description: 'Manage reusable starting points for new gardens.',
		section: 'secondary',
		navigationGroup: 'workspaces',
	},
	{
		path: '/locations',
		label: 'Locations',
		icon: 'geo-alt',
		description: 'Manage the physical locations associated with your gardens.',
		section: 'secondary',
		navigationGroup: 'workspaces',
	},
	{
		path: '/settings',
		label: 'Settings',
		icon: 'gear',
		description:
			'Adjust SOLACE Garden preferences and local application options.',
		section: 'secondary',
		navigationGroup: 'settings',
		view: 'settings',
	},
];

export const navigationGroups = [
	{ id: 'home', label: 'Home and gardens' },
	{ id: 'activities', label: 'Garden activities' },
	{ id: 'workspaces', label: 'Other workspaces' },
	{ id: 'settings', label: 'Settings' },
];

export const primaryActions = routeCatalog.filter(
	({ section }) => section === 'primary',
);

export const secondaryDestinations = routeCatalog.filter(
	({ section }) => section === 'secondary',
);

export const workspaceRoutes = routeCatalog.filter(({ path }) => path !== '/');

export function findRoute(path) {
	return routeCatalog.find((route) => route.path === path);
}
