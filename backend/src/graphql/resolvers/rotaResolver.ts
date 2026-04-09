import { rotaService } from '../../services/rotaService.js';
import { rotaImportService } from '../../services/rotaImportService.js';
import { calendarImportService, type DeviceCalendarEventInput } from '../../services/calendarImportService.js';
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
            args: {
                input: {
                    type: 'WORK' | 'FREE';
                    startUtc: string;
                    endUtc: string;
                    note?: string;
                    shiftTypeId?: string | null;
                    shiftTitle?: string | null;
                };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaService.createEntry(userId, args.input);
        },
        updateRotaEntry: async (
            _parent: unknown,
            args: {
                id: string;
                input: {
                    type?: 'WORK' | 'FREE';
                    startUtc?: string;
                    endUtc?: string;
                    note?: string;
                    shiftTypeId?: string | null;
                    shiftTitle?: string | null;
                };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaService.updateEntry(userId, args.id, args.input);
        },
        deleteRotaEntry: async (_parent: unknown, args: { id: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return rotaService.deleteEntry(userId, args.id);
        },
        previewRotaScreenshot: async (
            _parent: unknown,
            args: { imageBase64: string; referenceDate?: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            requireAuth(context);
            return rotaImportService.previewFromScreenshot({
                timezone: context.authUser?.timezone ?? 'UTC',
                imageBase64: args.imageBase64,
                referenceDate: args.referenceDate
            });
        },
        importRotaScreenshot: async (
            _parent: unknown,
            args: { imageBase64: string; referenceDate?: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return rotaImportService.importFromScreenshot({
                userId,
                timezone: context.authUser?.timezone ?? 'UTC',
                imageBase64: args.imageBase64,
                referenceDate: args.referenceDate
            });
        },
        previewDeviceCalendarImport: async (
            _parent: unknown,
            args: { events: DeviceCalendarEventInput[] },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);

            return calendarImportService.previewFromDeviceCalendar({
                userId,
                events: args.events
            });
        },
        importDeviceCalendar: async (
            _parent: unknown,
            args: { events: DeviceCalendarEventInput[]; duplicateMode?: string | null },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);

            return calendarImportService.importFromDeviceCalendar({
                userId,
                events: args.events,
                duplicateMode: args.duplicateMode ?? 'SKIP_DUPLICATES'
            });
        }
    }
};
