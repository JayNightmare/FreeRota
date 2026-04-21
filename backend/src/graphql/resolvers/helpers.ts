import type { GraphQLContext } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';
import { Types } from 'mongoose';
import { hasOrganizationPermission } from '../../utils/rbac.js';

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

export async function requireOrganizationPermission(
    context: GraphQLContext, 
    organizationIdRaw: string, 
    permission: string,
    scope?: { siteId?: Types.ObjectId; teamId?: Types.ObjectId }
): Promise<string> {
    const userId = requireAuth(context);
    const organizationId = new Types.ObjectId(organizationIdRaw);
    const userObjId = new Types.ObjectId(userId);

    const hasPermission = await hasOrganizationPermission(userObjId, organizationId, permission, scope);

    if (!hasPermission) {
        throw new AppError('You do not have permission to perform this action in this organization.', 'FORBIDDEN', 403);
    }

    return userId;
}
