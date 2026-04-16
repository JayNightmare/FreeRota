import { Schema, model, type InferSchemaType, type HydratedDocument, type Types } from 'mongoose';

const adminUserSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        sourceApplicationId: { type: Schema.Types.ObjectId, ref: 'AdminApplication', default: null },
        approvedAt: { type: Date, required: true, default: () => new Date() },
        isActive: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

adminUserSchema.index({ userId: 1, isActive: 1 });

export type AdminUser = InferSchemaType<typeof adminUserSchema> & {
    userId: Types.ObjectId;
    approvedByUserId: Types.ObjectId | null;
    sourceApplicationId: Types.ObjectId | null;
};

export type AdminUserDocument = HydratedDocument<AdminUser>;

export const AdminUserModel = model<AdminUser>('AdminUser', adminUserSchema);
