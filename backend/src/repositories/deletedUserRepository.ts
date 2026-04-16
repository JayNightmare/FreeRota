import { DeletedUserModel, type DeletedUserDocument } from '../models/DeletedUser.js';
import type { UserDocument } from '../models/User.js';

class DeletedUserRepository {
    async findByUsername(username: string): Promise<DeletedUserDocument | null> {
        return DeletedUserModel.findOne({ username: username.toLowerCase().trim() }).exec();
    }

    async archiveFromUser(user: UserDocument): Promise<void> {
        await DeletedUserModel.findOneAndUpdate(
            { username: user.username.toLowerCase().trim() },
            {
                originalUserId: user._id,
                email: user.email.toLowerCase().trim(),
                username: user.username.toLowerCase().trim(),
                displayName: user.displayName,
                timezone: user.timezone,
                isPublic: user.isPublic,
                uiAccentColor: user.uiAccentColor ?? null,
                emailVerifiedAt: user.emailVerifiedAt ?? null,
                accountCreatedAt: user.createdAt,
                accountUpdatedAt: user.updatedAt,
                deletedAt: user.deletedAt ?? new Date()
            },
            {
                upsert: true,
                setDefaultsOnInsert: true
            }
        ).exec();
    }
}

export const deletedUserRepository = new DeletedUserRepository();
