import { friendshipRepository } from '../repositories/friendshipRepository.js';
import { userRepository } from '../repositories/userRepository.js';

class PrivacyPolicyService {
    async canViewSchedule(viewerId: string, targetUserId: string): Promise<boolean> {
        if (viewerId === targetUserId) {
            return true;
        }

        const target = await userRepository.findById(targetUserId);
        if (!target || target.deletedAt) {
            return false;
        }

        const relation = await friendshipRepository.findAnyBetweenUsers(viewerId, targetUserId);
        if (relation?.status === 'BLOCKED') {
            return false;
        }

        if (target.isPublic) {
            return true;
        }

        return relation?.status === 'ACCEPTED';
    }

    async canMessageUser(senderId: string, recipientId: string): Promise<boolean> {
        if (senderId === recipientId) {
            return false;
        }

        const relation = await friendshipRepository.findAnyBetweenUsers(senderId, recipientId);
        if (!relation || relation.status === 'PENDING' || relation.status === 'REJECTED') {
            return false;
        }

        return relation.status === 'ACCEPTED';
    }
}

export const privacyPolicyService = new PrivacyPolicyService();
