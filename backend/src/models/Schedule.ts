import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const scheduleSchema = new Schema(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        version: { type: Number, required: true, default: 1 },
        status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED'], required: true, default: 'DRAFT' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        approvedAt: { type: Date, default: null },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

scheduleSchema.index({ organizationId: 1, teamId: 1, periodStart: 1 });

export type Schedule = InferSchemaType<typeof scheduleSchema> & { organizationId: Types.ObjectId, teamId?: Types.ObjectId | null, createdBy: Types.ObjectId, approvedBy?: Types.ObjectId | null };
export type ScheduleDocument = HydratedDocument<Schedule>;

export const ScheduleModel = model<Schedule>('Schedule', scheduleSchema);
