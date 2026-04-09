import { RotaEntryModel, type RotaEntryDocument } from '../models/RotaEntry.js';

class RotaRepository {
    async listForUserInRange(userId: string, startUtc: Date, endUtc: Date): Promise<RotaEntryDocument[]> {
        return RotaEntryModel.find({
            userId,
            startUtc: { $lt: endUtc },
            endUtc: { $gt: startUtc }
        })
            .sort({ startUtc: 1 })
            .exec();
    }

    async create(input: {
        userId: string;
        type: 'WORK' | 'FREE';
        startUtc: Date;
        endUtc: Date;
        note?: string;
        sourceType?: 'ONE_OFF' | 'RECURRING';
        recurrenceRule?: string | null;
    }): Promise<RotaEntryDocument> {
        return RotaEntryModel.create(input);
    }

    async updateById(id: string, userId: string, updates: Partial<{ type: 'WORK' | 'FREE'; startUtc: Date; endUtc: Date; note: string }>): Promise<RotaEntryDocument | null> {
        return RotaEntryModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).exec();
    }

    async deleteById(id: string, userId: string): Promise<boolean> {
        const deleted = await RotaEntryModel.findOneAndDelete({ _id: id, userId }).exec();
        return Boolean(deleted);
    }
}

export const rotaRepository = new RotaRepository();
