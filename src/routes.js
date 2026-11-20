export const routeCatalog = [
	{
		id: 'home',
		path: '/',
		label: 'Home',
		icon: 'house-door',
		description: 'Choose a SOLACE Garden workspace.',
		view: 'home',
	},
	{
		id: 'plants',
		path: '/plants',
		label: 'Plants',
		detail: 'Update Plants',
		icon: 'flower2',
		description: 'Review plant groups and record growing progress.',
		view: 'plants',
	},
	{
		id: 'harvest',
		path: '/harvest',
		label: 'Harvest',
		detail: 'Record a harvest',
		icon: 'basket2',
		description: 'Record what you picked and review harvest history.',
	},
	{
		id: 'photos',
		path: '/photos',
		label: 'Photos',
		detail: 'Open Gallery',
		icon: 'camera',
		description: 'Capture garden photos and browse the Gallery.',
	},
	{
		id: 'tasks',
		path: '/tasks',
		label: 'Tasks',
		detail: 'View garden tasks',
		icon: 'check2-square',
		description: 'Keep track of garden to-dos and shopping needs.',
		view: 'lists',
	},
	{
		id: 'wishlist',
		path: '/wishlist',
		label: 'Wish List',
		icon: 'bag-heart',
		description: 'Track garden supplies and equipment you may want to purchase.',
		view: 'lists',
	},
	{
		id: 'calendar',
		path: '/calendar',
		label: 'Calendar',
		detail: 'View schedule',
		icon: 'calendar3',
		description: 'See upcoming garden events and reminders.',
	},
	{
		id: 'notes',
		path: '/notes',
		label: 'Notes',
		detail: 'Open notes',
		icon: 'journal-text',
		description: 'Capture a quick observation while it is fresh.',
		view: 'notes',
	},
	{
		id: 'gardens',
		path: '/gardens',
		label: 'Gardens',
		icon: 'leaf-fill',
		description: 'Manage current and previous gardens and growing projects.',
		view: 'gardens',
	},
	{
		id: 'journal',
		path: '/journal',
		label: 'Journal',
		icon: 'journal-richtext',
		description: 'Create and browse private, dated garden journal entries.',
	},
	{
		id: 'search',
		path: '/search',
		label: 'Search',
		icon: 'search',
		description:
			'Find gardens, plant groups, lists, calendar events, and journal entries.',
	},
	{
		id: 'templates',
		path: '/templates',
		label: 'Templates',
		icon: 'copy',
		description: 'Manage reusable starting points for new gardens.',
		view: 'templates',
	},
	{
		id: 'locations',
		path: '/locations',
		label: 'Locations',
		icon: 'geo-alt',
		description: 'Manage the physical locations associated with your gardens.',
		view: 'locations',
	},
	{
		id: 'settings',
		path: '/settings',
		label: 'Settings',
		icon: 'gear',
		description:
			'Adjust SOLACE Garden preferences and local application options.',
		view: 'settings',
	},
	{
		id: 'welcome',
		path: '/welcome',
		label: 'Welcome',
		icon: 'stars',
		description: 'Learn how SOLACE Garden can help organize your growing season.',
		view: 'welcome',
	},
	{
		id: 'help',
		path: '/help',
		label: 'Help',
		icon: 'question-circle',
		description:
			'Get help for the SOLACE Garden application',
		view: 'help',
	},
	{
		id: 'about',
		path: '/about',
		label: 'About',
		icon: 'emoji-smile',
		description:
			'About the SOLACE Garden application',
		view: 'about',
	},
];

// Create/editor routes are ordered before parameter routes so "new" is always
// treated as a create view rather than as a record ID. Destination registration
// is independent of navigation placement.
export const applicationRoutes = [
	{ path: '/notes/new/:draftId', view: 'note-new-draft' },
	{ path: '/notes/new', view: 'note-new' },
	{ path: '/notes/:id', view: 'note-edit' },
	{ path: '/gardens/new/wizard/:draftId', view: 'garden-wizard' },
	{ path: '/gardens/new/advanced/:draftId', view: 'garden-advanced' },
	{ path: '/gardens/new/wizard', view: 'garden-wizard-new' },
	{ path: '/gardens/new/advanced', view: 'garden-advanced-new' },
	{ path: '/gardens/new/quickstart', view: 'garden-quickstart' },
	{ path: '/gardens/new', view: 'garden-new' },
	{ path: '/gardens/drafts', view: 'garden-drafts' },
	{ path: '/gardens/:id/edit', view: 'garden-edit' },
	{ path: '/gardens/:id', view: 'garden-detail' },
	...routeCatalog,
];

export function findRoute(path) {
	return routeCatalog.find((route) => route.path === path) ?? (
		path.startsWith('/notes/')
			? routeCatalog.find((route) => route.id === 'notes')
			: /^\/gardens\/new(?:\/|$)/.test(path) || /^\/gardens\/[^/]+(?:\/edit)?\/?$/.test(path)
				? routeCatalog.find((route) => route.id === 'gardens')
				: undefined
	);
}

export function findRouteById(id) {
	return routeCatalog.find((route) => route.id === id);
}

export function getSettingsHref(originPath) {
	const origin = findRoute(originPath);
	const returnRoute = origin && origin.id !== 'settings'
		? origin
		: findRouteById('home');

	return `/settings?ref=${encodeURIComponent(returnRoute.id)}`;
}

export function getSettingsReturnPath(reference) {
	const route = findRouteById(reference);

	return route && route.id !== 'settings' ? route.path : '/';
}
