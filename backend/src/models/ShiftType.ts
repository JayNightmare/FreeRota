import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const shiftTypeSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 64 },
        color: { type: String, required: true, trim: true },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

shiftTypeSchema.index(
    { userId: 1, name: 1 },
    {
        unique: true,
        partialFilterExpression: { deletedAt: null }
    }
);

export type ShiftType = InferSchemaType<typeof shiftTypeSchema> & { userId: Types.ObjectId };
export type ShiftTypeDocument = HydratedDocument<ShiftType>;

export const ShiftTypeModel = model<ShiftType>('ShiftType', shiftTypeSchema);
