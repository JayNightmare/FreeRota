import { freeTimeService } from '../../services/freeTimeService.js';
import { requireAuth } from './helpers.js';

export const freeTimeResolver = {
    Query: {
        findCommonFreeTime: async (
            _parent: unknown,
            args: {
                userIds: string[];
                rangeStartUtc: string;
                rangeEndUtc: string;
                minDurationMinutes?: number;
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const viewerId = requireAuth(context);
            return freeTimeService.findOverlap({
                viewerId,
                userIds: args.userIds,
                rangeStartUtc: args.rangeStartUtc,
                rangeEndUtc: args.rangeEndUtc,
                minDurationMinutes: args.minDurationMinutes
            });
        }
    }
};
