import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const conversationSchema = new Schema(
    {
        participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        directKey: { type: String, required: true, unique: true },
        lastMessageAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

conversationSchema.index({ participantIds: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export type Conversation = InferSchemaType<typeof conversationSchema> & {
    participantIds: Types.ObjectId[];
};
export type ConversationDocument = HydratedDocument<Conversation>;

export const ConversationModel = model<Conversation>('Conversation', conversationSchema);
