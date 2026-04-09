import { rotaRepository } from '../repositories/rotaRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';

export interface RotaInput {
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note?: string;
}

function parseInterval(startUtc: string, endUtc: string): { start: Date; end: Date } {
    const start = new Date(startUtc);
    const end = new Date(endUtc);

    assertOrThrow(!Number.isNaN(start.getTime()), 'Invalid startUtc');
    assertOrThrow(!Number.isNaN(end.getTime()), 'Invalid endUtc');
    assertOrThrow(start < end, 'startUtc must be before endUtc');

    return { start, end };
}

class RotaService {
    async listMyEntries(userId: string, rangeStartUtc: string, rangeEndUtc: string) {
        const { start, end } = parseInterval(rangeStartUtc, rangeEndUtc);
        return rotaRepository.listForUserInRange(userId, start, end);
    }

    async createEntry(userId: string, input: RotaInput) {
        const { start, end } = parseInterval(input.startUtc, input.endUtc);

        return rotaRepository.create({
            userId,
            type: input.type,
            startUtc: start,
            endUtc: end,
            note: input.note ?? ''
        });
    }

    async updateEntry(userId: string, entryId: string, input: Partial<RotaInput>) {
        const updates: Partial<{ type: 'WORK' | 'FREE'; startUtc: Date; endUtc: Date; note: string }> = {};

        if (input.type) {
            updates.type = input.type;
        }

        if (input.startUtc || input.endUtc) {
            if (!input.startUtc || !input.endUtc) {
                throw new AppError('startUtc and endUtc must be updated together', 'BAD_REQUEST', 400);
            }

            const { start, end } = parseInterval(input.startUtc, input.endUtc);
            updates.startUtc = start;
            updates.endUtc = end;
        }

        if (typeof input.note === 'string') {
            updates.note = input.note;
        }

        const updated = await rotaRepository.updateById(entryId, userId, updates);
        if (!updated) {
            throw new AppError('Rota entry not found', 'NOT_FOUND', 404);
        }

        return updated;
    }

    async deleteEntry(userId: string, entryId: string): Promise<boolean> {
        const deleted = await rotaRepository.deleteById(entryId, userId);
        if (!deleted) {
            throw new AppError('Rota entry not found', 'NOT_FOUND', 404);
        }

        return true;
    }
}

export const rotaService = new RotaService();
