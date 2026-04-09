import { ConversationModel, type ConversationDocument } from '../models/Conversation.js';

function buildDirectKey(userA: string, userB: string): string {
    return [userA, userB].sort().join(':');
}

class ConversationRepository {
    async getOrCreateDirectConversation(userA: string, userB: string): Promise<ConversationDocument> {
        const directKey = buildDirectKey(userA, userB);

        const existing = await ConversationModel.findOne({ directKey }).exec();
        if (existing) {
            return existing;
        }

        return ConversationModel.create({
            participantIds: [userA, userB],
            directKey
        });
    }

    async listForUser(userId: string): Promise<ConversationDocument[]> {
        return ConversationModel.find({ participantIds: userId }).sort({ lastMessageAt: -1 }).exec();
    }

    async touchLastMessage(conversationId: string, sentAt: Date): Promise<void> {
        await ConversationModel.findByIdAndUpdate(conversationId, { lastMessageAt: sentAt }).exec();
    }
}

export const conversationRepository = new ConversationRepository();
