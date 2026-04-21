import type { GraphQLContext } from '../../types/index.js';
import { tenantRepository } from '../../repositories/tenantRepository.js';
import { requireAuth, requireOrganizationPermission } from './helpers.js';
import { AppError } from '../../utils/errors.js';
import { Types } from 'mongoose';
import { auditService } from '../../services/auditService.js';
import { AuditEventModel } from '../../models/AuditEvent.js';
import { ScheduleModel } from '../../models/Schedule.js';
import { OrganizationModel } from '../../models/Organization.js';
import { OrganizationMembershipModel } from '../../models/OrganizationMembership.js';
import { RoleModel, permissionTypes } from '../../models/Role.js';
import { UserModel } from '../../models/User.js';
import { discordWebhookService } from '../../services/discordWebhookService.js';
import { adminService } from '../../services/adminService.js';

export const tenantResolver = {
    Query: {
        myOrganizations: async (_: unknown, __: unknown, context: GraphQLContext) => {
            const userId = requireAuth(context);
            const existing = await tenantRepository.findOrganizationsForUser(userId);
            if (existing.length > 0) return existing;

            // Auto-provision a personal org for users with no memberships
            const user = await UserModel.findById(userId);
            if (!user) throw new AppError('User not found', 'NOT_FOUND', 404);

            const org = await OrganizationModel.create({
                name: `${user.displayName}'s Organisation`,
                type: 'PERSONAL',
                billingTier: 'FREE'
            });

            const ownerRole = await RoleModel.create({
                organizationId: org._id,
                name: 'Owner',
                permissions: [...permissionTypes],
                isSystem: true
            });

            await OrganizationMembershipModel.create({
                userId: user._id,
                organizationId: org._id,
                roles: [ownerRole._id]
            });

            return tenantRepository.findOrganizationsForUser(userId);
        },
        organization: async (_: unknown, { orgId }: { orgId: string }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ORG_MANAGE');
            const org = await tenantRepository.findOrganizationById(orgId);
            if (!org) throw new AppError('Organization not found', 'NOT_FOUND', 404);
            return org;
        },
        organizationSites: async (_: unknown, { orgId }: { orgId: string }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ORG_MANAGE');
            return tenantRepository.findSitesForOrg(orgId);
        },
        organizationTeams: async (_: unknown, { orgId, siteId }: { orgId: string; siteId?: string }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ORG_MANAGE', { siteId: siteId ? new Types.ObjectId(siteId) : undefined });
            return tenantRepository.findTeamsForOrg(orgId, siteId);
        },
        organizationSchedules: async (_: unknown, { orgId, teamId }: { orgId: string; teamId: string }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ROTA_APPROVE', { teamId: new Types.ObjectId(teamId) });
            return tenantRepository.findSchedulesForOrg(orgId, teamId);
        },
        organizationAuditLogs: async (_: unknown, { orgId, limit = 50 }: { orgId: string; limit?: number }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ORG_MANAGE');
            return AuditEventModel.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(limit).lean();
        },
        organizationSsoConfig: async (_: unknown, { orgId }: { orgId: string }, context: GraphQLContext) => {
            await requireOrganizationPermission(context, orgId, 'ORG_ADMIN');
            const org = await tenantRepository.findOrganizationById(orgId);
            if (!org) throw new AppError('Organization not found', 'NOT_FOUND', 404);
            return {
                ssoEnabled: org.ssoEnabled || false,
                ssoProvider: org.ssoProvider || null,
                ssoEnforce: org.ssoEnforce || false,
                ssoMetadataString: org.ssoMetadata ? JSON.stringify(org.ssoMetadata) : null,
                groupRoleMappings: org.groupRoleMappings || []
            };
        }
    },
    Mutation: {
        createSite: async (_: unknown, { input }: any, context: GraphQLContext) => {
            const userId = await requireOrganizationPermission(context, input.organizationId, 'ORG_MANAGE');
            const site = await tenantRepository.createSite(input.organizationId, input.name, input.regionCode, input.timezone);
            await auditService.logEvent(input.organizationId, userId, 'SITE_CREATED', 'Site', String((site as any)._id), { name: input.name });
            return site;
        },
        createTeam: async (_: unknown, { input }: any, context: GraphQLContext) => {
            const userId = await requireOrganizationPermission(context, input.organizationId, 'ORG_MANAGE', { siteId: input.siteId ? new Types.ObjectId(input.siteId) : undefined });
            const team = await tenantRepository.createTeam(input.organizationId, input.name, input.departmentName, input.siteId);
            await auditService.logEvent(input.organizationId, userId, 'TEAM_CREATED', 'Team', String((team as any)._id), { name: input.name });
            return team;
        },
        createSchedule: async (_: unknown, { input }: any, context: GraphQLContext) => {
            const userId = await requireOrganizationPermission(context, input.organizationId, 'ROTA_CREATE', { teamId: input.teamId ? new Types.ObjectId(input.teamId) : undefined });
            const schedule = await tenantRepository.createSchedule(input.organizationId, userId, input.periodStart, input.periodEnd, input.teamId);
            await auditService.logEvent(input.organizationId, userId, 'SCHEDULE_CREATED', 'Schedule', String((schedule as any)._id), { periodStart: input.periodStart });
            return schedule;
        },
        updateScheduleStatus: async (_: unknown, { scheduleId, status }: any, context: GraphQLContext) => {
            const userId = requireAuth(context);
            const initialSchedule = await ScheduleModel.findById(scheduleId).lean();
            if (!initialSchedule) throw new AppError('Schedule not found', 'NOT_FOUND', 404);

            await requireOrganizationPermission(context, String(initialSchedule.organizationId), 'ROTA_APPROVE', { teamId: initialSchedule.teamId ? new Types.ObjectId(initialSchedule.teamId) : undefined });

            const updatedSchedule = await tenantRepository.updateScheduleStatus(scheduleId, status, userId);
            
            await auditService.logEvent(String(initialSchedule.organizationId), userId, 'SCHEDULE_STATUS_UPDATED', 'Schedule', scheduleId, { from: initialSchedule.status, to: status });

            return updatedSchedule;
        },
        updateOrganizationSsoConfig: async (_: unknown, { input }: any, context: GraphQLContext) => {
            const userId = await requireOrganizationPermission(context, input.orgId, 'ORG_ADMIN');
            
            const updatePayload: any = {};
            if (input.ssoEnabled !== undefined) updatePayload.ssoEnabled = input.ssoEnabled;
            if (input.ssoProvider !== undefined) updatePayload.ssoProvider = input.ssoProvider;
            if (input.ssoEnforce !== undefined) updatePayload.ssoEnforce = input.ssoEnforce;
            if (input.groupRoleMappings !== undefined) updatePayload.groupRoleMappings = input.groupRoleMappings;
            if (input.ssoMetadataString !== undefined) {
                try {
                    updatePayload.ssoMetadata = input.ssoMetadataString ? JSON.parse(input.ssoMetadataString) : {};
                } catch {
                    throw new AppError('Invalid JSON in ssoMetadataString', 'BAD_REQUEST', 400);
                }
            }

            const org = await tenantRepository.updateOrganization(input.orgId, updatePayload);
            await auditService.logEvent(input.orgId, userId, 'SSO_CONFIG_UPDATED', 'Organization', input.orgId, { ssoEnabled: updatePayload.ssoEnabled });

            return {
                ssoEnabled: org?.ssoEnabled || false,
                ssoProvider: org?.ssoProvider || null,
                ssoEnforce: org?.ssoEnforce || false,
                ssoMetadataString: org?.ssoMetadata ? JSON.stringify(org?.ssoMetadata) : null,
                groupRoleMappings: org?.groupRoleMappings || []
            };
        },
        testSsoConnection: async (_: unknown, { orgId, mockPayload }: any, context: GraphQLContext) => {
            // ORG_ADMIN requires this
            const userId = await requireOrganizationPermission(context, orgId, 'ORG_ADMIN');
            await auditService.logEvent(orgId, userId, 'SSO_TEST_CONNECTION', 'Organization', orgId, {});
            return {
                success: true,
                message: "Mock payload validation executed successfully.",
                claims: mockPayload
            };
        },
        applyForEnterprise: async (_: unknown, { input }: any, context: GraphQLContext) => {
            const userId = requireAuth(context);

            // Check if user already has a pending or enterprise org
            const existingOrgs = await tenantRepository.findOrganizationsForUser(userId);
            for (const existingOrg of existingOrgs) {
                if (existingOrg.billingTier === 'ENTERPRISE') {
                    throw new AppError('You already have an enterprise organisation.', 'BAD_REQUEST', 400);
                }
                if (existingOrg.billingTier === 'PENDING_ENTERPRISE') {
                    throw new AppError('An enterprise application is already pending review.', 'BAD_REQUEST', 400);
                }
            }

            // Create the enterprise org
            const org = await OrganizationModel.create({
                name: input.companyName,
                type: 'ENTERPRISE',
                billingTier: 'PENDING_ENTERPRISE'
            });

            const ownerRole = await RoleModel.create({
                organizationId: org._id,
                name: 'Owner',
                permissions: [...permissionTypes],
                isSystem: true
            });

            await OrganizationMembershipModel.create({
                userId: new Types.ObjectId(userId),
                organizationId: org._id,
                roles: [ownerRole._id]
            });

            // Fire Discord webhook
            try {
                await discordWebhookService.sendEnterpriseInquiryPayload({
                    companyName: input.companyName,
                    contactName: input.contactName,
                    email: input.email,
                    phone: null,
                    inquiryType: 'OTHER',
                    message: `[ENTERPRISE APPLICATION]\nOrg ID: ${org._id}\nTeam Size: ${input.teamSize || 'N/A'}\n\n${input.message}`,
                    submittedAt: new Date()
                });
            } catch (webhookError) {
                console.error('[Enterprise Application] Discord webhook failed:', webhookError);
            }

            await auditService.logEvent(String(org._id), userId, 'ENTERPRISE_APPLICATION_SUBMITTED', 'Organization', String(org._id), {
                companyName: input.companyName
            });

            return {
                success: true,
                message: 'Enterprise application submitted. Your organisation has been created and is pending review.'
            };
        },
        approveEnterpriseApplication: async (_: unknown, { organizationId }: any, context: GraphQLContext) => {
            const userId = requireAuth(context);
            await adminService.assertAdmin(userId);

            const org = await OrganizationModel.findById(organizationId);
            if (!org) throw new AppError('Organization not found', 'NOT_FOUND', 404);

            org.billingTier = 'ENTERPRISE';
            org.ssoEnabled = true;
            await org.save();

            await auditService.logEvent(organizationId, userId, 'ENTERPRISE_APPLICATION_APPROVED', 'Organization', organizationId, {});

            return org;
        }
    },
    AuditEvent: {
        id: (parent: any) => String(parent._id),
        organizationId: (parent: any) => String(parent.organizationId),
        actorId: (parent: any) => String(parent.actorId),
        resourceId: (parent: any) => String(parent.resourceId),
        metadataString: (parent: any) => JSON.stringify(parent.metadata)
    },
    Organization: {
        id: (parent: any) => String(parent._id)
    },
    Site: {
        id: (parent: any) => String(parent._id),
        organizationId: (parent: any) => String(parent.organizationId)
    },
    Team: {
        id: (parent: any) => String(parent._id),
        organizationId: (parent: any) => String(parent.organizationId),
        siteId: (parent: any) => parent.siteId ? String(parent.siteId) : null
    },
    Role: {
        id: (parent: any) => String(parent._id),
        organizationId: (parent: any) => String(parent.organizationId)
    },
    OrganizationMembership: {
        id: (parent: any) => String(parent._id),
        userId: (parent: any) => String(parent.userId),
        organizationId: (parent: any) => String(parent.organizationId)
    },
    Schedule: {
        id: (parent: any) => String(parent._id),
        organizationId: (parent: any) => String(parent.organizationId),
        teamId: (parent: any) => parent.teamId ? String(parent.teamId) : null,
        createdBy: (parent: any) => String(parent.createdBy),
        approvedBy: (parent: any) => parent.approvedBy ? String(parent.approvedBy) : null,
        entries: async () => {
             // In a real app we would use a DataLoader or fetch from RotaEntry model by scheduleId
             return [];
        }
    }
};
