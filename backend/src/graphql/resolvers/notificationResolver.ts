import { requireAuth } from './helpers.js';
import { notificationService } from '../../services/notificationService.js';

export const notificationResolver = {
    Query: {
        notifications: async (
            _parent: unknown,
            args: { limit?: number; cursor?: string | null },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return notificationService.listForUser(userId, args.limit ?? 20, args.cursor);
        },
        notificationUnreadCount: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return notificationService.unreadCountForUser(userId);
        }
    },
    Mutation: {
        markNotificationRead: async (
            _parent: unknown,
            args: { notificationId: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return notificationService.markRead(userId, args.notificationId);
        },
        markAllNotificationsRead: async (
            _parent: unknown,
            _args: unknown,
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return notificationService.markAllRead(userId);
        }
    }
};
