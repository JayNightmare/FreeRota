import type { GraphQLContext } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';

export function requireAuth(context: GraphQLContext): string {
    if (!context.authUser) {
        throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    return String(context.authUser._id);
}
