import { userRepository } from '../repositories/userRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { validateUsername } from '../utils/username.js';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function normalizeUiAccentColor(value?: string | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    assertOrThrow(HEX_COLOR_REGEX.test(trimmed), 'UI accent color must be a valid hex value like #1E3A8A');
    return trimmed.toUpperCase();
}

class UserService {
    async me(userId: string) {
        const user = await userRepository.findById(userId);
        if (!user || user.deletedAt) {
            throw new AppError('User not found', 'NOT_FOUND', 404);
        }

        return user;
    }

    async getProfile(userId: string) {
        const user = await userRepository.findById(userId);
        if (!user || user.deletedAt) {
            throw new AppError('User not found', 'NOT_FOUND', 404);
        }

        return user;
    }

    async updateUser(
        userId: string,
        updates: {
            username?: string;
            displayName?: string;
            timezone?: string;
            isPublic?: boolean;
            uiAccentColor?: string | null;
        }
    ) {
        const hasUpdates =
            Object.prototype.hasOwnProperty.call(updates, 'username') ||
            Object.prototype.hasOwnProperty.call(updates, 'displayName') ||
            Object.prototype.hasOwnProperty.call(updates, 'timezone') ||
            Object.prototype.hasOwnProperty.call(updates, 'isPublic') ||
            Object.prototype.hasOwnProperty.call(updates, 'uiAccentColor');
        assertOrThrow(hasUpdates, 'No updates provided');

        const sanitizedUpdates = { ...updates };

        if (typeof sanitizedUpdates.username === 'string') {
            const nextUsername = validateUsername(sanitizedUpdates.username);
            const existing = await userRepository.findByUsername(nextUsername);
            if (existing && String(existing._id) !== userId) {
                throw new AppError('Username is already in use', 'CONFLICT', 409);
            }

            sanitizedUpdates.username = nextUsername;
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'uiAccentColor')) {
            sanitizedUpdates.uiAccentColor = normalizeUiAccentColor(updates.uiAccentColor);
        }

        const updated = await userRepository.updateById(userId, sanitizedUpdates);
        if (!updated || updated.deletedAt) {
            throw new AppError('User not found', 'NOT_FOUND', 404);
        }

        return updated;
    }

    async deleteAccount(userId: string): Promise<boolean> {
        await userRepository.softDeleteById(userId);
        return true;
    }
}

export const userService = new UserService();
