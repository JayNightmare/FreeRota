import { Types } from 'mongoose';
import { NotificationModel, type NotificationCategory, type NotificationDocument } from '../models/Notification.js';
import { NotificationReadModel } from '../models/NotificationRead.js';

interface SystemNotificationSeed {
    slug: string;
    title: string;
    body: string;
    category: NotificationCategory;
    version?: string | null;
    linkUrl?: string | null;
    publishedAt: Date;
}

function toObjectId(value: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(value)) {
        return null;
    }

    return new Types.ObjectId(value);
}

function toObjectIds(values: string[]): Types.ObjectId[] {
    return values
        .map((value) => toObjectId(value))
        .filter((value): value is Types.ObjectId => Boolean(value));
}

class NotificationRepository {
    async upsertSystemNotifications(seeds: SystemNotificationSeed[]): Promise<void> {
        if (seeds.length === 0) {
            return;
        }

        await NotificationModel.bulkWrite(
            seeds.map((seed) => ({
                updateOne: {
                    filter: { slug: seed.slug },
                    update: {
                        $setOnInsert: {
                            ...seed,
                            isActive: true
                        }
                    },
                    upsert: true
                }
            })),
            { ordered: false }
        );
    }

    async createSystemNotification(seed: SystemNotificationSeed): Promise<NotificationDocument> {
        return NotificationModel.create({
            ...seed,
            isActive: true
        });
    }

    async listRecent(limit: number, cursor?: string | null): Promise<NotificationDocument[]> {
        const filter: Record<string, unknown> = { isActive: true };

        if (cursor) {
            const cursorId = toObjectId(cursor);
            if (cursorId) {
                filter._id = { $lt: cursorId };
            }
        }

        return NotificationModel.find(filter)
            .sort({ _id: -1 })
            .limit(limit)
            .exec();
    }

    async listActiveIds(): Promise<string[]> {
        const documents = await NotificationModel.find({ isActive: true })
            .sort({ _id: -1 })
            .select({ _id: 1 })
            .lean()
            .exec();

        return documents.map((document) => String(document._id));
    }

    async findById(notificationId: string): Promise<NotificationDocument | null> {
        const objectId = toObjectId(notificationId);
        if (!objectId) {
            return null;
        }

        return NotificationModel.findById(objectId).exec();
    }

    async listReadNotificationIds(userId: string, notificationIds: string[]): Promise<Set<string>> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId || notificationIds.length === 0) {
            return new Set();
        }

        const notificationObjectIds = toObjectIds(notificationIds);
        if (notificationObjectIds.length === 0) {
            return new Set();
        }

        const records = await NotificationReadModel.find({
            userId: userObjectId,
            notificationId: { $in: notificationObjectIds }
        })
            .select({ notificationId: 1 })
            .lean()
            .exec();

        return new Set(records.map((record) => String(record.notificationId)));
    }

    async countReadForNotificationIds(userId: string, notificationIds: string[]): Promise<number> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId || notificationIds.length === 0) {
            return 0;
        }

        const notificationObjectIds = toObjectIds(notificationIds);
        if (notificationObjectIds.length === 0) {
            return 0;
        }

        return NotificationReadModel.countDocuments({
            userId: userObjectId,
            notificationId: { $in: notificationObjectIds }
        }).exec();
    }

    async markRead(userId: string, notificationId: string): Promise<void> {
        const userObjectId = toObjectId(userId);
        const notificationObjectId = toObjectId(notificationId);
        if (!userObjectId || !notificationObjectId) {
            return;
        }

        await NotificationReadModel.findOneAndUpdate(
            {
                userId: userObjectId,
                notificationId: notificationObjectId
            },
            {
                readAt: new Date()
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        ).exec();
    }

    async markManyRead(userId: string, notificationIds: string[]): Promise<number> {
        const userObjectId = toObjectId(userId);
        if (!userObjectId || notificationIds.length === 0) {
            return 0;
        }

        const notificationObjectIds = toObjectIds(notificationIds);
        if (notificationObjectIds.length === 0) {
            return 0;
        }

        const readAt = new Date();

        await NotificationReadModel.bulkWrite(
            notificationObjectIds.map((notificationObjectId) => ({
                updateOne: {
                    filter: {
                        userId: userObjectId,
                        notificationId: notificationObjectId
                    },
                    update: {
                        readAt
                    },
                    upsert: true
                }
            })),
            { ordered: false }
        );

        return notificationObjectIds.length;
    }
}

export const notificationRepository = new NotificationRepository();
export type { SystemNotificationSeed };
