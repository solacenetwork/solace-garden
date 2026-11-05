import { initializeDexieStorage } from './dexie/initializeDexieStorage.js';

// Presentation and domain code enter storage through this module. The public
// 8A contract intentionally covers startup status and connection lifecycle
// only; entity repositories will be added as their feature slices require them.
export function initializeStorage() {
	return initializeDexieStorage();
}

