import { Schema, model, type InferSchemaType, type HydratedDocument, type Types } from 'mongoose';

const notificationReadSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
        readAt: { type: Date, required: true, default: () => new Date() }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export type NotificationRead = InferSchemaType<typeof notificationReadSchema> & {
    userId: Types.ObjectId;
    notificationId: Types.ObjectId;
};
export type NotificationReadDocument = HydratedDocument<NotificationRead>;

export const NotificationReadModel = model<NotificationRead>('NotificationRead', notificationReadSchema);
