import { validateGardenTypeSelection } from '../storage/gardenTypeValidation.js';

export function createGardenTypesService(repository) {
	return Object.freeze({
		list() {
			return repository.list();
		},

		getById(id) {
			return repository.getById(id);
		},

		async validateSelection(typeIds) {
			return validateGardenTypeSelection(typeIds, await repository.list());
		},
	});
}
