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
        shiftTypeId?: string | null;
        shiftTitle?: string | null;
        sourceType?: 'ONE_OFF' | 'RECURRING';
        recurrenceRule?: string | null;
        integrationSource?: string | null;
        externalEventId?: string | null;
        externalCalendarId?: string | null;
        externalInstanceStartUtc?: Date | null;
        importFingerprint?: string | null;
    }): Promise<RotaEntryDocument> {
        return RotaEntryModel.create(input);
    }

    async findByImportFingerprint(userId: string, importFingerprint: string): Promise<RotaEntryDocument | null> {
        return RotaEntryModel.findOne({ userId, importFingerprint }).exec();
    }

    async deleteOverlappingInRange(userId: string, startUtc: Date, endUtc: Date): Promise<number> {
        const result = await RotaEntryModel.deleteMany({
            userId,
            startUtc: { $lt: endUtc },
            endUtc: { $gt: startUtc }
        }).exec();

        return result.deletedCount ?? 0;
    }

    async deleteByIdsForUser(userId: string, ids: string[]): Promise<number> {
        if (ids.length === 0) {
            return 0;
        }

        const result = await RotaEntryModel.deleteMany({
            userId,
            _id: { $in: ids }
        }).exec();

        return result.deletedCount ?? 0;
    }

    async updateById(
        id: string,
        userId: string,
        updates: Partial<{
            type: 'WORK' | 'FREE';
            startUtc: Date;
            endUtc: Date;
            note: string;
            shiftTypeId: string | null;
            shiftTitle: string | null;
        }>
    ): Promise<RotaEntryDocument | null> {
        return RotaEntryModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).exec();
    }

    async deleteById(id: string, userId: string): Promise<boolean> {
        const deleted = await RotaEntryModel.findOneAndDelete({ _id: id, userId }).exec();
        return Boolean(deleted);
    }
}

export const rotaRepository = new RotaRepository();
