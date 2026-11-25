function newestFirst(first, second) {
	const updatedOrder = String(second.updatedAt ?? '').localeCompare(String(first.updatedAt ?? ''));
	return updatedOrder || String(first.id ?? '').localeCompare(String(second.id ?? ''));
}

function gardenNameOrder(first, second) {
	const insensitive = first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
	return insensitive || first.name.localeCompare(second.name) || first.id.localeCompare(second.id);
}

function includes(value, query) {
	return String(value ?? '').toLocaleLowerCase().includes(query);
}

export function prepareNotesWorkspace(notes, drafts, gardens, filter = '') {
	const query = filter.trim().toLocaleLowerCase();
	const filtering = query.length > 0;
	const gardenById = new Map(gardens.map((garden) => [garden.id, garden]));
	const matchesNote = (note) => {
		if (!filtering) return true;
		const gardenName = gardenById.get(note.gardenId)?.name;
		return includes(note.text, query) || includes(gardenName, query);
	};
	const matchesDraft = (draft) => {
		if (!filtering) return true;
		const gardenName = gardenById.get(draft.gardenId)?.name;
		return includes(draft.text, query) || includes(gardenName, query);
	};

	const visibleNotes = notes.filter(matchesNote).sort(newestFirst);
	const applicationNotes = visibleNotes.filter((note) => note.gardenId === null);
	const notesByGarden = new Map();
	for (const note of visibleNotes) {
		if (!gardenById.has(note.gardenId)) continue;
		const grouped = notesByGarden.get(note.gardenId) ?? [];
		grouped.push(note);
		notesByGarden.set(note.gardenId, grouped);
	}
	const gardenGroups = gardens
		.filter((garden) => notesByGarden.has(garden.id))
		.sort(gardenNameOrder)
		.map((garden) => ({ garden, notes: notesByGarden.get(garden.id) }));
	const visibleDrafts = drafts.filter(matchesDraft).sort(newestFirst);

	return {
		filtering,
		applicationNotes,
		gardenGroups,
		drafts: visibleDrafts,
		hasResults: visibleNotes.length > 0 || visibleDrafts.length > 0,
	};
}
