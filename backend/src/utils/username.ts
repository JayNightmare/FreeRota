import { AppError, assertOrThrow } from './errors.js';

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
}

export function validateUsername(username: string): string {
    const normalized = normalizeUsername(username);

    assertOrThrow(normalized.length > 0, 'Username is required', 'BAD_USER_INPUT', 400);
    if (!USERNAME_PATTERN.test(normalized)) {
        throw new AppError('Username must be 3-24 characters and use lowercase letters, numbers, or underscores', 'BAD_USER_INPUT', 400);
    }

    return normalized;
}
