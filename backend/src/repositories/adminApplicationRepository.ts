import { Types } from 'mongoose';
import {
    type AdminApplicationDocument,
    type AdminApplicationStatus,
    AdminApplicationModel
} from '../models/AdminApplication.js';

interface CreateAdminApplicationInput {
    userId: string;
    applicantUsername: string;
    applicantDisplayName: string;
    applicantEmail: string;
    motivation: string;
    discordHandle?: string | null;
}

function toObjectId(value: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(value)) {
        return null;
    }

    return new Types.ObjectId(value);
}

class AdminApplicationRepository {
    async createPending(input: CreateAdminApplicationInput): Promise<AdminApplicationDocument | null> {
        const userObjectId = toObjectId(input.userId);
        if (!userObjectId) {
            return null;
        }

        return AdminApplicationModel.create({
            userId: userObjectId,
            applicantUsername: input.applicantUsername,
            applicantDisplayName: input.applicantDisplayName,
            applicantEmail: input.applicantEmail,
            motivation: input.motivation,
            discordHandle: input.discordHandle ?? null,
            status: 'PENDING',
            submittedAt: new Date()
        });
    }

    async findPendingByUserId(userId: string): Promise<AdminApplicationDocument | null> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) {
            return null;
        }

        return AdminApplicationModel.findOne({ userId: userObjectId, status: 'PENDING' }).exec();
    }

    async findLatestByUserId(userId: string): Promise<AdminApplicationDocument | null> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId) {
            return null;
        }

        return AdminApplicationModel.findOne({ userId: userObjectId })
            .sort({ submittedAt: -1, _id: -1 })
            .exec();
    }

    async listByStatus(status: AdminApplicationStatus, limit: number): Promise<AdminApplicationDocument[]> {
        return AdminApplicationModel.find({ status })
            .sort({ submittedAt: -1, _id: -1 })
            .limit(limit)
            .exec();
    }

    async findById(applicationId: string): Promise<AdminApplicationDocument | null> {
        const applicationObjectId = toObjectId(applicationId);
        if (!applicationObjectId) {
            return null;
        }

        return AdminApplicationModel.findById(applicationObjectId).exec();
    }

    async markReviewed(
        applicationId: string,
        status: 'APPROVED' | 'REJECTED',
        reviewedByUserId: string,
        reviewNote?: string | null
    ): Promise<AdminApplicationDocument | null> {
        const applicationObjectId = toObjectId(applicationId);
        const reviewerObjectId = toObjectId(reviewedByUserId);
        if (!applicationObjectId || !reviewerObjectId) {
            return null;
        }

        return AdminApplicationModel.findOneAndUpdate(
            {
                _id: applicationObjectId,
                status: 'PENDING'
            },
            {
                status,
                reviewedAt: new Date(),
                reviewedByUserId: reviewerObjectId,
                reviewNote: reviewNote ?? null
            },
            {
                new: true
            }
        ).exec();
    }
}

export const adminApplicationRepository = new AdminApplicationRepository();
export type { CreateAdminApplicationInput };
