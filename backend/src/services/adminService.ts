import type { AdminApplicationStatus } from '../models/AdminApplication.js';
import { adminApplicationRepository } from '../repositories/adminApplicationRepository.js';
import { adminRepository } from '../repositories/adminRepository.js';
import type { AuthenticatedUser } from '../types/index.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { discordWebhookService } from './discordWebhookService.js';
import { env } from '../config/env.js';

interface AdminApplicationView {
    id: string;
    userId: string;
    applicantUsername: string;
    applicantDisplayName: string;
    applicantEmail: string;
    motivation: string;
    discordHandle: string | null;
    status: AdminApplicationStatus;
    submittedAt: Date;
    reviewedAt: Date | null;
    reviewedByUserId: string | null;
    reviewNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface SubmitAdminApplicationInput {
    motivation: string;
    discordHandle?: string | null;
}

interface SubmitAdminApplicationResult {
    success: boolean;
    message: string;
    application: AdminApplicationView;
    discordDelivered: boolean;
}

function toApplicationView(document: {
    _id: unknown;
    userId: unknown;
    applicantUsername: string;
    applicantDisplayName: string;
    applicantEmail: string;
    motivation: string;
    discordHandle?: string | null;
    status: AdminApplicationStatus;
    submittedAt: Date;
    reviewedAt?: Date | null;
    reviewedByUserId?: unknown;
    reviewNote?: string | null;
    createdAt: Date;
    updatedAt: Date;
}): AdminApplicationView {
    return {
        id: String(document._id),
        userId: String(document.userId),
        applicantUsername: document.applicantUsername,
        applicantDisplayName: document.applicantDisplayName,
        applicantEmail: document.applicantEmail,
        motivation: document.motivation,
        discordHandle: document.discordHandle ?? null,
        status: document.status,
        submittedAt: document.submittedAt,
        reviewedAt: document.reviewedAt ?? null,
        reviewedByUserId: document.reviewedByUserId ? String(document.reviewedByUserId) : null,
        reviewNote: document.reviewNote ?? null,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
    };
}

function normalizeOptionalText(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
}

function normalizeReviewNote(reviewNote?: string | null): string | null {
    const normalized = normalizeOptionalText(reviewNote);
    if (!normalized) {
        return null;
    }

    assertOrThrow(normalized.length <= 500, 'Review note cannot exceed 500 characters.', 'BAD_USER_INPUT', 400);
    return normalized;
}

class AdminService {
    private async canUseBootstrapReviewer(username?: string): Promise<boolean> {
        const normalizedUsername = username?.trim().toLowerCase();
        if (!normalizedUsername) {
            return false;
        }

        if (!env.ADMIN_BOOTSTRAP_USERNAMES.includes(normalizedUsername)) {
            return false;
        }

        const activeAdminCount = await adminRepository.countActiveAdmins();
        return activeAdminCount === 0;
    }

    async isAdmin(userId: string): Promise<boolean> {
        return adminRepository.isUserAdmin(userId);
    }

    async assertAdmin(userId: string): Promise<void> {
        const admin = await adminRepository.isUserAdmin(userId);
        if (!admin) {
            throw new AppError('Admin access required', 'FORBIDDEN', 403);
        }
    }

    async assertCanReviewApplications(userId: string, username?: string): Promise<void> {
        if (await adminRepository.isUserAdmin(userId)) {
            return;
        }

        if (await this.canUseBootstrapReviewer(username)) {
            return;
        }

        throw new AppError('Admin access required', 'FORBIDDEN', 403);
    }

    async submitApplication(
        userId: string,
        authUser: AuthenticatedUser,
        input: SubmitAdminApplicationInput
    ): Promise<SubmitAdminApplicationResult> {
        const motivation = input.motivation.trim();
        const discordHandle = normalizeOptionalText(input.discordHandle);

        assertOrThrow(motivation.length >= 20, 'Motivation must be at least 20 characters.', 'BAD_USER_INPUT', 400);
        assertOrThrow(motivation.length <= 3000, 'Motivation cannot exceed 3000 characters.', 'BAD_USER_INPUT', 400);

        const isAlreadyAdmin = await adminRepository.isUserAdmin(userId);
        if (isAlreadyAdmin) {
            throw new AppError('User is already an admin.', 'CONFLICT', 409);
        }

        const existingPending = await adminApplicationRepository.findPendingByUserId(userId);
        if (existingPending) {
            throw new AppError('An admin application is already pending.', 'CONFLICT', 409);
        }

        const application = await adminApplicationRepository.createPending({
            userId,
            applicantUsername: authUser.username,
            applicantDisplayName: authUser.displayName,
            applicantEmail: authUser.email,
            motivation,
            discordHandle
        });

        if (!application) {
            throw new AppError('Unable to create admin application.', 'INTERNAL', 500);
        }

        let discordDelivered = false;

        if (discordWebhookService.isAdminApprovalConfigured()) {
            try {
                await discordWebhookService.sendAdminApplicationPayload({
                    applicationId: String(application._id),
                    userId,
                    username: authUser.username,
                    displayName: authUser.displayName,
                    email: authUser.email,
                    motivation,
                    discordHandle,
                    submittedAt: application.submittedAt
                });
                discordDelivered = true;
            } catch (error) {
                console.error('[AdminService] Failed to send admin application webhook', {
                    applicationId: String(application._id),
                    userId,
                    error
                });
            }
        }

        return {
            success: true,
            message: discordDelivered
                ? 'Admin application submitted for Discord review.'
                : 'Admin application submitted. Discord notification is currently unavailable.',
            application: toApplicationView(application),
            discordDelivered
        };
    }

