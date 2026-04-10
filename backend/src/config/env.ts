import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_ORIGIN: z.string().default('*'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('FreeRota <no-reply@freerota.local>'),
    MAILTRAP_TOKEN: z.string().optional(),
    APP_DEEP_LINK_BASE: z.string().default('freerota://auth'),
    APP_WEB_BASE_URL: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
