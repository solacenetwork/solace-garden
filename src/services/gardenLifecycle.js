import {
	gardenError, normalizeGardenFields, validateGardenLifecycle,
} from '../storage/gardenValidation.js';

function expectation(value) {
	return { ...validateGardenLifecycle(value, 'expectedLifecycle') };
}

export function createGardenLifecycleService(repository, {
	now = () => new Date().toISOString(),
} = {}) {
	return Object.freeze({
		setStatus(id, status, expectedLifecycle) {
			if (!['planned', 'active'].includes(status)) {
				throw gardenError('INVALID_GARDEN_TRANSITION',
					'Use the dedicated Complete or Archive operation for that status.', 'status');
			}
			return repository.setStatus(id, status, expectation(expectedLifecycle), now());
		},
		complete(id, { close = false, notes } = {}, expectedLifecycle) {
			if (typeof close !== 'boolean') {
				throw gardenError('INVALID_GARDEN_TRANSITION', 'Close must be true or false.', 'close');
			}
			if (!close && notes !== undefined) {
				throw gardenError('INVALID_GARDEN_TRANSITION',
					'Garden Notes can only be updated while closing a Garden.', 'notes');
			}
			const normalizedNotes = notes === undefined ? undefined : normalizeGardenFields({ notes }).notes;
			return repository.complete(id, { close, notes: normalizedNotes }, expectation(expectedLifecycle), now());
		},
		close(id, { notes } = {}, expectedLifecycle) {
			const normalizedNotes = notes === undefined ? undefined : normalizeGardenFields({ notes }).notes;
			return repository.close(id, { notes: normalizedNotes }, expectation(expectedLifecycle), now());
		},
		reopen(id, expectedLifecycle) {
			return repository.reopen(id, expectation(expectedLifecycle), now());
		},
		archive(id, expectedLifecycle) {
			return repository.archive(id, expectation(expectedLifecycle), now());
		},
		unarchive(id, expectedLifecycle) {
			return repository.unarchive(id, expectation(expectedLifecycle), now());
		},
	});
}
