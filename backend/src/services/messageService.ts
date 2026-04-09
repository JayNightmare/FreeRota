import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { privacyPolicyService } from './privacyPolicyService.js';
import { pubSub } from '../graphql/pubsub.js';

class MessageService {
    async listConversations(userId: string) {
        return conversationRepository.listForUser(userId);
    }

    async createConversationWith(userId: string, targetUserId: string) {
        const canMessage = await privacyPolicyService.canMessageUser(userId, targetUserId);
        assertOrThrow(canMessage, 'Cannot create conversation with this user', 'FORBIDDEN', 403);

        return conversationRepository.getOrCreateDirectConversation(userId, targetUserId);
    }

    async listMessages(userId: string, conversationId: string, limit: number, cursor?: string | null) {
        const conversations = await conversationRepository.listForUser(userId);
        const allowed = conversations.some((item) => item.id === conversationId);
        assertOrThrow(allowed, 'Conversation not accessible', 'FORBIDDEN', 403);

        return messageRepository.listByConversation(conversationId, Math.min(Math.max(limit, 1), 100), cursor);
    }

    async sendMessage(userId: string, recipientId: string, body: string) {
        assertOrThrow(body.trim().length > 0, 'Message body cannot be empty');

        const canMessage = await privacyPolicyService.canMessageUser(userId, recipientId);
        if (!canMessage) {
            throw new AppError('Cannot message this user', 'FORBIDDEN', 403);
        }

        const conversation = await conversationRepository.getOrCreateDirectConversation(userId, recipientId);
        const message = await messageRepository.create({
            conversationId: conversation.id,
            senderId: userId,
            recipientId,
            body: body.trim()
        });

        await conversationRepository.touchLastMessage(conversation.id, message.sentAt);

        await pubSub.publish('MESSAGE_SENT', {
            recipientId,
            message
        });

        return message;
    }

    async markRead(userId: string, messageId: string) {
        const message = await messageRepository.markRead(messageId, userId);
        if (!message) {
            throw new AppError('Message not found', 'NOT_FOUND', 404);
        }

        return message;
    }
}

export const messageService = new MessageService();
