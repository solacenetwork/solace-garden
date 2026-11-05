import Dexie from 'dexie';

function probeError(code, message, cause) {
	const error = new Error(message, cause ? { cause } : undefined);
	error.code = code;
	return error;
}

export function probeDatabaseExists(databaseName, dependencies) {
	const indexedDB = dependencies?.indexedDB ?? Dexie.dependencies.indexedDB;

	return new Promise((resolve, reject) => {
		if (typeof indexedDB?.open !== 'function') {
			reject(probeError('DATABASE_PROBE_UNAVAILABLE', 'IndexedDB is unavailable.'));
			return;
		}

		let request;
		let missingDatabase = false;
		let settled = false;

		const resolveOnce = (value) => {
			if (!settled) {
				settled = true;
				resolve(value);
			}
		};

		const rejectOnce = (error) => {
			if (!settled) {
				settled = true;
				reject(error);
			}
		};

		try {
			// Omitting a version opens an existing database without upgrading it.
			// A missing database alone reaches upgradeneeded with oldVersion 0.
			request = indexedDB.open(databaseName);
		} catch (cause) {
			rejectOnce(
				probeError('DATABASE_PROBE_FAILED', 'The database existence check failed.', cause),
			);
			return;
		}

		if (!request) {
			rejectOnce(
				probeError('DATABASE_PROBE_FAILED', 'The database existence check did not start.'),
			);
			return;
		}

		request.onupgradeneeded = (event) => {
			missingDatabase = event.oldVersion === 0;

			try {
				request.transaction.abort();
				request.result.close();
			} catch (cause) {
				rejectOnce(
					probeError('DATABASE_PROBE_FAILED', 'The database existence check could not be rolled back.', cause),
				);
			}
		};

		request.onsuccess = () => {
			request.result.close();

			if (missingDatabase) {
				rejectOnce(
					probeError('DATABASE_PROBE_FAILED', 'A missing database probe completed unexpectedly.'),
				);
				return;
			}

			resolveOnce(true);
		};

		request.onerror = (event) => {
			event.preventDefault?.();

			if (missingDatabase && request.error?.name === 'AbortError') {
				resolveOnce(false);
				return;
			}

			rejectOnce(
				probeError('DATABASE_PROBE_FAILED', 'The database existence check failed.', request.error),
			);
		};

		request.onblocked = () => {
			rejectOnce(
				probeError('DATABASE_PROBE_BLOCKED', 'The database existence check was blocked.'),
			);
		};
	});
}

