import { ValidationError } from '../storage/errors.js';
import {
	DEFAULT_LOCATION_ID,
	normalizeHardinessZone,
	normalizeLocationName,
} from '../storage/locationValidation.js';

export { DEFAULT_LOCATION_ID };

export function createLocationsService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		list() {
			return repository.list();
		},

		getById(id) {
			return repository.getById(id);
		},

		ensureDefault() {
			const timestamp = now();
			return repository.ensureSystemDefault({
				id: DEFAULT_LOCATION_ID,
				name: 'Default',
				hardinessZone: null,
				isSystemDefault: true,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		},

		async create({ name, hardinessZone = null }) {
			const timestamp = now();
			return repository.create({
				name: normalizeLocationName(name),
				hardinessZone: normalizeHardinessZone(hardinessZone),
				isSystemDefault: false,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		},

		async update(id, changes) {
			const allowedFields = ['name', 'hardinessZone'];
			const unsupported = Object.keys(changes).find(
				(field) => !allowedFields.includes(field),
			);
			if (unsupported) {
				throw new ValidationError(
					'UNSUPPORTED_LOCATION_FIELD',
					`${unsupported} cannot be changed.`,
					{ field: unsupported },
				);
			}
			if (Object.keys(changes).length === 0) {
				throw new ValidationError(
					'EMPTY_CHANGES',
					'Location update requires at least one changed field.',
					{ field: 'location' },
				);
			}

			const normalized = {
				...(Object.hasOwn(changes, 'name')
					? { name: normalizeLocationName(changes.name) }
					: {}),
				...(Object.hasOwn(changes, 'hardinessZone')
					? { hardinessZone: normalizeHardinessZone(changes.hardinessZone) }
					: {}),
				updatedAt: now(),
			};
			return repository.update(id, normalized);
		},

		remove(id) {
			return repository.remove(id);
		},
	});
}
