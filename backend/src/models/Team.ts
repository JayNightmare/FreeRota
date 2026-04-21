import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const teamSchema = new Schema(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        siteId: { type: Schema.Types.ObjectId, ref: 'Site', default: null, index: true },
        name: { type: String, required: true, trim: true },
        departmentName: { type: String, default: null, trim: true },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export type Team = InferSchemaType<typeof teamSchema> & { organizationId: Types.ObjectId, siteId?: Types.ObjectId | null };
export type TeamDocument = HydratedDocument<Team>;

export const TeamModel = model<Team>('Team', teamSchema);
