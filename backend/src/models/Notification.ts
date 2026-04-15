import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const NOTIFICATION_CATEGORIES = ['BUG_FIX', 'RELEASE', 'UPDATE', 'MAINTENANCE'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

const notificationSchema = new Schema(
    {
        slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120, unique: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        body: { type: String, required: true, trim: true, maxlength: 2000 },
        category: { type: String, enum: NOTIFICATION_CATEGORIES, required: true, default: 'UPDATE' },
        version: { type: String, trim: true, maxlength: 40, default: null },
        linkUrl: { type: String, trim: true, maxlength: 2048, default: null },
        publishedAt: { type: Date, required: true, default: () => new Date() },
        isActive: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

notificationSchema.index({ isActive: 1, publishedAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationModel = model<Notification>('Notification', notificationSchema);
