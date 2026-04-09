import { friendshipService } from '../../services/friendshipService.js';
import { requireAuth } from './helpers.js';

export const friendshipResolver = {
    Query: {
        friendships: async (
            _parent: unknown,
            args: { status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED' },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return friendshipService.listMyFriendships(userId, args.status);
        },
        incomingFriendRequests: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.listIncomingRequests(userId);
        }
    },
    Mutation: {
        sendFriendRequest: async (_parent: unknown, args: { username: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.sendRequestByUsername(userId, args.username);
        },
        acceptFriendRequest: async (_parent: unknown, args: { friendshipId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.acceptRequest(userId, args.friendshipId);
        },
        rejectFriendRequest: async (_parent: unknown, args: { friendshipId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.rejectRequest(userId, args.friendshipId);
        },
        removeFriend: async (_parent: unknown, args: { friendId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.removeFriend(userId, args.friendId);
        },
        blockUser: async (_parent: unknown, args: { targetUserId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.blockUser(userId, args.targetUserId);
        },
        unblockUser: async (_parent: unknown, args: { targetUserId: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return friendshipService.unblockUser(userId, args.targetUserId);
        }
    }
};
