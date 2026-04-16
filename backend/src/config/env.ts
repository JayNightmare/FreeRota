import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function normalizeOrigin(value: string): string {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '*') {
        return '*';
    }

    return trimTrailingSlash(trimmed);
}

function normalizeOptionalUrl(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    return trimTrailingSlash(trimmed);
}

function normalizeOptionalValue(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function normalizeOptionalCsv(value?: string): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_ORIGIN: z.string().default('*').transform(normalizeOrigin),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('FreeRota <no-reply@freerota.local>'),
    MAILTRAP_TOKEN: z.string().optional(),
    APP_DEEP_LINK_BASE: z.string().default('freerota://auth').transform(trimTrailingSlash),
    APP_WEB_BASE_URL: z.string().optional().transform(normalizeOptionalUrl),
    DISCORD_SUPPORT_WEBHOOK_URL: z.string().optional().transform(normalizeOptionalValue),
    DISCORD_ADMIN_APPROVAL_WEBHOOK_URL: z.string().optional().transform(normalizeOptionalValue),
    GITHUB_ISSUE_TOKEN: z.string().optional().transform(normalizeOptionalValue),
    GITHUB_ISSUE_OWNER: z.string().optional().transform(normalizeOptionalValue),
    GITHUB_ISSUE_REPO: z.string().optional().transform(normalizeOptionalValue),
    GITHUB_ISSUE_LABELS: z.string().default('tester-feedback,triage').transform(normalizeOptionalCsv),
    GITHUB_ISSUE_ESCALATION_LEVEL: z
        .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
        .default('CRITICAL')
        .transform((value) => value.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
    ADMIN_BOOTSTRAP_USERNAMES: z.string().default('').transform(normalizeOptionalCsv)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
