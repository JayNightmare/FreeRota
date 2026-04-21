import { Types } from 'mongoose';
import { OrganizationModel, type Organization } from '../models/Organization.js';
import { SiteModel, type Site } from '../models/Site.js';
import { TeamModel, type Team } from '../models/Team.js';
import { ScheduleModel, type Schedule } from '../models/Schedule.js';
import { OrganizationMembershipModel } from '../models/OrganizationMembership.js';
import { AppError } from '../utils/errors.js';

class TenantRepository {
    async findOrganizationsForUser(userId: string) {
        const memberships = await OrganizationMembershipModel.find({ userId, deletedAt: null }).lean();
        if (!memberships.length) return [];

        const orgIds = memberships.map(m => m.organizationId);
        return OrganizationModel.find({ _id: { $in: orgIds }, deletedAt: null }).lean();
    }

    async getMembership(userId: string, organizationId: string) {
        return OrganizationMembershipModel.findOne({ userId, organizationId, deletedAt: null }).lean();
    }

    async findOrganizationById(orgId: string) {
        return OrganizationModel.findOne({ _id: orgId, deletedAt: null }).lean();
    }

    async updateOrganization(orgId: string, updates: any) {
        const org = await OrganizationModel.findById(orgId);
        if (!org) throw new AppError('Organization not found', 'NOT_FOUND', 404);
        
        Object.assign(org, updates);
        await org.save();
        return org;
    }

    async findSitesForOrg(organizationId: string) {
        return SiteModel.find({ organizationId, deletedAt: null }).lean();
    }

    async findTeamsForOrg(organizationId: string, siteId?: string) {
        const filter: any = { organizationId, deletedAt: null };
        if (siteId) filter.siteId = siteId;
        return TeamModel.find(filter).lean();
    }

    async findSchedulesForOrg(organizationId: string, teamId: string) {
        return ScheduleModel.find({ organizationId, teamId, deletedAt: null }).lean();
    }

    async createSite(organizationId: string, name: string, regionCode: string | null, timezone: string): Promise<Site> {
        return SiteModel.create({
            organizationId: new Types.ObjectId(organizationId),
            name,
            regionCode,
            timezone
        });
    }

    async createTeam(organizationId: string, name: string, departmentName: string | null, siteId?: string | null): Promise<Team> {
        return TeamModel.create({
            organizationId: new Types.ObjectId(organizationId),
            siteId: siteId ? new Types.ObjectId(siteId) : null,
            name,
            departmentName
        });
    }

    async createSchedule(organizationId: string, createdBy: string, periodStart: Date, periodEnd: Date, teamId?: string | null): Promise<Schedule> {
        return ScheduleModel.create({
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(createdBy),
            teamId: teamId ? new Types.ObjectId(teamId) : null,
            periodStart,
            periodEnd,
            status: 'DRAFT',
            version: 1
        });
    }

    async updateScheduleStatus(scheduleId: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED', approvedByUserId?: string): Promise<Schedule> {
        const schedule = await ScheduleModel.findById(scheduleId);
        if (!schedule) throw new AppError('Schedule not found', 'NOT_FOUND', 404);

        schedule.status = status;
        if (status === 'PUBLISHED' || status === 'PENDING_APPROVAL') {
            if (approvedByUserId) {
                schedule.approvedBy = new Types.ObjectId(approvedByUserId);
                schedule.approvedAt = new Date();
            }
        }

        await schedule.save();
        return schedule;
    }
}

export const tenantRepository = new TenantRepository();
