import type { GraphQLContext } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';

export function requireAuth(context: GraphQLContext): string {
    if (!context.authUser) {
        throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    return String(context.authUser._id);
}

export function requireVerifiedEmail(context: GraphQLContext): string {
    const userId = requireAuth(context);

    if (!context.authUser!.emailVerifiedAt) {
        throw new AppError('Please verify your email before using this feature.', 'FORBIDDEN', 403);
    }

    return userId;
}
