import { rotaRepository } from '../repositories/rotaRepository.js';
import { assertOrThrow } from '../utils/errors.js';
import { privacyPolicyService } from './privacyPolicyService.js';

export interface FreeWindow {
    startUtc: string;
    endUtc: string;
    durationMinutes: number;
}

const SLOT_MINUTES = 30;

function toSlots(rangeStart: Date, rangeEnd: Date): Date[] {
    const slots: Date[] = [];
    const cursor = new Date(rangeStart);

    while (cursor < rangeEnd) {
        slots.push(new Date(cursor));
        cursor.setUTCMinutes(cursor.getUTCMinutes() + SLOT_MINUTES);
    }

    return slots;
}

function markBusySlots(slots: Date[], busyIntervals: Array<{ startUtc: Date; endUtc: Date }>): boolean[] {
    const freeMask = Array(slots.length).fill(true);

    for (const interval of busyIntervals) {
        for (let i = 0; i < slots.length; i += 1) {
            const slotStart = slots[i];
            const slotEnd = new Date(slotStart);
            slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + SLOT_MINUTES);

            const overlaps = slotStart < interval.endUtc && slotEnd > interval.startUtc;
            if (overlaps) {
                freeMask[i] = false;
            }
        }
    }

    return freeMask;
}

function collapseToWindows(slots: Date[], mask: boolean[], minDurationMinutes: number): FreeWindow[] {
    const windows: FreeWindow[] = [];

    let runStart = -1;
    for (let i = 0; i <= mask.length; i += 1) {
        const isFree = i < mask.length ? mask[i] : false;

        if (isFree && runStart === -1) {
            runStart = i;
            continue;
        }

        if (!isFree && runStart !== -1) {
            const start = slots[runStart];
            const end = new Date(slots[i - 1]);
            end.setUTCMinutes(end.getUTCMinutes() + SLOT_MINUTES);

            const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
            if (durationMinutes >= minDurationMinutes) {
                windows.push({
                    startUtc: start.toISOString(),
                    endUtc: end.toISOString(),
                    durationMinutes
                });
            }

            runStart = -1;
        }
    }

    return windows;
}

class FreeTimeService {
    async findOverlap(input: {
        viewerId: string;
        userIds: string[];
        rangeStartUtc: string;
        rangeEndUtc: string;
        minDurationMinutes?: number;
    }): Promise<FreeWindow[]> {
        assertOrThrow(input.userIds.length > 0, 'At least one userId is required');

        const rangeStart = new Date(input.rangeStartUtc);
        const rangeEnd = new Date(input.rangeEndUtc);

        assertOrThrow(!Number.isNaN(rangeStart.getTime()), 'Invalid rangeStartUtc');
        assertOrThrow(!Number.isNaN(rangeEnd.getTime()), 'Invalid rangeEndUtc');
        assertOrThrow(rangeStart < rangeEnd, 'rangeStartUtc must be before rangeEndUtc');

        const minDurationMinutes = input.minDurationMinutes ?? SLOT_MINUTES;
        const slots = toSlots(rangeStart, rangeEnd);

        let groupMask = Array(slots.length).fill(true);

        for (const userId of input.userIds) {
            const canView = await privacyPolicyService.canViewSchedule(input.viewerId, userId);
            assertOrThrow(canView, `Schedule access denied for user ${userId}`, 'FORBIDDEN', 403);

            const entries = await rotaRepository.listForUserInRange(userId, rangeStart, rangeEnd);
            const busyIntervals = entries
                .filter((entry) => entry.type === 'WORK')
                .map((entry) => ({ startUtc: entry.startUtc, endUtc: entry.endUtc }));

            const userMask = markBusySlots(slots, busyIntervals);
            groupMask = groupMask.map((isFree, index) => isFree && userMask[index]);
        }

        return collapseToWindows(slots, groupMask, minDurationMinutes);
    }
}

export const freeTimeService = new FreeTimeService();
