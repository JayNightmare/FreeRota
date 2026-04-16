import { Types } from 'mongoose';
import { UserModel, type UserDocument } from '../models/User.js';

class UserRepository {
    async findById(id: string): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        return UserModel.findById(id).exec();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
    }

    async findByUsername(username: string): Promise<UserDocument | null> {
        return UserModel.findOne({ username: username.toLowerCase().trim() }).exec();
    }

    async create(input: {
        email: string;
        username: string;
        passwordHash: string;
        displayName: string;
        timezone: string;
        isPublic: boolean;
    }): Promise<UserDocument> {
        return UserModel.create({
            ...input,
            email: input.email.toLowerCase().trim(),
            username: input.username.toLowerCase().trim()
        });
    }

    async setEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            emailVerificationTokenHash: tokenHash,
            emailVerificationTokenExpiresAt: expiresAt
        }).exec();
    }

    async clearEmailVerificationToken(userId: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            emailVerificationTokenHash: null,
            emailVerificationTokenExpiresAt: null
        }).exec();
    }

    async verifyEmailByTokenHash(tokenHash: string): Promise<UserDocument | null> {
        return UserModel.findOneAndUpdate(
            {
                emailVerificationTokenHash: tokenHash,
                emailVerificationTokenExpiresAt: { $gt: new Date() },
                deletedAt: null
            },
            {
                emailVerifiedAt: new Date(),
                emailVerificationTokenHash: null,
                emailVerificationTokenExpiresAt: null
            },
            { new: true }
        ).exec();
    }

    async verifyEmailByUserId(userId: string, codeHash: string): Promise<UserDocument | null> {
        return UserModel.findOneAndUpdate(
            {
                _id: userId,
                emailVerificationTokenHash: codeHash,
                emailVerificationTokenExpiresAt: { $gt: new Date() },
                emailVerifiedAt: null,
                deletedAt: null
            },
            {
                emailVerifiedAt: new Date(),
                emailVerificationTokenHash: null,
                emailVerificationTokenExpiresAt: null
            },
            { new: true }
        ).exec();
    }

    async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            passwordResetTokenHash: tokenHash,
            passwordResetTokenExpiresAt: expiresAt
        }).exec();
    }

    async findByPasswordResetTokenHash(tokenHash: string): Promise<UserDocument | null> {
        return UserModel.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetTokenExpiresAt: { $gt: new Date() },
            deletedAt: null
        }).exec();
    }

    async clearPasswordResetToken(userId: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            passwordResetTokenHash: null,
            passwordResetTokenExpiresAt: null
        }).exec();
    }

    async updatePasswordById(userId: string, passwordHash: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            passwordHash,
            passwordResetTokenHash: null,
            passwordResetTokenExpiresAt: null
        }).exec();
    }

    async updateById(
        id: string,
        updates: Partial<Pick<UserDocument, 'username' | 'displayName' | 'timezone' | 'isPublic' | 'uiAccentColor'>>
    ): Promise<UserDocument | null> {
        const safeUpdates = { ...updates };
        if (typeof safeUpdates.username === 'string') {
            safeUpdates.username = safeUpdates.username.toLowerCase().trim();
        }

        if (typeof safeUpdates.uiAccentColor === 'string') {
            safeUpdates.uiAccentColor = safeUpdates.uiAccentColor.toUpperCase().trim();
        }

        return UserModel.findByIdAndUpdate(id, safeUpdates, { new: true }).exec();
    }

    async updateEmailById(userId: string, newEmail: string): Promise<UserDocument | null> {
        return UserModel.findByIdAndUpdate(
            userId,
            {
                email: newEmail.toLowerCase().trim(),
                emailVerifiedAt: null,
                emailVerificationTokenHash: null,
                emailVerificationTokenExpiresAt: null
            },
            { new: true }
        ).exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const deleted = await UserModel.findByIdAndDelete(id).exec();
        return Boolean(deleted);
    }
}

export const userRepository = new UserRepository();
