import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const siteSchema = new Schema(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        name: { type: String, required: true, trim: true },
        regionCode: { type: String, default: null, trim: true },
        timezone: { type: String, required: true, default: 'UTC' },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export type Site = InferSchemaType<typeof siteSchema> & { organizationId: Types.ObjectId };
export type SiteDocument = HydratedDocument<Site>;

export const SiteModel = model<Site>('Site', siteSchema);
