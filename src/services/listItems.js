import { ValidationError } from '../storage/errors.js';
import { validateListItemKind } from '../storage/listItemValidation.js';

export function resolveListKind(path) {
	return path === '/wishlist' ? 'wishlist' : 'task';
}

export function createListItemsService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		list(kind) {
			validateListItemKind(kind);
			return repository.list(kind);
		},

		getById(id) {
			return repository.getById(id);
		},

		async create(kind, input) {
			validateListItemKind(kind);
			const {
				text,
				gardenId = null,
				quantity = null,
				notes = null,
				url = null,
			} = input;
			const wishListField = ['quantity', 'notes', 'url'].find(
				(field) => kind === 'task' && Object.hasOwn(input, field),
			);
			if (wishListField) {
				throw new ValidationError(
					'TASK_WISHLIST_FIELD',
					`${wishListField} is available only for Wish List items.`,
					{ field: wishListField },
				);
			}

			const existing = await repository.list(kind);
			const timestamp = now();
			const record = {
				kind,
				text,
				completed: false,
				sortOrder: existing.reduce(
					(maximum, item) => Math.max(maximum, item.sortOrder + 1),
					0,
				),
				gardenId,
				createdAt: timestamp,
				updatedAt: timestamp,
				...(kind === 'wishlist' ? { quantity, notes, url } : {}),
			};

			return repository.create(record);
		},

		async update(id, kind, changes) {
			validateListItemKind(kind);
			const current = await repository.getById(id);
			if (!current) {
				return false;
			}
			if (current.kind !== kind) {
				throw new ValidationError(
					'LIST_ITEM_KIND_MISMATCH',
					'The item does not belong to the active list.',
					{ field: 'kind' },
				);
			}

			const allowedFields = kind === 'wishlist'
				? ['text', 'gardenId', 'quantity', 'notes', 'url']
				: ['text', 'gardenId'];
			const unsupportedField = Object.keys(changes).find(
				(field) => !allowedFields.includes(field),
			);
			if (unsupportedField) {
				throw new ValidationError(
					'UNSUPPORTED_LIST_ITEM_FIELD',
					`${unsupportedField} is not editable for this list.`,
					{ field: unsupportedField },
				);
			}

			const persistedChanges = Object.fromEntries(
				allowedFields
					.filter((field) => Object.hasOwn(changes, field))
					.map((field) => [field, changes[field]]),
			);

			if (Object.keys(persistedChanges).length === 0) {
				throw new ValidationError(
					'EMPTY_CHANGES',
					'Update requires at least one editable field.',
				);
			}

			persistedChanges.updatedAt = now();
			return repository.update(id, persistedChanges);
		},

		setCompleted(id, completed) {
			return repository.update(id, {
				completed,
				updatedAt: now(),
			});
		},

		remove(id) {
			return repository.remove(id);
		},

		reorder(kind, ids) {
			validateListItemKind(kind);
			return repository.reorder(kind, ids, now());
		},
	});
}
