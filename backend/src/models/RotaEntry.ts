import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

export const rotaTypes = ['WORK', 'FREE'] as const;

const rotaEntrySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: rotaTypes, required: true, default: 'WORK' },
        startUtc: { type: Date, required: true },
        endUtc: { type: Date, required: true },
        note: { type: String, default: '' },
        shiftTypeId: { type: Schema.Types.ObjectId, ref: 'ShiftType', default: null },
        shiftTitle: { type: String, default: null, trim: true, maxlength: 64 },
        sourceType: { type: String, enum: ['ONE_OFF', 'RECURRING'], default: 'ONE_OFF' },
        recurrenceRule: { type: String, default: null },
        integrationSource: { type: String, default: null, trim: true, maxlength: 64 },
        externalEventId: { type: String, default: null, trim: true, maxlength: 256 },
        externalCalendarId: { type: String, default: null, trim: true, maxlength: 256 },
        externalInstanceStartUtc: { type: Date, default: null },
        importFingerprint: { type: String, default: null, trim: true, maxlength: 128 }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

rotaEntrySchema.index({ userId: 1, startUtc: 1, endUtc: 1 });
rotaEntrySchema.index({ userId: 1, importFingerprint: 1 }, { sparse: true });

export type RotaEntry = InferSchemaType<typeof rotaEntrySchema> & { userId: Types.ObjectId };
export type RotaEntryDocument = HydratedDocument<RotaEntry>;

export const RotaEntryModel = model<RotaEntry>('RotaEntry', rotaEntrySchema);
