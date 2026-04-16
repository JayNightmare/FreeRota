import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const deletedUserSchema = new Schema(
    {
        originalUserId: { type: Schema.Types.ObjectId, required: true, index: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        username: { type: String, required: true, lowercase: true, trim: true, unique: true },
        displayName: { type: String, required: true, trim: true },
        timezone: { type: String, required: true },
        isPublic: { type: Boolean, required: true },
        uiAccentColor: { type: String, default: null, trim: true },
        emailVerifiedAt: { type: Date, default: null },
        accountCreatedAt: { type: Date, required: true },
        accountUpdatedAt: { type: Date, required: true },
        deletedAt: { type: Date, required: true, default: () => new Date() }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

deletedUserSchema.index({ email: 1 });

export type DeletedUser = InferSchemaType<typeof deletedUserSchema>;
export type DeletedUserDocument = HydratedDocument<DeletedUser>;

export const DeletedUserModel = model<DeletedUser>('DeletedUser', deletedUserSchema);
