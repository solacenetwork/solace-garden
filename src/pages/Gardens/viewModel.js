import { createGardensService } from '../../services/gardens.js';
import { createLocationsService } from '../../services/locations.js';
import { createGardenTypesService } from '../../services/gardenTypes.js';
import { ValidationError } from '../../storage/errors.js';

const STATUS_LABELS = {
	planned: 'Planned', active: 'Active', completed: 'Completed', archived: 'Archived',
};

export function createGardenReaders(repositories) {
	return {
		gardens: createGardensService(repositories.gardens),
		locations: createLocationsService(repositories.locations),
		types: createGardenTypesService(repositories.gardenTypes),
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

export async function loadGardenOverview({ gardens, locations }) {
	try {
		const [records, sites] = await Promise.all([gardens.list(), locations.list()]);
		const items = [...records].sort((a, b) =>
			b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
		).map((record) => gardenView(record, sites));
		return {
			status: 'ready',
			current: items.filter(({ status }) => status === 'planned' || status === 'active'),
			previous: items.filter(({ status }) => status === 'completed' || status === 'archived'),
		};
	} catch {
		return { status: 'error' };
	}
}

export async function loadGardenDetail({ gardens, locations, types }, id) {
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
		const [site, definitions] = await Promise.all([
			locations.getById(record.locationId), types.list(),
		]);
		return { status: 'ready', garden: gardenView(record, site ? [site] : [], definitions) };
	} catch {
		return { status: 'error' };
	}
}
