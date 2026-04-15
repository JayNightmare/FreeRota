import type { AuthenticatedUser } from '../types/index.js';
import { env } from '../config/env.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { discordWebhookService } from './discordWebhookService.js';
import { githubIssueService } from './githubIssueService.js';

export type ContactReason = 'BUG_REPORT' | 'FEATURE_REQUEST' | 'ACCOUNT_LOGIN_PROBLEM' | 'OTHER';
export type ContactUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ContactSupportInput {
    title: string;
    reason: ContactReason;
    urgency: ContactUrgency;
    message: string;
}

interface ContactSupportResult {
    success: boolean;
    message: string;
    issueCreated: boolean;
    issueNumber: number | null;
    issueUrl: string | null;
}

const REASON_LABELS: Record<ContactReason, string> = {
    BUG_REPORT: 'Bug Report',
    FEATURE_REQUEST: 'Feature Request',
    ACCOUNT_LOGIN_PROBLEM: 'Account/Login Problem',
    OTHER: 'Other'
};

function shouldEscalate(urgency: ContactUrgency): boolean {
    const order: ContactUrgency[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const urgencyIndex = order.indexOf(urgency);
    const configuredIndex = order.indexOf(env.GITHUB_ISSUE_ESCALATION_LEVEL);
    return urgencyIndex >= configuredIndex;
}

class SupportService {
    async submitContactMessage(
        userId: string,
        authUser: AuthenticatedUser,
        input: ContactSupportInput
    ): Promise<ContactSupportResult> {
        const title = input.title.trim();
        const message = input.message.trim();

        assertOrThrow(title.length >= 3, 'Title must be at least 3 characters.');
        assertOrThrow(title.length <= 120, 'Title cannot exceed 120 characters.');
        assertOrThrow(message.length >= 10, 'Message must be at least 10 characters.');
        assertOrThrow(message.length <= 4000, 'Message cannot exceed 4000 characters.');

        if (!discordWebhookService.isConfigured()) {
            throw new AppError('Support channel is not configured. Please try again later.', 'SERVICE_UNAVAILABLE', 503);
        }

        try {
            await discordWebhookService.sendSupportPayload({
                title,
                reasonLabel: REASON_LABELS[input.reason],
                urgency: input.urgency,
                message,
                reporter: {
                    id: userId,
                    username: authUser.username,
                    email: authUser.email,
                    displayName: authUser.displayName
                }
            });
        } catch (error) {
            console.error('[SupportService] Discord delivery failed', {
                userId,
                reason: input.reason,
                urgency: input.urgency,
                error
            });
            throw new AppError('Unable to send your message right now. Please try again shortly.', 'UPSTREAM_ERROR', 502);
        }

        if (!shouldEscalate(input.urgency)) {
            return {
                success: true,
                message: 'Support message sent successfully.',
                issueCreated: false,
                issueNumber: null,
                issueUrl: null
            };
        }

        if (!githubIssueService.isConfigured()) {
            console.error('[SupportService] GitHub issue integration not configured for escalation', {
                userId,
                urgency: input.urgency
            });
            return {
                success: true,
                message: 'Support message sent. Escalation issue was not created.',
                issueCreated: false,
                issueNumber: null,
                issueUrl: null
            };
        }

        const issueLabels = Array.from(new Set([...env.GITHUB_ISSUE_LABELS, 'tester-feedback', `urgency:${input.urgency.toLowerCase()}`]));
        const issueTitle = `[Tester][${input.urgency}] ${REASON_LABELS[input.reason]} - ${title}`;
        const issueBody = [
            '## Tester Support Message',
            '',
            `- Reason: ${REASON_LABELS[input.reason]}`,
            `- Urgency: ${input.urgency}`,
            `- User ID: ${userId}`,
            `- Username: ${authUser.username}`,
            `- Display Name: ${authUser.displayName}`,
            `- Email: ${authUser.email}`,
            '',
            '## Message',
            '',
            message
        ].join('\n');

        try {
            const issue = await githubIssueService.createIssue({
                title: issueTitle,
                body: issueBody,
                labels: issueLabels
            });

            return {
                success: true,
                message: 'Support message sent and escalation issue created.',
                issueCreated: true,
                issueNumber: issue.number,
                issueUrl: issue.url
            };
        } catch (error) {
            console.error('[SupportService] GitHub issue creation failed', {
                userId,
                reason: input.reason,
                urgency: input.urgency,
                error
            });

            return {
                success: true,
                message: 'Support message sent. Escalation issue could not be created.',
                issueCreated: false,
                issueNumber: null,
                issueUrl: null
            };
        }
    }
}

export const supportService = new SupportService();
