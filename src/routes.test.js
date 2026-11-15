import { exec } from 'preact-iso/router';
import { describe, expect, it } from 'vitest';
import {
	applicationRoutes,
	findRoute,
	findRouteById,
	routeCatalog,
	getSettingsHref,
	getSettingsReturnPath,
} from './routes.js';

const NOTE_UUID = 'ad4a4e9a-1db0-4e87-8fe1-f197a9d52c01';

function resolveRoute(path) {
	for (const route of applicationRoutes) {
		const match = exec(path, route.path, { params: {} });
		if (match) {
			return { route, params: match.params };
		}
	}

	return null;
}

describe('application routes', () => {
	it('resolves Garden overview and UUID detail routes without shadowing static workspaces', () => {
		expect(resolveRoute('/gardens')).toMatchObject({ route: { view: 'gardens' }, params: {} });
		expect(resolveRoute('/gardens/new')).toMatchObject({ route: { view: 'garden-new' }, params: {} });
		expect(resolveRoute('/gardens/new/wizard')).toMatchObject({ route: { view: 'garden-wizard-new' }, params: {} });
		expect(resolveRoute('/gardens/new/advanced')).toMatchObject({ route: { view: 'garden-advanced-new' }, params: {} });
		expect(resolveRoute(`/gardens/new/wizard/${NOTE_UUID}`)).toMatchObject({ route: { view: 'garden-wizard' }, params: { draftId: NOTE_UUID } });
		expect(resolveRoute(`/gardens/new/advanced/${NOTE_UUID}`)).toMatchObject({ route: { view: 'garden-advanced' }, params: { draftId: NOTE_UUID } });
		expect(resolveRoute(`/gardens/${NOTE_UUID}`)).toMatchObject({
			route: { view: 'garden-detail' }, params: { id: NOTE_UUID },
		});
		expect(resolveRoute(`/gardens/${NOTE_UUID}/edit`)).toMatchObject({
			route: { view: 'garden-edit' }, params: { id: NOTE_UUID },
		});
		expect(findRoute(`/gardens/${NOTE_UUID}`)).toMatchObject({ id: 'gardens' });
		expect(findRoute(`/gardens/${NOTE_UUID}/edit`)).toMatchObject({ id: 'gardens' });
		expect(findRoute('/gardens/new')).toMatchObject({ id: 'gardens' });
		expect(getSettingsHref(`/gardens/${NOTE_UUID}`)).toBe('/settings?ref=gardens');
		expect(getSettingsReturnPath('gardens')).toBe('/gardens');
		for (const path of ['/gardens/one/extra', '/gardens/one/edit/extra', '/gardenstuff', '/unknown']) {
			expect(resolveRoute(path)).toBeNull();
			expect(findRoute(path)).toBeUndefined();
		}
	});

	it('resolves both list URLs to the shared Lists workspace', () => {
		expect(resolveRoute('/tasks')).toMatchObject({
			route: { path: '/tasks', view: 'lists' },
		});
		expect(resolveRoute('/wishlist')).toMatchObject({
			route: { path: '/wishlist', view: 'lists' },
		});
		expect(findRoute('/tasks')).toMatchObject({ id: 'tasks' });
		expect(findRoute('/wishlist')).toMatchObject({ id: 'wishlist' });
	});

	it('resolves the Saved Notes list route', () => {
		expect(resolveRoute('/notes')).toMatchObject({
			route: { path: '/notes', view: 'notes' },
			params: {},
		});
	});

	it('resolves the static new Note route before the Note ID route', () => {
		expect(resolveRoute('/notes/new')).toMatchObject({
			route: { path: '/notes/new', view: 'note-new' },
			params: {},
		});
	});

	it('resolves a stable new draft URL independently of saved Note IDs', () => {
		expect(resolveRoute(`/notes/new/${NOTE_UUID}`)).toMatchObject({
			route: { path: '/notes/new/:draftId', view: 'note-new-draft' },
			params: { draftId: NOTE_UUID },
		});
	});

	it('passes the existing Note UUID through the parameter route', () => {
		expect(resolveRoute(`/notes/${NOTE_UUID}`)).toMatchObject({
			route: { path: '/notes/:id', view: 'note-edit' },
			params: { id: NOTE_UUID },
		});
	});

	it('keeps editor URLs associated with the Notes workspace', () => {
		expect(findRoute('/notes/new')).toMatchObject({ id: 'notes' });
		expect(findRoute(`/notes/${NOTE_UUID}`)).toMatchObject({ id: 'notes' });
	});

	it('resolves the Locations workspace route', () => {
		expect(resolveRoute('/locations')).toMatchObject({
			route: { path: '/locations', view: 'locations' },
		});
	});

	it('resolves the Templates workspace to its management page', () => {
		expect(resolveRoute('/templates')).toMatchObject({
			route: { path: '/templates', view: 'templates' },
			params: {},
		});
		expect(findRoute('/templates')).toMatchObject({ id: 'templates' });
	});
});


