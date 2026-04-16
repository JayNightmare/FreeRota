import { randomUUID } from 'node:crypto';
import { type NotificationCategory, type NotificationDocument } from '../models/Notification.js';
import { notificationRepository, type SystemNotificationSeed } from '../repositories/notificationRepository.js';
import { AppError } from '../utils/errors.js';

interface NotificationView {
    id: string;
    title: string;
    body: string;
    category: NotificationCategory;
    version: string | null;
    linkUrl: string | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    isRead: boolean;
}

interface PublishNotificationInput {
    title: string;
    body: string;
    category?: NotificationCategory;
    version?: string | null;
    linkUrl?: string | null;
    publishedAt?: string | Date | null;
}

const SYSTEM_NOTIFICATION_SEEDS: SystemNotificationSeed[] = [
    {
        slug: '2026-04-web-testing-rollout',
        title: 'Web test rollout improvements',
        body: 'We tightened app startup and orientation handling for smoother web testing sessions.',
        category: 'UPDATE',
        version: '0.1.0',
        publishedAt: new Date('2026-04-16T09:00:00.000Z')
    }
];

function toNotificationView(notification: NotificationDocument, isRead: boolean): NotificationView {
    return {
        id: String(notification._id),
        title: notification.title,
        body: notification.body,
        category: notification.category,
        version: notification.version ?? null,
        linkUrl: notification.linkUrl ?? null,
        publishedAt: notification.publishedAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        isRead
    };
}

function normalizeOptionalText(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
}

function slugify(value: string): string {
    const normalized = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'notification';
}

function buildRuntimeSlug(title: string, publishedAt: Date): string {
    const datePrefix = publishedAt.toISOString().slice(0, 10);
    const suffix = randomUUID().slice(0, 8);
    const maxSlugLength = 120;
    const maxBaseLength = maxSlugLength - datePrefix.length - suffix.length - 2;
    const base = slugify(title).slice(0, Math.max(1, maxBaseLength));

    return `${datePrefix}-${base}-${suffix}`;
}

function parsePublishedAt(value?: string | Date | null): Date {
    if (!value) {
        return new Date();
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new AppError('Invalid publishedAt value', 'BAD_USER_INPUT', 400);
    }

    return parsed;
}

class NotificationService {
    async ensureSeedData(): Promise<void> {
        await notificationRepository.upsertSystemNotifications(SYSTEM_NOTIFICATION_SEEDS);
    }

    async listForUser(userId: string, limit: number, cursor?: string | null): Promise<NotificationView[]> {
        const safeLimit = Math.min(Math.max(limit, 1), 50);
        const notifications = await notificationRepository.listRecent(safeLimit, cursor);
        const notificationIds = notifications.map((notification) => String(notification._id));
        const readIds = await notificationRepository.listReadNotificationIds(userId, notificationIds);

        return notifications.map((notification) =>
            toNotificationView(notification, readIds.has(String(notification._id)))
        );
    }

    async publish(input: PublishNotificationInput): Promise<NotificationView> {
        const title = input.title.trim();
        const body = input.body.trim();

        if (!title) {
            throw new AppError('Notification title is required', 'BAD_USER_INPUT', 400);
        }

        if (!body) {
            throw new AppError('Notification body is required', 'BAD_USER_INPUT', 400);
        }

        const publishedAt = parsePublishedAt(input.publishedAt);
        const notification = await notificationRepository.createSystemNotification({
            slug: buildRuntimeSlug(title, publishedAt),
            title,
            body,
            category: input.category ?? 'UPDATE',
            version: normalizeOptionalText(input.version),
            linkUrl: normalizeOptionalText(input.linkUrl),
            publishedAt
        });

        return toNotificationView(notification, false);
    }

    async unreadCountForUser(userId: string): Promise<number> {
        const activeNotificationIds = await notificationRepository.listActiveIds();
        if (activeNotificationIds.length === 0) {
            return 0;
        }

        const readCount = await notificationRepository.countReadForNotificationIds(userId, activeNotificationIds);
        const unreadCount = activeNotificationIds.length - readCount;

        return unreadCount > 0 ? unreadCount : 0;
    }

    async markRead(userId: string, notificationId: string): Promise<NotificationView> {
        const notification = await notificationRepository.findById(notificationId);
        if (!notification || !notification.isActive) {
            throw new AppError('Notification not found', 'NOT_FOUND', 404);
        }

        await notificationRepository.markRead(userId, notificationId);

        return toNotificationView(notification, true);
    }

    async markAllRead(userId: string): Promise<{ success: boolean; message: string }> {
        const activeNotificationIds = await notificationRepository.listActiveIds();
        if (activeNotificationIds.length === 0) {
            return {
                success: true,
                message: 'No notifications available.'
            };
        }

        await notificationRepository.markManyRead(userId, activeNotificationIds);

        return {
            success: true,
            message: 'All notifications marked as read.'
        };
    }
}

export const notificationService = new NotificationService();
export type { PublishNotificationInput };