    async myLatestApplication(userId: string): Promise<AdminApplicationView | null> {
        const application = await adminApplicationRepository.findLatestByUserId(userId);
        if (!application) {
            return null;
        }

        return toApplicationView(application);
    }

    async listPendingApplications(requesterUserId: string, requesterUsername?: string, limit = 25): Promise<AdminApplicationView[]> {
        await this.assertCanReviewApplications(requesterUserId, requesterUsername);
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const applications = await adminApplicationRepository.listByStatus('PENDING', safeLimit);
        return applications.map((application) => toApplicationView(application));
    }

    async approveApplication(
        requesterUserId: string,
        requesterUsername: string | undefined,
        applicationId: string,
        reviewNote?: string | null
    ): Promise<AdminApplicationView> {
        await this.assertCanReviewApplications(requesterUserId, requesterUsername);

        const application = await adminApplicationRepository.findById(applicationId);
        if (!application || application.status !== 'PENDING') {
            throw new AppError('Admin application not found', 'NOT_FOUND', 404);
        }

        await adminRepository.grantAdmin(String(application.userId), requesterUserId, String(application._id));

        const reviewed = await adminApplicationRepository.markReviewed(
            applicationId,
            'APPROVED',
            requesterUserId,
            normalizeReviewNote(reviewNote)
        );

        if (!reviewed) {
            throw new AppError('Admin application not found', 'NOT_FOUND', 404);
        }

        if (discordWebhookService.isAdminApprovalConfigured()) {
            try {
                await discordWebhookService.sendAdminApplicationDecisionPayload({
                    applicationId: String(reviewed._id),
                    decision: 'APPROVED',
                    reviewerUserId: requesterUserId,
                    applicantUserId: String(reviewed.userId),
                    applicantUsername: reviewed.applicantUsername,
                    reviewNote: reviewed.reviewNote ?? null
                });
            } catch (error) {
                console.error('[AdminService] Failed to send admin approval webhook', {
                    applicationId: String(reviewed._id),
                    requesterUserId,
                    error
                });
            }
        }

        return toApplicationView(reviewed);
    }

    async rejectApplication(
        requesterUserId: string,
        requesterUsername: string | undefined,
        applicationId: string,
        reviewNote: string
    ): Promise<AdminApplicationView> {
        await this.assertCanReviewApplications(requesterUserId, requesterUsername);
        const normalizedReviewNote = normalizeReviewNote(reviewNote);
        assertOrThrow(Boolean(normalizedReviewNote), 'Review note is required when rejecting.', 'BAD_USER_INPUT', 400);

        const reviewed = await adminApplicationRepository.markReviewed(
            applicationId,
            'REJECTED',
            requesterUserId,
            normalizedReviewNote
        );

        if (!reviewed) {
            throw new AppError('Admin application not found', 'NOT_FOUND', 404);
        }

        if (discordWebhookService.isAdminApprovalConfigured()) {
            try {
                await discordWebhookService.sendAdminApplicationDecisionPayload({
                    applicationId: String(reviewed._id),
                    decision: 'REJECTED',
                    reviewerUserId: requesterUserId,
                    applicantUserId: String(reviewed.userId),
                    applicantUsername: reviewed.applicantUsername,
                    reviewNote: reviewed.reviewNote ?? null
                });
            } catch (error) {
                console.error('[AdminService] Failed to send admin rejection webhook', {
                    applicationId: String(reviewed._id),
                    requesterUserId,
                    error
                });
            }
        }

        return toApplicationView(reviewed);
    }
}

export const adminService = new AdminService();
export type { AdminApplicationView, SubmitAdminApplicationInput };
