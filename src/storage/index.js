import { initializeDexieStorage } from './dexie/initializeDexieStorage.js';

export { StorageError, ValidationError } from './errors.js';

// Presentation and domain code enter storage through this module. The public
// The returned ready session exposes storage-neutral repositories plus
// connection lifecycle. Presentation code never receives a Dexie database.
export function initializeStorage() {
	return initializeDexieStorage();
}

