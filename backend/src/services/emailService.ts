import nodemailer, { type Transporter } from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';
import { env } from '../config/env.js';

type AuthEmailFlow = 'verify-email' | 'reset-password';

class EmailService {
    private readonly transporter: Transporter = this.createTransporter();

    private readonly from = env.SMTP_FROM;

    private createTransporter(): Transporter {
        if (env.MAILTRAP_TOKEN?.trim()) {
            return nodemailer.createTransport(
                MailtrapTransport({
                    token: env.MAILTRAP_TOKEN.trim()
                })
            );
        }

        return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth:
                env.SMTP_USER && env.SMTP_PASS
                    ? {
                        user: env.SMTP_USER,
                        pass: env.SMTP_PASS
                    }
                    : undefined
        });
    }

    async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
        const links = this.buildLinks('verify-email', token);
        const subject = 'Verify your FreeRota email';
        const message = [
            `Hi ${username},`,
            '',
            'Thanks for signing up to FreeRota.',
            `Open this link to verify your email: ${links.appLink}`,
            links.webLink ? `Web fallback: ${links.webLink}` : '',
            '',
            'If you did not create this account, you can ignore this email.'
        ]
            .filter(Boolean)
            .join('\n');

        await this.send(email, subject, message, this.buildHtml('Verify your email', links, username));
    }

    async sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
        const links = this.buildLinks('reset-password', token);
        const subject = 'Reset your FreeRota password';
        const message = [
            `Hi ${username},`,
            '',
            `Open this link to reset your password: ${links.appLink}`,
            links.webLink ? `Web fallback: ${links.webLink}` : '',
            '',
            'If you did not request a password reset, you can ignore this email.'
        ]
            .filter(Boolean)
            .join('\n');

        await this.send(email, subject, message, this.buildHtml('Reset your password', links, username));
    }

    private buildLinks(flow: AuthEmailFlow, token: string): { appLink: string; webLink: string | null } {
        return {
            appLink: this.appendQuery(env.APP_DEEP_LINK_BASE, flow, token),
            webLink: env.APP_WEB_BASE_URL ? this.appendQuery(env.APP_WEB_BASE_URL, flow, token) : null
        };
    }

    private appendQuery(base: string, flow: AuthEmailFlow, token: string): string {
        const separator = base.includes('?') ? '&' : '?';
        return `${base}${separator}flow=${encodeURIComponent(flow)}&token=${encodeURIComponent(token)}`;
    }

    private buildHtml(
        title: string,
        links: { appLink: string; webLink: string | null },
        username: string
    ): string {
        const webLinkHtml = links.webLink
            ? `<p>Web fallback: <a href="${links.webLink}">${links.webLink}</a></p>`
            : '';

        return `
            <div style="font-family: Arial, sans-serif; color: #1b1b1b; line-height: 1.5;">
                <h2>${title}</h2>
                <p>Hi ${username},</p>
                <p><a href="${links.appLink}">Open in FreeRota</a></p>
                ${webLinkHtml}
                <p>If this wasn't you, you can safely ignore this email.</p>
            </div>
        `;
    }

    private async send(to: string, subject: string, text: string, html: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.from,
            to,
            subject,
            text,
            html
        });
    }
}

export const emailService = new EmailService();
