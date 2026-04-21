import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const auditEventSchema = new Schema(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true },
        resource: { type: String, required: true },
        resourceId: { type: Schema.Types.ObjectId, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now, expires: 31536000 } // Auto-delete after 1 year (31536000 seconds)
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Append-only structure, no updatedAt
        versionKey: false
    }
);

export type AuditEvent = InferSchemaType<typeof auditEventSchema> & { organizationId: Types.ObjectId, actorId: Types.ObjectId, resourceId: Types.ObjectId };
export type AuditEventDocument = HydratedDocument<AuditEvent>;

export const AuditEventModel = model<AuditEvent>('AuditEvent', auditEventSchema);
