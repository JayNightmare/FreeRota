import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const organizationSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['PERSONAL', 'ENTERPRISE'], required: true, default: 'ENTERPRISE' },
        billingTier: { type: String, enum: ['FREE', 'PRO', 'BUSINESS', 'PENDING_ENTERPRISE', 'ENTERPRISE'], required: true, default: 'FREE' },
        ssoDomain: { type: String, default: null, trim: true },
        ssoEnabled: { type: Boolean, default: false },
        ssoProvider: { type: String, enum: ['saml', 'oidc', 'mock', null], default: null },
        ssoMetadata: { type: Schema.Types.Mixed, default: {} },
        ssoEnforce: { type: Boolean, default: false },
        groupRoleMappings: [{
            _id: false,
            idpGroup: { type: String, required: true },
            roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
            scopes: [{ type: String }]
        }],
        isActive: { type: Boolean, required: true, default: true },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

organizationSchema.index({ type: 1 });

export type Organization = InferSchemaType<typeof organizationSchema>;
export type OrganizationDocument = HydratedDocument<Organization>;

export const OrganizationModel = model<Organization>('Organization', organizationSchema);
