import { createGardensService } from '../../services/gardens.js';
import { createLocationsService } from '../../services/locations.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { createGardenDraftsService } from '../../services/gardenDrafts.js';
import { createNotesService } from '../../services/notes.js';
import { createListItemsService } from '../../services/listItems.js';
import { ValidationError } from '../../storage/errors.js';

const STATUS_LABELS = {
	planned: 'Planned', active: 'Active', completed: 'Completed', archived: 'Archived',
};

export function createGardenReaders(repositories) {
	return {
		gardens: createGardensService(repositories.gardens),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
		drafts: createGardenDraftsService(repositories.drafts),
		notes: createNotesService(repositories.notes),
		lists: createListItemsService(repositories.listItems),
	};
}

function gardenView(record, locations, types = []) {
	return {
		...record,
		href: `/gardens/${record.id}`,
		statusLabel: STATUS_LABELS[record.status] ?? 'Unknown status',
		locationName: locations.find(({ id }) => id === record.locationId)?.name ?? 'Location unavailable',
		typeNames: record.typeIds.map((id) => types.find((type) => type.id === id)?.name ?? 'Type unavailable'),
	};
}

export async function loadGardenOverview({ gardens, locations, drafts }) {
	try {
		const [records, sites, unfinished] = await Promise.all([gardens.list(), locations.list(), drafts.list()]);
		const items = [...records].sort((a, b) =>
			b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
		).map((record) => gardenView(record, sites));
		return {
			status: 'ready',
			current: items.filter(({ status }) => status === 'planned' || status === 'active'),
			previous: items.filter(({ status }) => status === 'completed' || status === 'archived'),
			drafts: unfinished.map((draft) => ({
				...draft,
				label: draft.fields.name.trim() || 'Untitled Garden',
				href: `/gardens/new/${draft.preferredEditor}/${draft.id}`,
			})),
		};
	} catch {
		return { status: 'error' };
	}
}

export async function loadGardenDetail({ gardens, locations, types, notes, lists }, id) {
	try {
		let record;
		try {
			record = await gardens.getById(id);
		} catch (error) {
			if (error instanceof ValidationError && error.code === 'INVALID_RECORD_ID') {
				return { status: 'not-found' };
			}
			throw error;
		}
		if (!record) return { status: 'not-found' };
		const [site, definitions, noteRecords, tasks, wishlist] = await Promise.all([
			locations.getById(record.locationId), types.list(), notes.list(),
			lists.list('task'), lists.list('wishlist'),
		]);
		return {
			status: 'ready',
			garden: gardenView(record, site ? [site] : [], definitions),
			associations: {
				notes: noteRecords.filter(({ gardenId }) => gardenId === id),
				tasks: tasks.filter(({ gardenId }) => gardenId === id),
				wishlist: wishlist.filter(({ gardenId }) => gardenId === id),
			},
		};
	} catch {
		return { status: 'error' };
	}
}
