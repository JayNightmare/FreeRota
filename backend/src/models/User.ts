import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        displayName: { type: String, required: true, trim: true },
        timezone: { type: String, required: true, default: 'UTC' },
        isPublic: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ isPublic: 1 });

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel = model<User>('User', userSchema);
