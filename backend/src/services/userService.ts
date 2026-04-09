import { userRepository } from '../repositories/userRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { validateUsername } from '../utils/username.js';

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
        }
    ) {
        assertOrThrow(Object.keys(updates).length > 0, 'No updates provided');

        const sanitizedUpdates = { ...updates };

        if (typeof sanitizedUpdates.username === 'string') {
            const nextUsername = validateUsername(sanitizedUpdates.username);
            const existing = await userRepository.findByUsername(nextUsername);
            if (existing && String(existing._id) !== userId) {
                throw new AppError('Username is already in use', 'CONFLICT', 409);
            }

            sanitizedUpdates.username = nextUsername;
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
