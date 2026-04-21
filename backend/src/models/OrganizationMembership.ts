import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const organizationMembershipSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
        scopes: {
            siteIds: [{ type: Schema.Types.ObjectId, ref: 'Site' }],
            teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }]
        },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export type OrganizationMembership = InferSchemaType<typeof organizationMembershipSchema> & { userId: Types.ObjectId, organizationId: Types.ObjectId };
export type OrganizationMembershipDocument = HydratedDocument<OrganizationMembership>;

export const OrganizationMembershipModel = model<OrganizationMembership>('OrganizationMembership', organizationMembershipSchema);