describe('destination registry and route contracts', () => {
	const destinations = [
		['home', '/', 'home'],
		['plants', '/plants', 'plants'],
		['harvest', '/harvest', undefined],
		['photos', '/photos', undefined],
		['tasks', '/tasks', 'lists'],
		['wishlist', '/wishlist', 'lists'],
		['calendar', '/calendar', undefined],
		['notes', '/notes', 'notes'],
		['gardens', '/gardens', 'gardens'],
		['journal', '/journal', undefined],
		['search', '/search', undefined],
		['templates', '/templates', 'templates'],
		['locations', '/locations', 'locations'],
		['settings', '/settings', 'settings'],
		['help', '/help', 'help'],
		['about', '/about', 'about'],
	];

	it.each(destinations)('preserves the %s static destination', (id, path, view) => {
		const destination = findRouteById(id);
		expect(destination).toMatchObject({ id, path });
		expect(destination.view).toBe(view);
		expect(resolveRoute(path)).toEqual({ route: destination, params: {} });
		expect(findRoute(path)).toBe(destination);
		expect(destination).not.toHaveProperty('section');
		expect(destination).not.toHaveProperty('navigationGroup');
	});

	it('preserves the complete route registration order', () => {
		expect(applicationRoutes.map(({ path }) => path)).toEqual([
			'/notes/new/:draftId', '/notes/new', '/notes/:id',
			'/gardens/new/wizard/:draftId', '/gardens/new/advanced/:draftId',
			'/gardens/new/wizard', '/gardens/new/advanced', '/gardens/new',
			'/gardens/:id/edit', '/gardens/:id',
			...destinations.map(([, path]) => path),
		]);
		expect(new Set(applicationRoutes.map(({ path }) => path)).size).toBe(applicationRoutes.length);
		expect(new Set(routeCatalog.map(({ id }) => id)).size).toBe(routeCatalog.length);
	});

	it.each(['/unknown', '/welcome', '/lists', '/notes/one/extra', '/gardens/one/edit/extra'])(
		'leaves %s unmatched for the existing default 404 route', (path) => {
			expect(resolveRoute(path)).toBeNull();
		},
	);

	it('keeps permissive context lookup separate from actual route matching', () => {
		for (const [path, id] of [
			['/notes/one/extra', 'notes'],
			['/gardens/new/wizard/one/extra', 'gardens'],
		]) {
			expect(resolveRoute(path)).toBeNull();
			expect(findRoute(path)).toBe(findRouteById(id));
		}
		expect(findRoute('/unknown')).toBeUndefined();
	});

	it('returns undefined for missing or invalid destination IDs', () => {
		for (const id of [undefined, null, '', 'unknown', 'garden-new', 'toString']) {
			expect(findRouteById(id)).toBeUndefined();
		}
	});

	it.each(destinations)('preserves Settings references and canonical return paths for %s', (id, path) => {
		expect(getSettingsHref(path)).toBe(`/settings?ref=${id === 'settings' ? 'home' : id}`);
		expect(getSettingsReturnPath(id)).toBe(id === 'settings' ? '/' : path);
	});

	it('returns editor origins to their canonical destinations', () => {
		for (const path of [
			'/gardens/new', '/gardens/new/wizard', '/gardens/new/advanced',
			`/gardens/new/wizard/${NOTE_UUID}`, `/gardens/new/advanced/${NOTE_UUID}`,
			`/gardens/${NOTE_UUID}`, `/gardens/${NOTE_UUID}/edit`,
		]) {
			expect(getSettingsHref(path)).toBe('/settings?ref=gardens');
		}
		for (const path of ['/notes/new', `/notes/new/${NOTE_UUID}`, `/notes/${NOTE_UUID}`]) {
			expect(getSettingsHref(path)).toBe('/settings?ref=notes');
		}
		expect(getSettingsReturnPath('notes')).toBe('/notes');
		expect(getSettingsReturnPath('gardens')).toBe('/gardens');
	});

	it('falls back to Home for unknown origins and missing, invalid or self references', () => {
		expect(getSettingsHref('/unknown')).toBe('/settings?ref=home');
		for (const reference of [undefined, null, '', 'unknown', 'settings', '/notes', 'toString']) {
			expect(getSettingsReturnPath(reference)).toBe('/');
		}
	});
});
