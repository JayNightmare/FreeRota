import { friendshipRepository } from '../repositories/friendshipRepository.js';
import { AppError, assertOrThrow } from '../utils/errors.js';
import { userRepository } from '../repositories/userRepository.js';
import { validateUsername } from '../utils/username.js';

class FriendshipService {
    async listMyFriendships(userId: string, status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED') {
        return friendshipRepository.listForUser(userId, status);
    }

    async listIncomingRequests(userId: string) {
        return friendshipRepository.listIncomingPending(userId);
    }

    async sendRequestByUsername(requesterId: string, targetUsername: string) {
        const username = validateUsername(targetUsername);
        const addressee = await userRepository.findByUsername(username);
        if (!addressee || addressee.deletedAt) {
            throw new AppError('User not found', 'NOT_FOUND', 404);
        }

        const addresseeId = String(addressee._id);
        assertOrThrow(requesterId !== addresseeId, 'Cannot send friend request to yourself');

        const existing = await friendshipRepository.findAnyBetweenUsers(requesterId, addresseeId);
        if (existing && existing.status !== 'REJECTED') {
            throw new AppError('Friendship already exists or pending', 'CONFLICT', 409);
        }

        if (existing && existing.status === 'REJECTED') {
            const revived = await friendshipRepository.updateStatus(existing.id, 'PENDING');
            if (!revived) {
                throw new AppError('Unable to create friend request', 'INTERNAL', 500);
            }

            return revived;
        }

        return friendshipRepository.create(requesterId, addresseeId);
    }

    async acceptRequest(userId: string, friendshipId: string) {
        const friendships = await friendshipRepository.listIncomingPending(userId);
        const target = friendships.find((item) => item.id === friendshipId);

        if (!target) {
            throw new AppError('Friend request not found', 'NOT_FOUND', 404);
        }

        const updated = await friendshipRepository.updateStatus(friendshipId, 'ACCEPTED');
        if (!updated) {
            throw new AppError('Friend request not found', 'NOT_FOUND', 404);
        }

        return updated;
    }

    async rejectRequest(userId: string, friendshipId: string) {
        const friendships = await friendshipRepository.listIncomingPending(userId);
        const target = friendships.find((item) => item.id === friendshipId);

        if (!target) {
            throw new AppError('Friend request not found', 'NOT_FOUND', 404);
        }

        const updated = await friendshipRepository.updateStatus(friendshipId, 'REJECTED');
        if (!updated) {
            throw new AppError('Friend request not found', 'NOT_FOUND', 404);
        }

        return updated;
    }

    async removeFriend(userId: string, friendId: string): Promise<boolean> {
        const removed = await friendshipRepository.removeAcceptedBetweenUsers(userId, friendId);
        if (!removed) {
            throw new AppError('Friendship not found', 'NOT_FOUND', 404);
        }

        return true;
    }

    async blockUser(userId: string, targetId: string) {
        assertOrThrow(userId !== targetId, 'Cannot block yourself');

        const existing = await friendshipRepository.findAnyBetweenUsers(userId, targetId);
        if (existing) {
            const updated = await friendshipRepository.updateStatus(existing.id, 'BLOCKED');
            if (!updated) {
                throw new AppError('Unable to block user', 'INTERNAL', 500);
            }

            return updated;
        }

        const created = await friendshipRepository.create(userId, targetId);
        const blocked = await friendshipRepository.updateStatus(created.id, 'BLOCKED');
        if (!blocked) {
            throw new AppError('Unable to block user', 'INTERNAL', 500);
        }

        return blocked;
    }

    async unblockUser(userId: string, targetId: string): Promise<boolean> {
        const existing = await friendshipRepository.findAnyBetweenUsers(userId, targetId);
        if (!existing || existing.status !== 'BLOCKED') {
            throw new AppError('Blocked relationship not found', 'NOT_FOUND', 404);
        }

        const updated = await friendshipRepository.updateStatus(existing.id, 'REJECTED');
        return Boolean(updated);
    }
}

export const friendshipService = new FriendshipService();
