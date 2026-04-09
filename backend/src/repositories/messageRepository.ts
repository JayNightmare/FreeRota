import { MessageModel, type MessageDocument } from '../models/Message.js';

class MessageRepository {
    async create(input: {
        conversationId: string;
        senderId: string;
        recipientId: string;
        body: string;
    }): Promise<MessageDocument> {
        return MessageModel.create({
            ...input,
            sentAt: new Date(),
            deliveryState: 'SENT'
        });
    }

    async listByConversation(conversationId: string, limit: number, cursor?: string | null): Promise<MessageDocument[]> {
        const filter: Record<string, unknown> = { conversationId };

        if (cursor) {
            filter._id = { $lt: cursor };
        }

        return MessageModel.find(filter)
            .sort({ _id: -1 })
            .limit(limit)
            .exec();
    }

    async markRead(messageId: string, userId: string): Promise<MessageDocument | null> {
        return MessageModel.findOneAndUpdate(
            { _id: messageId, recipientId: userId },
            { deliveryState: 'READ', readAt: new Date() },
            { new: true }
        ).exec();
    }
}

export const messageRepository = new MessageRepository();
