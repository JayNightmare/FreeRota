import { Schema, model, type InferSchemaType, type HydratedDocument, type Types } from 'mongoose';

export const ADMIN_APPLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type AdminApplicationStatus = (typeof ADMIN_APPLICATION_STATUSES)[number];

const adminApplicationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        applicantUsername: { type: String, required: true, trim: true, lowercase: true, maxlength: 24 },
        applicantDisplayName: { type: String, required: true, trim: true, maxlength: 120 },
        applicantEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 320 },
        motivation: { type: String, required: true, trim: true, maxlength: 3000 },
        discordHandle: { type: String, trim: true, maxlength: 120, default: null },
        status: { type: String, enum: ADMIN_APPLICATION_STATUSES, required: true, default: 'PENDING' },
        submittedAt: { type: Date, required: true, default: () => new Date() },
        reviewedAt: { type: Date, default: null },
        reviewedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewNote: { type: String, trim: true, maxlength: 500, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

adminApplicationSchema.index(
    { userId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: 'PENDING'
        }
    }
);
adminApplicationSchema.index({ status: 1, submittedAt: -1 });

export type AdminApplication = InferSchemaType<typeof adminApplicationSchema> & {
    userId: Types.ObjectId;
    reviewedByUserId: Types.ObjectId | null;
};

export type AdminApplicationDocument = HydratedDocument<AdminApplication>;

export const AdminApplicationModel = model<AdminApplication>('AdminApplication', adminApplicationSchema);
