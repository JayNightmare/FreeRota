import { AppError, assertOrThrow } from '../utils/errors.js';
import { shiftTypeRepository } from '../repositories/shiftTypeRepository.js';

const DEFAULT_SHIFT_COLORS = [
    '#1E3A8A',
    '#0F766E',
    '#92400E',
    '#BE123C',
    '#6D28D9',
    '#166534',
    '#334155',
    '#C2410C'
] as const;

function normalizeName(value: string): string {
    const trimmed = value.trim();
    assertOrThrow(trimmed.length > 0, 'Shift type name is required');
    assertOrThrow(trimmed.length <= 64, 'Shift type name must be 64 characters or fewer');
    return trimmed;
}

function normalizeColor(value?: string | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    assertOrThrow(hexColorRegex.test(trimmed), 'Color must be a valid hex value like #1E3A8A');

    return trimmed.toUpperCase();
}

function pickRandomDefaultColor(): string {
    const index = Math.floor(Math.random() * DEFAULT_SHIFT_COLORS.length);
    return DEFAULT_SHIFT_COLORS[index];
}

class ShiftTypeService {
    async listMyShiftTypes(userId: string) {
        return shiftTypeRepository.listForUser(userId);
    }

    async createShiftType(
        userId: string,
        input: {
            name: string;
            color?: string | null;
        }
    ) {
        const name = normalizeName(input.name);
        const color = normalizeColor(input.color) ?? pickRandomDefaultColor();

        const duplicate = await shiftTypeRepository.findByNameForUser(name, userId);
        if (duplicate) {
            throw new AppError('Shift type with this name already exists', 'CONFLICT', 409);
        }

        return shiftTypeRepository.create({
            userId,
            name,
            color
        });
    }

    async updateShiftType(
        userId: string,
        shiftTypeId: string,
        input: {
            name?: string;
            color?: string | null;
        }
    ) {
        assertOrThrow(
            Object.prototype.hasOwnProperty.call(input, 'name') ||
            Object.prototype.hasOwnProperty.call(input, 'color'),
            'No updates provided'
        );

        const updates: Partial<{ name: string; color: string }> = {};

        if (Object.prototype.hasOwnProperty.call(input, 'name')) {
            const nextName = normalizeName(input.name ?? '');
            const duplicate = await shiftTypeRepository.findByNameForUser(nextName, userId);
            if (duplicate && String(duplicate._id) !== shiftTypeId) {
                throw new AppError('Shift type with this name already exists', 'CONFLICT', 409);
            }
            updates.name = nextName;
        }

        if (Object.prototype.hasOwnProperty.call(input, 'color')) {
            updates.color = normalizeColor(input.color) ?? pickRandomDefaultColor();
        }

        const updated = await shiftTypeRepository.updateById(shiftTypeId, userId, updates);
        if (!updated) {
            throw new AppError('Shift type not found', 'NOT_FOUND', 404);
        }

        return updated;
    }

    async deleteShiftType(userId: string, shiftTypeId: string): Promise<boolean> {
        const deleted = await shiftTypeRepository.softDeleteById(shiftTypeId, userId);
        if (!deleted) {
            throw new AppError('Shift type not found', 'NOT_FOUND', 404);
        }

        return true;
    }

    async getByIdForUser(userId: string, shiftTypeId: string) {
        return shiftTypeRepository.findByIdForUser(shiftTypeId, userId);
    }
}

export const shiftTypeService = new ShiftTypeService();
