import { exec } from 'preact-iso/router';
import { describe, expect, it } from 'vitest';
import { applicationRoutes, findRoute } from './navigation.js';

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

describe('Notes application routes', () => {
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
});
