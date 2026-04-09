import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { signAuthToken } from '../utils/jwt.js';
import { validateUsername } from '../utils/username.js';

class AuthService {
    async register(input: {
        email: string;
        username: string;
        password: string;
        displayName?: string;
        timezone?: string;
        isPublic?: boolean;
    }): Promise<{ token: string }> {
        const existing = await userRepository.findByEmail(input.email);
        assertOrThrow(!existing, 'Email is already in use', 'CONFLICT', 409);

        const username = validateUsername(input.username);
        const existingUsername = await userRepository.findByUsername(username);
        assertOrThrow(!existingUsername, 'Username is already in use', 'CONFLICT', 409);

        const passwordHash = await bcrypt.hash(input.password, 12);
        const displayName = input.displayName?.trim() || username;

        const user = await userRepository.create({
            email: input.email,
            username,
            passwordHash,
            displayName,
            timezone: input.timezone ?? 'UTC',
            isPublic: input.isPublic ?? false
        });

        return { token: signAuthToken({ _id: user._id, email: user.email }) };
    }

    async login(email: string, password: string): Promise<{ token: string }> {
        const user = await userRepository.findByEmail(email);
        if (!user || user.deletedAt) {
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        return { token: signAuthToken({ _id: user._id, email: user.email }) };
    }
}

export const authService = new AuthService();
