import { rotaRepository } from '../repositories/rotaRepository.js';
import { shiftTypeRepository } from '../repositories/shiftTypeRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';

export interface RotaInput {
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note?: string;
    shiftTypeId?: string | null;
    shiftTitle?: string | null;
    sourceType?: 'ONE_OFF' | 'RECURRING';
    recurrenceRule?: string | null;
    integrationSource?: string | null;
    externalEventId?: string | null;
    externalCalendarId?: string | null;
    externalInstanceStartUtc?: string | null;
    importFingerprint?: string | null;
}

function parseInterval(startUtc: string, endUtc: string): { start: Date; end: Date } {
    const start = new Date(startUtc);
    const end = new Date(endUtc);

    assertOrThrow(!Number.isNaN(start.getTime()), 'Invalid startUtc');
    assertOrThrow(!Number.isNaN(end.getTime()), 'Invalid endUtc');
    assertOrThrow(start < end, 'startUtc must be before endUtc');

    return { start, end };
}

function normalizeShiftTitle(value?: string | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    assertOrThrow(trimmed.length <= 64, 'shiftTitle must be 64 characters or fewer');
    return trimmed;
}

function normalizeMetadataString(value?: string | null, maxLength = 256): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    assertOrThrow(trimmed.length <= maxLength, `metadata value must be ${maxLength} characters or fewer`);
    return trimmed;
}

class RotaService {
    private async resolveShiftTypeId(userId: string, shiftTypeId?: string | null): Promise<string | null> {
        if (typeof shiftTypeId !== 'string') {
            return null;
        }

        const trimmed = shiftTypeId.trim();
        if (!trimmed) {
            return null;
        }

        const shiftType = await shiftTypeRepository.findByIdForUser(trimmed, userId);
        if (!shiftType) {
            throw new AppError('Shift type not found', 'NOT_FOUND', 404);
        }

        return String(shiftType._id);
    }

    async listMyEntries(userId: string, rangeStartUtc: string, rangeEndUtc: string) {
        const { start, end } = parseInterval(rangeStartUtc, rangeEndUtc);
        return rotaRepository.listForUserInRange(userId, start, end);
    }

    async createEntry(userId: string, input: RotaInput) {
        const { start, end } = parseInterval(input.startUtc, input.endUtc);
        const shiftTypeId = await this.resolveShiftTypeId(userId, input.shiftTypeId);
        const shiftTitle = normalizeShiftTitle(input.shiftTitle);

        const sourceType = input.sourceType === 'RECURRING' ? 'RECURRING' : 'ONE_OFF';
        const recurrenceRule = normalizeMetadataString(input.recurrenceRule ?? null, 512);
        const integrationSource = normalizeMetadataString(input.integrationSource ?? null, 64);
        const externalEventId = normalizeMetadataString(input.externalEventId ?? null, 256);
        const externalCalendarId = normalizeMetadataString(input.externalCalendarId ?? null, 256);
        const importFingerprint = normalizeMetadataString(input.importFingerprint ?? null, 128);

        const externalInstanceStartUtc = (() => {
            if (!input.externalInstanceStartUtc) {
                return null;
            }

            const parsed = new Date(input.externalInstanceStartUtc);
            if (Number.isNaN(parsed.getTime())) {
                return null;
            }

            return parsed;
        })();

        return rotaRepository.create({
            userId,
            type: input.type,
            startUtc: start,
            endUtc: end,
            note: input.note ?? '',
            shiftTypeId,
            shiftTitle,
            sourceType,
            recurrenceRule,
            integrationSource,
            externalEventId,
            externalCalendarId,
            externalInstanceStartUtc,
            importFingerprint
        });
    }

    async updateEntry(userId: string, entryId: string, input: Partial<RotaInput>) {
        const updates: Partial<{
            type: 'WORK' | 'FREE';
            startUtc: Date;
            endUtc: Date;
            note: string;
            shiftTypeId: string | null;
            shiftTitle: string | null;
        }> = {};

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

        if (Object.prototype.hasOwnProperty.call(input, 'shiftTypeId')) {
            updates.shiftTypeId = await this.resolveShiftTypeId(userId, input.shiftTypeId ?? null);
        }

        if (Object.prototype.hasOwnProperty.call(input, 'shiftTitle')) {
            updates.shiftTitle = normalizeShiftTitle(input.shiftTitle ?? null);
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
