import { env } from '../config/env.js';

interface DiscordSupportPayload {
    title: string;
    reasonLabel: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    reporter: {
        id: string;
        username: string;
        email: string;
        displayName: string;
    };
}

interface DiscordAdminApplicationPayload {
    applicationId: string;
    userId: string;
    username: string;
    displayName: string;
    email: string;
    motivation: string;
    discordHandle: string | null;
    submittedAt: Date;
}

interface DiscordAdminApplicationDecisionPayload {
    applicationId: string;
    decision: 'APPROVED' | 'REJECTED';
    reviewerUserId: string;
    applicantUserId: string;
    applicantUsername: string;
    reviewNote: string | null;
}

function truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }

    return value.slice(0, maxLength - 1) + '…';
}

function urgencyColor(urgency: DiscordSupportPayload['urgency']): number {
    switch (urgency) {
        case 'CRITICAL':
            return 0xDC2626;
        case 'HIGH':
            return 0xEA580C;
        case 'MEDIUM':
            return 0xD97706;
        case 'LOW':
        default:
            return 0x0F766E;
    }
}

class DiscordWebhookService {
    isConfigured(): boolean {
        return Boolean(env.DISCORD_SUPPORT_WEBHOOK_URL);
    }

    isAdminApprovalConfigured(): boolean {
        return Boolean(env.DISCORD_ADMIN_APPROVAL_WEBHOOK_URL);
    }

    private async postWebhook(url: string, body: Record<string, unknown>): Promise<void> {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discord webhook returned ${response.status}: ${errorText}`);
        }
    }

    async sendSupportPayload(payload: DiscordSupportPayload): Promise<void> {
        if (!env.DISCORD_SUPPORT_WEBHOOK_URL) {
            throw new Error('Discord support webhook is not configured.');
        }

        await this.postWebhook(env.DISCORD_SUPPORT_WEBHOOK_URL, {
            username: 'FreeRota Tester Support',
            embeds: [
                {
                    title: truncate(payload.title, 256),
                    color: urgencyColor(payload.urgency),
                    description: truncate(payload.message, 3900),
                    fields: [
                        {
                            name: 'Reason',
                            value: truncate(payload.reasonLabel, 1024),
                            inline: true
                        },
                        {
                            name: 'Urgency',
                            value: payload.urgency,
                            inline: true
                        },
                        {
                            name: 'Reporter',
                            value: truncate(payload.reporter.displayName || payload.reporter.username, 1024),
                            inline: false
                        },
                        {
                            name: 'Reporter Username',
                            value: truncate(payload.reporter.username, 1024),
                            inline: true
                        },
                        {
                            name: 'Reporter Email',
                            value: truncate(payload.reporter.email, 1024),
                            inline: true
                        },
                        {
                            name: 'Reporter User ID',
                            value: truncate(payload.reporter.id, 1024),
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }

    async sendAdminApplicationPayload(payload: DiscordAdminApplicationPayload): Promise<void> {
        if (!env.DISCORD_ADMIN_APPROVAL_WEBHOOK_URL) {
            throw new Error('Discord admin approval webhook is not configured.');
        }

        await this.postWebhook(env.DISCORD_ADMIN_APPROVAL_WEBHOOK_URL, {
            username: 'FreeRota Admin Access',
            embeds: [
                {
                    title: 'New Admin Access Application',
                    color: 0x2563EB,
                    description: truncate(payload.motivation, 3900),
                    fields: [
                        {
                            name: 'Application ID',
                            value: truncate(payload.applicationId, 1024),
                            inline: false
                        },
                        {
                            name: 'User ID',
                            value: truncate(payload.userId, 1024),
                            inline: false
                        },
                        {
                            name: 'Username',
                            value: truncate(payload.username, 1024),
                            inline: true
                        },
                        {
                            name: 'Display Name',
                            value: truncate(payload.displayName, 1024),
                            inline: true
                        },
                        {
                            name: 'Email',
                            value: truncate(payload.email, 1024),
                            inline: false
                        },
                        {
                            name: 'Discord Handle',
                            value: truncate(payload.discordHandle ?? 'Not provided', 1024),
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Review in Discord, then approve/reject through the admin workflow.'
                    },
                    timestamp: payload.submittedAt.toISOString()
                }
            ]
        });
    }

    async sendAdminApplicationDecisionPayload(payload: DiscordAdminApplicationDecisionPayload): Promise<void> {
        if (!env.DISCORD_ADMIN_APPROVAL_WEBHOOK_URL) {
            throw new Error('Discord admin approval webhook is not configured.');
        }

        const color = payload.decision === 'APPROVED' ? 0x16A34A : 0xDC2626;

        await this.postWebhook(env.DISCORD_ADMIN_APPROVAL_WEBHOOK_URL, {
            username: 'FreeRota Admin Access',
            embeds: [
                {
                    title: `Admin Application ${payload.decision}`,
                    color,
                    fields: [
                        {
                            name: 'Application ID',
                            value: truncate(payload.applicationId, 1024),
                            inline: false
                        },
                        {
                            name: 'Applicant User ID',
                            value: truncate(payload.applicantUserId, 1024),
                            inline: false
                        },
                        {
                            name: 'Applicant Username',
                            value: truncate(payload.applicantUsername, 1024),
                            inline: true
                        },
                        {
                            name: 'Reviewer User ID',
                            value: truncate(payload.reviewerUserId, 1024),
                            inline: true
                        },
                        {
                            name: 'Review Note',
                            value: truncate(payload.reviewNote ?? 'No note provided', 1024),
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }
}

export const discordWebhookService = new DiscordWebhookService();
