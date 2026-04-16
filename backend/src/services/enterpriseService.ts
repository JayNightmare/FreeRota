import { AppError, assertOrThrow } from '../utils/errors.js';
import { discordWebhookService } from './discordWebhookService.js';

export type EnterpriseInquiryType = 'PRICING' | 'PARTNERSHIP' | 'BULK_LICENSING' | 'SUPPORT' | 'OTHER';

interface EnterpriseInquiryInput {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string | null;
    inquiryType: EnterpriseInquiryType;
    message: string;
}

interface EnterpriseInquiryResult {
    success: boolean;
    message: string;
    ticketId: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EnterpriseService {
    async submitInquiry(input: EnterpriseInquiryInput): Promise<EnterpriseInquiryResult> {
        const companyName = input.companyName.trim();
        const contactName = input.contactName.trim();
        const email = input.email.trim().toLowerCase();
        const phone = input.phone?.trim() || null;
        const message = input.message.trim();

        assertOrThrow(companyName.length >= 2, 'Company name must be at least 2 characters.');
        assertOrThrow(companyName.length <= 100, 'Company name cannot exceed 100 characters.');
        assertOrThrow(contactName.length >= 2, 'Contact name must be at least 2 characters.');
        assertOrThrow(contactName.length <= 100, 'Contact name cannot exceed 100 characters.');
        assertOrThrow(email.length >= 5, 'Email address is required.');
        assertOrThrow(email.length <= 254, 'Email address cannot exceed 254 characters.');
        assertOrThrow(EMAIL_REGEX.test(email), 'Please provide a valid email address.');
        assertOrThrow(message.length >= 10, 'Message must be at least 10 characters.');
        assertOrThrow(message.length <= 5000, 'Message cannot exceed 5000 characters.');

        if (phone) {
            assertOrThrow(phone.length <= 32, 'Phone number cannot exceed 32 characters.');
        }

        if (!discordWebhookService.isEnterpriseConfigured()) {
            throw new AppError('Enterprise inquiry channel is not configured. Please try again later.', 'SERVICE_UNAVAILABLE', 503);
        }

        const ticketId = `ent-${Date.now().toString(36)}`;

        try {
            await discordWebhookService.sendEnterpriseInquiryPayload({
                companyName,
                contactName,
                email,
                phone,
                inquiryType: input.inquiryType,
                message: `${message}\n\nTicket: ${ticketId}`,
                submittedAt: new Date()
            });
        } catch (error) {
            console.error('[EnterpriseService] Discord delivery failed', {
                companyName,
                inquiryType: input.inquiryType,
                error
            });
            throw new AppError('Unable to submit your inquiry right now. Please try again shortly.', 'UPSTREAM_ERROR', 502);
        }

        return {
            success: true,
            message: 'Inquiry submitted successfully. Our enterprise team will contact you soon.',
            ticketId
        };
    }
}

export const enterpriseService = new EnterpriseService();
