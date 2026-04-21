import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        emailVerifiedAt: { type: Date, default: null },
        emailVerificationTokenHash: { type: String, default: null },
        emailVerificationTokenExpiresAt: { type: Date, default: null },
        passwordResetTokenHash: { type: String, default: null },
        passwordResetTokenExpiresAt: { type: Date, default: null },
        displayName: { type: String, required: true, trim: true },
        timezone: { type: String, required: true, default: 'UTC' },
        isPublic: { type: Boolean, required: true, default: false },
        uiAccentColor: { type: String, default: null, trim: true },
        activeOrganizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
        ssoIdentities: [{
            _id: false,
            organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
            idpUserId: { type: String, required: true }
        }],
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.index({ isPublic: 1 });
userSchema.index({ emailVerificationTokenHash: 1 });
userSchema.index({ passwordResetTokenHash: 1 });

export type User = InferSchemaType<typeof userSchema> & { activeOrganizationId?: Types.ObjectId | null };
export type UserDocument = HydratedDocument<User>;

export const UserModel = model<User>('User', userSchema);
