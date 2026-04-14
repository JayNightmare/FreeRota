import nodemailer, { type Transporter } from 'nodemailer';
import { MailtrapClient, type Address } from 'mailtrap';
import { env } from '../config/env.js';

type AuthEmailFlow = 'verify-email' | 'reset-password';
type AuthEmailCategory = 'auth.verify-email' | 'auth.reset-password' | 'auth.password-changed';
type EmailDeliveryMode = 'mailtrap-api' | 'smtp';

const PASSWORD_CHANGE_SUPPORT_LINK = 'https://discord.gg/placeholder';

class EmailService {
    private readonly mailtrapToken = env.MAILTRAP_TOKEN?.trim();

    private readonly mailtrapClient = this.mailtrapToken
        ? new MailtrapClient({ token: this.mailtrapToken })
        : null;

    private readonly transporter: Transporter | null = this.mailtrapClient
        ? null
        : this.createSmtpTransporter();

    private readonly mode: EmailDeliveryMode = this.mailtrapClient
        ? 'mailtrap-api'
        : 'smtp';

    private readonly from = env.SMTP_FROM;

    private readonly fromAddress = this.parseFromAddress(this.from);

    constructor() {
        if (this.mode === 'mailtrap-api') {
            console.info('[EmailService] Delivery mode: mailtrap-api');
            return;
        }

        console.info(
            `[EmailService] Delivery mode: smtp (${env.SMTP_HOST}:${env.SMTP_PORT})`
        );
    }

    private createSmtpTransporter(): Transporter {
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

    async sendVerificationEmail(email: string, username: string, code: string): Promise<void> {
        const subject = 'Verify your FreeRota email';
        const message = [
            'Hi ' + username + ',',
            '',
            'Thanks for signing up to FreeRota.',
            'Your verification code is: ' + code,
            '',
            'Enter this code in the app to verify your email.',
            'This code expires in 7 days.',
            '',
            'If you did not create this account, you can ignore this email.'
        ].join('\n');

        const html = [
            '<div style="font-family: Arial, sans-serif; color: #1b1b1b; line-height: 1.5;">',
            '    <h2>Verify your email</h2>',
            '    <p>Hi ' + username + ',</p>',
            '    <p>Your verification code is:</p>',
            '    <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px 24px; background: #f4f4f5; border-radius: 8px; display: inline-block; margin: 8px 0;">' + code + '</div>',
            '    <p>Enter this code in the FreeRota app to verify your account.</p>',
            '    <p style="color: #6b7280; font-size: 13px;">This code expires in 7 days.</p>',
            '    <p>If this wasn\'t you, you can safely ignore this email.</p>',
            '</div>'
        ].join('\n');

        await this.send(email, subject, message, html, 'auth.verify-email');
    }

    async sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
        const links = this.buildLinks('reset-password', token);
        const subject = 'Reset your FreeRota password';
        const message = [
            'Hi ' + username + ',',
            '',
            'Open this link to reset your password: ' + links.appLink,
            links.webLink ? 'Web fallback: ' + links.webLink : '',
            '',
            'If you did not request a password reset, you can ignore this email.'
        ]
            .filter(Boolean)
            .join('\n');

        await this.send(
            email,
            subject,
            message,
            this.buildHtml('Reset your password', links, username),
            'auth.reset-password'
        );
    }

    async sendPasswordChangedEmail(email: string, username: string): Promise<void> {
        const subject = 'Your FreeRota password was changed';
        const message = [
            'Hi ' + username + ',',
            '',
            'This is a confirmation that your FreeRota password was changed.',
            '',
            'If this was not you, contact support immediately: ' + PASSWORD_CHANGE_SUPPORT_LINK
        ].join('\n');

        const html = [
            '<div style="font-family: Arial, sans-serif; color: #1b1b1b; line-height: 1.5;">',
            '    <h2>Password changed</h2>',
            '    <p>Hi ' + username + ',</p>',
            '    <p>This is a confirmation that your FreeRota password was changed.</p>',
            '    <p>If this wasn\'t you, contact support immediately: <a href="' + PASSWORD_CHANGE_SUPPORT_LINK + '">' + PASSWORD_CHANGE_SUPPORT_LINK + '</a></p>',
            '</div>'
        ].join('\n');

        await this.send(email, subject, message, html, 'auth.password-changed');
    }

    private parseFromAddress(value: string): Address {
        const trimmed = value.trim();
        const match = trimmed.match(/^(.*)<([^>]+)>$/);

        if (!match) {
            return { email: trimmed };
        }

        const rawName = match[1].trim();
        const email = match[2].trim();

        if (!email) {
            return { email: trimmed };
        }

        const unquotedName = rawName.replace(/^"(.*)"$/, '$1').trim();
        return unquotedName ? { name: unquotedName, email } : { email };
    }

    private buildLinks(flow: AuthEmailFlow, token: string): { appLink: string; webLink: string | null } {
        return {
            appLink: this.appendQuery(env.APP_DEEP_LINK_BASE, flow, token),
            webLink: env.APP_WEB_BASE_URL ? this.appendQuery(env.APP_WEB_BASE_URL, flow, token) : null
        };
    }

    private appendQuery(base: string, flow: AuthEmailFlow, token: string): string {
        const separator = base.includes('?') ? '&' : '?';
        return (
            base +
            separator +
            'flow=' +
            encodeURIComponent(flow) +
            '&token=' +
            encodeURIComponent(token)
        );
    }

    private buildHtml(
        title: string,
        links: { appLink: string; webLink: string | null },
        username: string
    ): string {
        const webLinkHtml = links.webLink
            ? '<p>Web fallback: <a href="' + links.webLink + '">' + links.webLink + '</a></p>'
            : '';

        return [
            '<div style="font-family: Arial, sans-serif; color: #1b1b1b; line-height: 1.5;">',
            '    <h2>' + title + '</h2>',
            '    <p>Hi ' + username + ',</p>',
            '    <p><a href="' + links.appLink + '">Open in FreeRota</a></p>',
            '    ' + webLinkHtml,
            '    <p>If this wasn\'t you, you can safely ignore this email.</p>',
            '</div>'
        ].join('\n');
    }

    private async send(
        to: string,
        subject: string,
        text: string,
        html: string,
        category: AuthEmailCategory
    ): Promise<void> {
        try {
            if (this.mailtrapClient) {
                await this.mailtrapClient.send({
                    from: this.fromAddress,
                    to: [{ email: to }],
                    subject,
                    text,
                    html,
                    category
                });
                return;
            }

            if (!this.transporter) {
                throw new Error('SMTP transporter is not configured');
            }

            await this.transporter.sendMail({
                from: this.from,
                to,
                subject,
                text,
                html,
                headers: {
                    'X-Category': category
                }
            });
        } catch (error) {
            console.error('[EmailService] Send failed', {
                mode: this.mode,
                category,
                to,
                subject,
                error
            });
            throw error;
        }
    }
}

export const emailService = new EmailService();