import { OrganizationModel } from '../models/Organization.js';
import { UserModel } from '../models/User.js';
import { OrganizationMembershipModel } from '../models/OrganizationMembership.js';
import { auditService } from './auditService.js';
import { signAuthToken } from '../utils/jwt.js';
import crypto from 'crypto';

export interface SsoAssertionPayload {
    idpUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    groups: string[];
}

export class SsoService {
    /**
     * Simulates generating a SAML/OIDC Redirect URL.
     */
    generateMockRedirectUrl(orgId: string): string {
        return `/desktop/re/sso-mock?orgId=${orgId}&nonce=${crypto.randomBytes(8).toString('hex')}`;
    }

    /**
     * Processes an incoming SAML/OIDC assertion.
     * 1. Resolves Org & Verification.
     * 2. JIT Provisioning & SSO Identity Mapping
     * 3. Group -> Role structural sync
     * 4. Returns JWT Auth string.
     */
    async processAssertion(payload: SsoAssertionPayload, orgId: string): Promise<string> {
        const org = await OrganizationModel.findById(orgId).lean();
        if (!org || !org.ssoEnabled) {
            throw new Error('Valid organization SAML configuration not found or SSO is disabled.');
        }

        // 1. Resolve User (by SSO Identity or Email match)
        let user = await UserModel.findOne({
            'ssoIdentities.organizationId': org._id,
            'ssoIdentities.idpUserId': payload.idpUserId
        });

        if (!user) {
            // Attempt to bind by exact email
            user = await UserModel.findOne({ email: payload.email.toLowerCase() });

            if (!user) {
                // JIT Provisioning
                const baseUsername = payload.email.split('@')[0] || `user_${crypto.randomBytes(4).toString('hex')}`;
                user = await UserModel.create({
                    email: payload.email.toLowerCase(),
                    username: `${baseUsername}_${crypto.randomBytes(3).toString('hex')}`,
                    passwordHash: crypto.randomBytes(32).toString('hex'), // Unusable password for SSO-only
                    displayName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || baseUsername,
                    activeOrganizationId: org._id,
                    ssoIdentities: [{
                        organizationId: org._id,
                        idpUserId: payload.idpUserId
                    }]
                });
            } else {
                // Bind existing identity
                user.ssoIdentities.push({
                    organizationId: org._id,
                    idpUserId: payload.idpUserId
                });
                await user.save();
            }
        }

        // 2. Resolve Role Mappings
        const assignedRoleIds = new Set<string>();
        for (const mapping of org.groupRoleMappings) {
            if (payload.groups.includes(mapping.idpGroup)) {
                assignedRoleIds.add(mapping.roleId.toString());
            }
        }

        // 3. Upsert Membership & Apply Roles
        let membership = await OrganizationMembershipModel.findOne({
            organizationId: org._id,
            userId: user._id
        });

        if (!membership) {
            membership = new OrganizationMembershipModel({
                organizationId: org._id,
                userId: user._id,
                roles: []
            });
        }

        // We will just replace all roles with the mapped ones since it's SSO controlled
        // In reality, we might merge them with local DB roles, but enterprise buyers 
        // often want strict IdP structural enforcement.
        membership.roleIds = Array.from(assignedRoleIds) as any;
        await membership.save();

        // 4. Audit SSO Login Step
        await auditService.logEvent(
            org._id.toString(),
            user._id.toString(),
            'SSO_LOGIN_SUCCESS',
            'User',
            user._id.toString(),
            {
                idpUserId: payload.idpUserId,
                groupsMapped: assignedRoleIds.size
            }
        );

        return signAuthToken(user);
    }
}

export const ssoService = new SsoService();
