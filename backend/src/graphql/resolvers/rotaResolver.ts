import { rotaService } from '../../services/rotaService.js';
import { privacyPolicyService } from '../../services/privacyPolicyService.js';
import { AppError } from '../../utils/errors.js';
import { requireAuth } from './helpers.js';

export const rotaResolver = {
    Query: {
        myRota: async (
            _parent: unknown,
            args: { rangeStartUtc: string; rangeEndUtc: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaService.listMyEntries(userId, args.rangeStartUtc, args.rangeEndUtc);
        },
        visibleRota: async (
            _parent: unknown,
            args: { userId: string; rangeStartUtc: string; rangeEndUtc: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const viewerId = requireAuth(context);
            const canView = await privacyPolicyService.canViewSchedule(viewerId, args.userId);
            if (!canView) {
                throw new AppError('Not allowed to view schedule', 'FORBIDDEN', 403);
            }

            return rotaService.listMyEntries(args.userId, args.rangeStartUtc, args.rangeEndUtc);
        }
    },
    Mutation: {
        createRotaEntry: async (
            _parent: unknown,
            args: { input: { type: 'WORK' | 'FREE'; startUtc: string; endUtc: string; note?: string } },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaService.createEntry(userId, args.input);
        },
        updateRotaEntry: async (
            _parent: unknown,
            args: {
                id: string;
                input: { type?: 'WORK' | 'FREE'; startUtc?: string; endUtc?: string; note?: string };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaService.updateEntry(userId, args.id, args.input);
        },
        deleteRotaEntry: async (_parent: unknown, args: { id: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return rotaService.deleteEntry(userId, args.id);
        }
    }
};
