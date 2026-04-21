import { Types } from 'mongoose';
import { AuditEventModel } from '../models/AuditEvent.js';

class AuditService {
    async logEvent(
        organizationId: string,
        actorId: string,
        action: string,
        resource: string,
        resourceId: string,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        try {
            await AuditEventModel.create({
                organizationId: new Types.ObjectId(organizationId),
                actorId: new Types.ObjectId(actorId),
                action,
                resource,
                resourceId: new Types.ObjectId(resourceId),
                metadata
            });
            // We do not await or block critical paths for audit logs typically, 
            // but in a Serverless or short-lived context (like Mongoose), we do await it.
        } catch (error) {
            console.error('[AuditService] Failed to write audit log:', error);
        }
    }
}

export const auditService = new AuditService();
