import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

export const friendshipStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'] as const;

const friendshipSchema = new Schema(
    {
        requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        addresseeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        status: { type: String, enum: friendshipStatuses, required: true, default: 'PENDING' }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

friendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });
friendshipSchema.index({ addresseeId: 1, status: 1 });

export type Friendship = InferSchemaType<typeof friendshipSchema> & {
    requesterId: Types.ObjectId;
    addresseeId: Types.ObjectId;
};
export type FriendshipDocument = HydratedDocument<Friendship>;

export const FriendshipModel = model<Friendship>('Friendship', friendshipSchema);
