import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

export const permissionTypes = [
    'ROTA_CREATE', 'ROTA_APPROVE', 'ROTA_EDIT', 'USER_MANAGE', 'BILLING_MANAGE', 'ORG_MANAGE'
] as const;

const roleSchema = new Schema(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        name: { type: String, required: true, trim: true },
        permissions: [{ type: String, enum: permissionTypes, required: true }],
        isSystem: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export type Role = InferSchemaType<typeof roleSchema> & { organizationId: Types.ObjectId };
export type RoleDocument = HydratedDocument<Role>;

export const RoleModel = model<Role>('Role', roleSchema);
