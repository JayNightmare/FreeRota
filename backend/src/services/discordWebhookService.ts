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

    async sendSupportPayload(payload: DiscordSupportPayload): Promise<void> {
        if (!env.DISCORD_SUPPORT_WEBHOOK_URL) {
            throw new Error('Discord support webhook is not configured.');
        }

        const response = await fetch(env.DISCORD_SUPPORT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
            }),
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discord webhook returned ${response.status}: ${errorText}`);
        }
    }
}

export const discordWebhookService = new DiscordWebhookService();
