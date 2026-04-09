import { FriendshipModel, type FriendshipDocument } from '../models/Friendship.js';

class FriendshipRepository {
    async create(requesterId: string, addresseeId: string): Promise<FriendshipDocument> {
        return FriendshipModel.create({ requesterId, addresseeId, status: 'PENDING' });
    }

    async findAnyBetweenUsers(a: string, b: string): Promise<FriendshipDocument | null> {
        return FriendshipModel.findOne({
            $or: [
                { requesterId: a, addresseeId: b },
                { requesterId: b, addresseeId: a }
            ]
        }).exec();
    }

    async listForUser(userId: string, status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED'): Promise<FriendshipDocument[]> {
        const filter: Record<string, unknown> = {
            $or: [{ requesterId: userId }, { addresseeId: userId }]
        };

        if (status) {
            filter.status = status;
        }

        return FriendshipModel.find(filter).sort({ updatedAt: -1 }).exec();
    }

    async listIncomingPending(userId: string): Promise<FriendshipDocument[]> {
        return FriendshipModel.find({ addresseeId: userId, status: 'PENDING' })
            .sort({ createdAt: -1 })
            .exec();
    }

    async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED'): Promise<FriendshipDocument | null> {
        return FriendshipModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    }

    async removeAcceptedBetweenUsers(a: string, b: string): Promise<boolean> {
        const deleted = await FriendshipModel.findOneAndDelete({
            status: 'ACCEPTED',
            $or: [
                { requesterId: a, addresseeId: b },
                { requesterId: b, addresseeId: a }
            ]
        }).exec();

        return Boolean(deleted);
    }
}

export const friendshipRepository = new FriendshipRepository();
