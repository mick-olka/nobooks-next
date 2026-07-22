export class AppError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "AppError";
		if (options?.cause !== undefined) {
			this.cause = options.cause;
		}
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`Not found: ${resource}`);
		this.name = "NotFoundError";
	}
}

export function isNotFoundError(error: unknown): error is NotFoundError {
	return error instanceof NotFoundError;
}
