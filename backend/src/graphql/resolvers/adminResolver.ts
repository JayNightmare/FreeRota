import { adminService } from '../../services/adminService.js';
import { AppError } from '../../utils/errors.js';
import { requireAuth, requireVerifiedEmail } from './helpers.js';

export const adminResolver = {
    Query: {
        myAdminApplication: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return adminService.myLatestApplication(userId);
        },
        pendingAdminApplications: async (
            _parent: unknown,
            args: { limit?: number },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return adminService.listPendingApplications(userId, context.authUser?.username, args.limit ?? 25);
        }
    },
    Mutation: {
        applyForAdmin: async (
            _parent: unknown,
            args: {
                input: {
                    motivation: string;
                    discordHandle?: string | null;
                };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireVerifiedEmail(context);
            if (!context.authUser) {
                throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
            }

            return adminService.submitApplication(userId, context.authUser, args.input);
        },
        approveAdminApplication: async (
            _parent: unknown,
            args: { applicationId: string; reviewNote?: string | null },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return adminService.approveApplication(userId, context.authUser?.username, args.applicationId, args.reviewNote);
        },
        rejectAdminApplication: async (
            _parent: unknown,
            args: { applicationId: string; reviewNote: string },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return adminService.rejectApplication(userId, context.authUser?.username, args.applicationId, args.reviewNote);
        }
    }
};
