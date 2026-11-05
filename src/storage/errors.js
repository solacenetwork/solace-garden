export class ValidationError extends Error {
	constructor(code, message, { field } = {}) {
		super(message);
		this.name = 'ValidationError';
		this.code = code;
		this.field = field;
	}
}

export class StorageError extends Error {
	constructor(operation, cause) {
		super(`The ${operation} storage operation failed.`, { cause });
		this.name = 'StorageError';
		this.code = 'STORAGE_OPERATION_FAILED';
		this.operation = operation;
	}
}

