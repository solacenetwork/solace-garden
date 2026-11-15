import Dexie from 'dexie';

// Never serialize exceptions wholesale: messages can contain keys, records or
// database names. Only known infrastructure messages are safe to copy/log.
const SAFE_MESSAGES = new Set([
	'crypto.randomUUID is not a function',
	'globalThis.crypto.getRandomValues is not a function',
	'globalThis.crypto.randomUUID is not a function',
	'IndexedDB is unavailable.',
	'Access denied',
	'The database existence check failed.',
	'The database existence check was blocked.',
	'The database existence check could not be rolled back.',
	'The database existence check did not start.',
	'A missing database probe completed unexpectedly.',
	'IndexedDB database discovery is unavailable.',
	'IndexedDB database discovery failed.',
	'IndexedDB database discovery returned an invalid result.',
]);
const SAFE_NAMES = new Set(['Error', 'TypeError', 'SecurityError', 'AbortError',
	'UnknownError', 'InvalidStateError', 'NotAllowedError', 'QuotaExceededError',
	'VersionError', 'OpenFailedError', 'MissingAPIError', 'DatabaseClosedError',
	'TransactionInactiveError', 'ConstraintError', 'DataError', 'ReadOnlyError',
	'NotFoundError', 'NotSupportedError', 'InvalidAccessError', 'DataCloneError',
	'TimeoutError', 'OperationError', 'UpgradeError', 'SchemaError', 'InvalidTableError',
	'BulkError', 'ModifyError', 'PrematureCommitError', 'ForeignAwaitError',
	'InternalError', 'InvalidArgumentError', 'SubTransactionError']);

// Some browser policies throw even when reading a capability property.
function inspect(read) {
	try { return read(); } catch { return null; }
}

export function startupDiagnostics(code, stage, error) {
	const exceptions = [];
	const seen = new Set();
	for (let current = error; current && exceptions.length < 4 && !seen.has(current);
		current = current.cause ?? current.inner) {
		seen.add(current);
		exceptions.push({
			name: SAFE_NAMES.has(current.name) ? current.name : 'Error',
			message: SAFE_MESSAGES.has(current.message)
				? current.message : '[message omitted to protect local data]',
		});
	}
	return {
		code,
		stage,
		exceptions,
		dexieVersion: Dexie.semVer,
		buildAsset: new URL(import.meta.url).pathname.split('/').pop(),
		secureContext: inspect(() => globalThis.isSecureContext ?? null),
		indexedDBAvailable: inspect(() => typeof globalThis.indexedDB?.open === 'function'),
		randomUUIDAvailable: inspect(() => typeof globalThis.crypto?.randomUUID === 'function'),
		getRandomValuesAvailable: inspect(() => typeof globalThis.crypto?.getRandomValues === 'function'),
		userAgent: inspect(() => globalThis.navigator?.userAgent ?? null),
		platform: inspect(() => globalThis.navigator?.platform ?? null),
		serviceWorkerControlled: inspect(() => Boolean(globalThis.navigator?.serviceWorker?.controller)),
	};
}
