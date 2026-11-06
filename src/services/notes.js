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

		create({ text, gardenId = null }, { draftId } = {}) {
			const timestamp = now();
			const record = {
				text,
				gardenId,
				createdAt: timestamp,
				updatedAt: timestamp,
			};
			return draftId
				? repository.createFromDraft(record, draftId)
				: repository.create(record);
		},

		async update(id, changes, { draftId } = {}) {
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
			const updated = draftId
				? await repository.updateFromDraft(id, persistedChanges, draftId)
				: await repository.update(id, persistedChanges);

			return updated ? persistedChanges : null;
		},

		remove(id) {
			return repository.remove(id);
		},
	});
}

export function createNoteDraftsService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		getById(id) {
			return repository.getById(id);
		},

		getForNote(noteId) {
			return repository.getForSubject('note', noteId);
		},

		async list() {
			return (await repository.listByKind('note')).sort((first, second) =>
				second.updatedAt.localeCompare(first.updatedAt),
			);
		},

		save({ id, noteId = null, text, createdAt }) {
			const timestamp = now();
			return repository.save({
				id,
				kind: 'note',
				subjectId: noteId,
				isNew: noteId === null,
				text,
				createdAt: createdAt ?? timestamp,
				updatedAt: timestamp,
			});
		},

		remove(id) {
			return repository.remove(id);
		},
	});
}

