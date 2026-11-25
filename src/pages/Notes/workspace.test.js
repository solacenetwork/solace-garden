import { describe, expect, it } from 'vitest';
import { prepareNotesWorkspace } from './workspace.js';

const gardens = [
	{ id: 'garden-b', name: 'Tomatoes', status: 'active' },
	{ id: 'garden-a', name: 'Tomatoes', status: 'planned' },
	{ id: 'garden-c', name: 'Alpine Bed', status: 'completed' },
	{ id: 'garden-d', name: 'Dormant Plot', status: 'archived' },
	{ id: 'garden-empty', name: 'Empty Garden', status: 'active' },
];

const notes = [
	{ id: 'application-old', gardenId: null, text: 'Older general thought', updatedAt: '2026-11-20T12:00:00.000Z' },
	{ id: 'active-old', gardenId: 'garden-b', text: 'Prepare supports', updatedAt: '2026-11-18T12:00:00.000Z' },
	{ id: 'active', gardenId: 'garden-b', text: 'Stake soon', updatedAt: '2026-11-22T12:00:00.000Z' },
	{ id: 'planned', gardenId: 'garden-a', text: 'Order seeds', updatedAt: '2026-11-21T12:00:00.000Z' },
	{ id: 'completed', gardenId: 'garden-c', text: 'Good harvest', updatedAt: '2026-11-23T12:00:00.000Z' },
	{ id: 'archived', gardenId: 'garden-d', text: 'Final record', updatedAt: '2026-11-19T12:00:00.000Z' },
	{ id: 'application-new', gardenId: null, text: 'Newest general thought', updatedAt: '2026-11-24T12:00:00.000Z' },
];

describe('Notes workspace presentation', () => {
	it('groups without mutating associations, includes every lifecycle status, and orders deterministically', () => {
		const original = structuredClone(notes);
		const workspace = prepareNotesWorkspace(notes, [], gardens);
		expect(workspace.applicationNotes.map(({ id }) => id)).toEqual(['application-new', 'application-old']);
		expect(workspace.gardenGroups.map(({ garden }) => [garden.name, garden.id, garden.status])).toEqual([
			['Alpine Bed', 'garden-c', 'completed'],
			['Dormant Plot', 'garden-d', 'archived'],
			['Tomatoes', 'garden-a', 'planned'],
			['Tomatoes', 'garden-b', 'active'],
		]);
		expect(workspace.gardenGroups.some(({ garden }) => garden.id === 'garden-empty')).toBe(false);
		expect(workspace.gardenGroups.find(({ garden }) => garden.id === 'garden-b').notes.map(({ id }) => id)).toEqual(['active', 'active-old']);
		expect(notes).toEqual(original);
	});

	it('filters case-insensitively by Note text and associated Garden name', () => {
		expect(prepareNotesWorkspace(notes, [], gardens, 'HARVEST').gardenGroups.map(({ garden }) => garden.id)).toEqual(['garden-c']);
		const byGarden = prepareNotesWorkspace(notes, [], gardens, 'tomATOES');
		expect(byGarden.gardenGroups.map(({ garden }) => garden.id)).toEqual(['garden-a', 'garden-b']);
		expect(byGarden.gardenGroups.flatMap(({ notes: grouped }) => grouped.map(({ id }) => id))).toEqual(['planned', 'active', 'active-old']);
	});

	it('filters recoverable drafts by their text and recovered Garden association', () => {
		const drafts = [
			{ id: 'new-draft', subjectId: null, isNew: true, text: 'Buy labels', gardenId: null, updatedAt: '2026-11-24T13:00:00.000Z' },
			{ id: 'existing-draft', subjectId: 'archived', isNew: false, text: 'Revised record', gardenId: 'garden-d', updatedAt: '2026-11-24T12:00:00.000Z' },
		];
		expect(prepareNotesWorkspace(notes, drafts, gardens, 'labels').drafts.map(({ id }) => id)).toEqual(['new-draft']);
		expect(prepareNotesWorkspace(notes, drafts, gardens, 'dormant plot').drafts.map(({ id }) => id)).toEqual(['existing-draft']);
		expect(prepareNotesWorkspace(notes, drafts, gardens, 'missing').hasResults).toBe(false);
	});
});
