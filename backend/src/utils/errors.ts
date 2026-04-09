export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status = 400
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function assertOrThrow(condition: unknown, message: string, code = 'BAD_REQUEST', status = 400): asserts condition {
    if (!condition) {
        throw new AppError(message, code, status);
    }
}
