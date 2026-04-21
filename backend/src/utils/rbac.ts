import { Types } from 'mongoose';
import { OrganizationMembershipModel } from '../models/OrganizationMembership.js';
import { RoleModel } from '../models/Role.js';

export async function hasOrganizationPermission(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
    requiredPermission: string,
    scope?: { siteId?: Types.ObjectId; teamId?: Types.ObjectId }
): Promise<boolean> {
    const membership = await OrganizationMembershipModel.findOne({ userId, organizationId, deletedAt: null }).lean();
    
    if (!membership) return false;
    
    // Validate scope if provided
    if (scope?.siteId && membership.scopes?.siteIds?.length) {
        const siteAllowed = membership.scopes.siteIds.some(id => id.toString() === scope.siteId!.toString());
        if (!siteAllowed) return false;
    }
    
    if (scope?.teamId && membership.scopes?.teamIds?.length) {
        const teamAllowed = membership.scopes.teamIds.some(id => id.toString() === scope.teamId!.toString());
        if (!teamAllowed) return false;
    }
    
    // Fetch roles
    if (!membership.roleIds?.length) return false;
    
    const roles = await RoleModel.find({ _id: { $in: membership.roleIds }, deletedAt: null }).lean();
    
    // Check if any role has the required permission
    return roles.some(role => role.permissions.includes(requiredPermission as any));
}
