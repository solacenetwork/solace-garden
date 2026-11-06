import { ValidationError } from '../storage/errors.js';

function sortNewestFirst(notes) {
	return [...notes].sort((first, second) =>
		String(second.updatedAt ?? '').localeCompare(String(first.updatedAt ?? '')),
	);
}

export function createNotesService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		async list() {
			return sortNewestFirst(await repository.list());
		},

		getById(id) {
			return repository.getById(id);
		},

		create({ text, gardenId = null }) {
			const timestamp = now();
			return repository.create({
				text,
				gardenId,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		},

		async update(id, changes) {
			const hasText = Object.hasOwn(changes, 'text');
			const hasGardenId = Object.hasOwn(changes, 'gardenId');

			if (!hasText && !hasGardenId) {
				throw new ValidationError(
					'EMPTY_CHANGES',
					'Update requires changed note text or a garden association.',
				);
			}

			const persistedChanges = {
				...(hasText ? { text: changes.text } : {}),
				...(hasGardenId ? { gardenId: changes.gardenId } : {}),
				updatedAt: now(),
			};
			const updated = await repository.update(id, persistedChanges);

			return updated ? persistedChanges : null;
		},

		remove(id) {
			return repository.remove(id);
		},
	});
}

