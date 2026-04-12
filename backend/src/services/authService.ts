import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { signAuthToken } from '../utils/jwt.js';
import { validateUsername } from '../utils/username.js';
import { createRandomToken, createShortCode, hashToken } from '../utils/token.js';
import { emailService } from './emailService.js';

const EMAIL_VERIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

interface ActionResult {
    success: boolean;
    message: string;
}

function isLikelyEmail(identifier: string): boolean {
    return identifier.includes('@');
}

function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

class AuthService {
    async register(input: {
        email: string;
        username: string;
        password: string;
        displayName?: string;
        timezone?: string;
        isPublic?: boolean;
    }): Promise<{ token: string }> {
        const email = normalizeEmail(input.email);
        const existing = await userRepository.findByEmail(email);
        assertOrThrow(!existing, 'Email is already in use', 'CONFLICT', 409);

        const username = validateUsername(input.username);
        const existingUsername = await userRepository.findByUsername(username);
        assertOrThrow(!existingUsername, 'Username is already in use', 'CONFLICT', 409);

        assertOrThrow(
            input.password.length >= MIN_PASSWORD_LENGTH,
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
        );

        const passwordHash = await bcrypt.hash(input.password, 12);
        const displayName = input.displayName?.trim() || username;

        const user = await userRepository.create({
            email,
            username,
            passwordHash,
            displayName,
            timezone: input.timezone ?? 'UTC',
            isPublic: input.isPublic ?? false
        });

        const verificationCode = createShortCode();
        await userRepository.setEmailVerificationToken(
            String(user._id),
            hashToken(verificationCode),
            new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
        );

        await emailService.sendVerificationEmail(user.email, user.username, verificationCode);

        return { token: signAuthToken({ _id: user._id, username: user.username }) };
    }

    async login(username: string, password: string): Promise<{ token: string }> {
        const user = await userRepository.findByUsername(username);
        if (!user || user.deletedAt) {
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new AppError('Invalid credentials', 'UNAUTHORIZED', 401);
        }

        return { token: signAuthToken({ _id: user._id, username: user.username }) };
    }

    async requestEmailVerification(email: string): Promise<ActionResult> {
        const normalizedEmail = normalizeEmail(email);
        const user = await userRepository.findByEmail(normalizedEmail);

        if (user && !user.deletedAt && !user.emailVerifiedAt) {
            const verificationCode = createShortCode();
            await userRepository.setEmailVerificationToken(
                String(user._id),
                hashToken(verificationCode),
                new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
            );
            await emailService.sendVerificationEmail(user.email, user.username, verificationCode);
        }

        return {
            success: true,
            message: 'If an account exists, a verification email has been sent.'
        };
    }

    async verifyEmail(code: string, userId: string): Promise<ActionResult> {
        const sanitizedCode = code.trim().toUpperCase();
        assertOrThrow(sanitizedCode.length === 6, 'Verification code must be 6 characters');

        const user = await userRepository.verifyEmailByUserId(userId, hashToken(sanitizedCode));
        if (!user) {
            throw new AppError('Verification code is invalid or expired.', 'BAD_REQUEST', 400);
        }

        return {
            success: true,
            message: 'Email verified successfully.'
        };
    }

    async requestPasswordReset(identifier: string): Promise<ActionResult> {
        const trimmedIdentifier = identifier.trim();
        assertOrThrow(Boolean(trimmedIdentifier), 'Email or username is required');

        const user = isLikelyEmail(trimmedIdentifier)
            ? await userRepository.findByEmail(trimmedIdentifier)
            : await userRepository.findByUsername(trimmedIdentifier);

        if (user && !user.deletedAt && user.emailVerifiedAt) {
            const resetToken = createRandomToken();
            await userRepository.setPasswordResetToken(
                String(user._id),
                hashToken(resetToken),
                new Date(Date.now() + PASSWORD_RESET_TTL_MS)
            );
            await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);
        } else {
            const reason = !user
                ? 'user-not-found'
                : user.deletedAt
                    ? 'user-deleted'
                    : 'email-not-verified';

            console.info('[AuthService] Password reset email skipped', {
                reason
            });
        }

        return {
            success: true,
            message: 'If an account exists, a password reset email has been sent.'
        };
    }

    async resetPassword(token: string, newPassword: string): Promise<ActionResult> {
        const sanitizedToken = token.trim();
        assertOrThrow(Boolean(sanitizedToken), 'Reset token is required');
        assertOrThrow(
            newPassword.length >= MIN_PASSWORD_LENGTH,
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
        );

        const user = await userRepository.findByPasswordResetTokenHash(hashToken(sanitizedToken));
        if (!user || user.deletedAt) {
            throw new AppError('Reset link is invalid or expired.', 'BAD_REQUEST', 400);
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await userRepository.updatePasswordById(String(user._id), passwordHash);

        return {
            success: true,
            message: 'Password updated successfully. You can now sign in.'
        };
    }
}

export const authService = new AuthService();

