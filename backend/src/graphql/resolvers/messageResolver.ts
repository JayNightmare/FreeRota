import { messageService } from '../../services/messageService.js';
import { requireAuth } from './helpers.js';
import { pubSub } from '../pubsub.js';

export const messageResolver = {
    Query: {
        conversations: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return messageService.listConversations(userId);
        },
        messages: async (
            _parent: unknown,
            args: { conversationId: string; limit?: number; cursor?: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return messageService.listMessages(userId, args.conversationId, args.limit ?? 30, args.cursor);
        }
    },
    Mutation: {
        createConversationWith: async (_parent: unknown, args: { targetUserId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return messageService.createConversationWith(userId, args.targetUserId);
        },
        sendMessage: async (_parent: unknown, args: { recipientId: string; body: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return messageService.sendMessage(userId, args.recipientId, args.body);
        },
        markMessageRead: async (_parent: unknown, args: { messageId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return messageService.markRead(userId, args.messageId);
        }
    },
    Subscription: {
        messageReceived: {
            subscribe: (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
                requireAuth(context);
                return pubSub.subscribe('MESSAGE_SENT');
            },
            resolve: async (
                payload: { recipientId: string; message: unknown },
                _args: unknown,
                context: Parameters<typeof requireAuth>[0]
            ) => {
                const userId = requireAuth(context);
                if (payload.recipientId !== userId) {
                    return null;
                }

                return payload.message;
            }
        }
    }
};
