import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const messageSchema = new Schema(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        body: { type: String, required: true, trim: true, maxlength: 2000 },
        sentAt: { type: Date, required: true, default: () => new Date() },
        deliveryState: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], required: true, default: 'SENT' },
        readAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

messageSchema.index({ conversationId: 1, sentAt: -1 });
messageSchema.index({ recipientId: 1, sentAt: -1 });

export type Message = InferSchemaType<typeof messageSchema> & {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    recipientId: Types.ObjectId;
};
export type MessageDocument = HydratedDocument<Message>;

export const MessageModel = model<Message>('Message', messageSchema);
