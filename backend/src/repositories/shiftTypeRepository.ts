import { Types } from 'mongoose';
import { ShiftTypeModel, type ShiftTypeDocument } from '../models/ShiftType.js';

function toObjectId(value: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(value)) {
        return null;
    }

    return new Types.ObjectId(value);
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ShiftTypeRepository {
    async listForUser(userId: string): Promise<ShiftTypeDocument[]> {
        return ShiftTypeModel.find({
            userId,
            deletedAt: null
        })
            .sort({ name: 1 })
            .exec();
    }

    async findByIdForUser(id: string, userId: string): Promise<ShiftTypeDocument | null> {
        const objectId = toObjectId(id);
        if (!objectId) {
            return null;
        }

        return ShiftTypeModel.findOne({ _id: objectId, userId, deletedAt: null }).exec();
    }

    async findByNameForUser(name: string, userId: string): Promise<ShiftTypeDocument | null> {
        return ShiftTypeModel.findOne({
            userId,
            deletedAt: null,
            name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
        }).exec();
    }

    async create(input: {
        userId: string;
        name: string;
        color: string;
    }): Promise<ShiftTypeDocument> {
        return ShiftTypeModel.create(input);
    }

    async updateById(
        id: string,
        userId: string,
        updates: Partial<{ name: string; color: string }>
    ): Promise<ShiftTypeDocument | null> {
        const objectId = toObjectId(id);
        if (!objectId) {
            return null;
        }

        return ShiftTypeModel.findOneAndUpdate(
            { _id: objectId, userId, deletedAt: null },
            updates,
            { new: true }
        ).exec();
    }

    async softDeleteById(id: string, userId: string): Promise<boolean> {
        const objectId = toObjectId(id);
        if (!objectId) {
            return false;
        }

        const deleted = await ShiftTypeModel.findOneAndUpdate(
            { _id: objectId, userId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true }
        ).exec();

        return Boolean(deleted);
    }
}

export const shiftTypeRepository = new ShiftTypeRepository();
