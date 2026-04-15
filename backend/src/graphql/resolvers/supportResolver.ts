import type { ContactReason, ContactUrgency } from '../../services/supportService.js';
import { supportService } from '../../services/supportService.js';
import { requireAuth } from './helpers.js';
import { AppError } from '../../utils/errors.js';

export const supportResolver = {
    Mutation: {
        contactSupport: async (
            _parent: unknown,
            args: {
                input: {
                    title: string;
                    reason: ContactReason;
                    urgency: ContactUrgency;
                    message: string;
                };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            if (!context.authUser) {
                throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
            }

            return supportService.submitContactMessage(userId, context.authUser, args.input);
        }
    }
};
