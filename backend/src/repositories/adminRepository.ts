import { Types } from 'mongoose';
import { AdminUserModel, type AdminUserDocument } from '../models/AdminUser.js';

function toObjectId(value: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(value)) {
        return null;
    }

    return new Types.ObjectId(value);
}

class AdminRepository {
    async isUserAdmin(userId: string): Promise<boolean> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) {
            return false;
        }

        const record = await AdminUserModel.findOne({
            userId: userObjectId,
            isActive: true
        })
            .select({ _id: 1 })
            .lean()
            .exec();

        return Boolean(record);
    }

    async countActiveAdmins(): Promise<number> {
        return AdminUserModel.countDocuments({ isActive: true }).exec();
    }

    async grantAdmin(
        userId: string,
        approvedByUserId?: string | null,
        sourceApplicationId?: string | null
    ): Promise<AdminUserDocument | null> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) {
            return null;
        }

        const approvedByObjectId = approvedByUserId ? toObjectId(approvedByUserId) : null;
        const sourceApplicationObjectId = sourceApplicationId ? toObjectId(sourceApplicationId) : null;

        return AdminUserModel.findOneAndUpdate(
            { userId: userObjectId },
            {
                $setOnInsert: {
                    userId: userObjectId,
                    approvedAt: new Date(),
                    approvedByUserId: approvedByObjectId,
                    sourceApplicationId: sourceApplicationObjectId,
                    isActive: true
                },
                $set: {
                    isActive: true
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        ).exec();
    }
}

export const adminRepository = new AdminRepository();
