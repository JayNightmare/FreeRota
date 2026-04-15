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

const SYSTEM_NOTIFICATION_SEEDS: SystemNotificationSeed[] = [
    {
        slug: '2026-04-web-testing-rollout',
        title: 'Web test rollout improvements',
        body: 'We tightened app startup and orientation handling for smoother web testing sessions.',
        category: 'UPDATE',
        version: '0.1.0',
        publishedAt: new Date('2026-04-16T09:00:00.000Z')
    },
    {
        slug: '2026-04-calendar-import-bugfix',
        title: 'Calendar import parsing fix',
        body: 'Import now handles edge-case event formats more reliably and reports skipped items clearly.',
        category: 'BUG_FIX',
        version: '0.1.0',
        publishedAt: new Date('2026-04-15T12:30:00.000Z')
    },
    {
        slug: '2026-04-message-delivery-updates',
        title: 'Message reliability update',
        body: 'Conversation delivery and read-state consistency were improved for active chats.',
        category: 'RELEASE',
        version: '0.1.0',
        publishedAt: new Date('2026-04-14T08:00:00.000Z')
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
