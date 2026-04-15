import { accountResolver } from './accountResolver.js';
import { friendshipResolver } from './friendshipResolver.js';
import { freeTimeResolver } from './freeTimeResolver.js';
import { messageResolver } from './messageResolver.js';
import { supportResolver } from './supportResolver.js';
import { rotaResolver } from './rotaResolver.js';
import { shiftTypeResolver } from './shiftTypeResolver.js';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { userRepository } from '../../repositories/userRepository.js';
import { shiftTypeRepository } from '../../repositories/shiftTypeRepository.js';

const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'UTC date-time string',
    serialize(value: unknown): string {
        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'string' || typeof value === 'number') {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
        }

        throw new GraphQLError('DateTime serialization error');
    },
    parseValue(value: unknown): string {
        if (typeof value !== 'string') {
            throw new GraphQLError('DateTime must be an ISO string');
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new GraphQLError('Invalid DateTime value');
        }

        return parsed.toISOString();
    },
    parseLiteral(ast): string {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError('DateTime must be a string literal');
        }

        const parsed = new Date(ast.value);
        if (Number.isNaN(parsed.getTime())) {
            throw new GraphQLError('Invalid DateTime value');
        }

        return parsed.toISOString();
    }
});

export const resolvers = {
    DateTime: dateTimeScalar,
    Query: {
        ...accountResolver.Query,
        ...shiftTypeResolver.Query,
        ...rotaResolver.Query,
        ...friendshipResolver.Query,
        ...messageResolver.Query,
        ...freeTimeResolver.Query
    },
    Mutation: {
        ...accountResolver.Mutation,
        ...shiftTypeResolver.Mutation,
        ...rotaResolver.Mutation,
        ...friendshipResolver.Mutation,
        ...messageResolver.Mutation,
        ...supportResolver.Mutation
    },
    Subscription: {
        ...messageResolver.Subscription
    },
    User: {
        id: (parent: { _id: string }) => String(parent._id),
        username: (parent: { username?: string; displayName?: string; email?: string }) => {
            if (parent.username?.trim()) {
                return parent.username;
            }

            if (parent.displayName?.trim()) {
                return parent.displayName.trim().toLowerCase().replace(/\s+/g, '_');
            }

            if (parent.email?.trim()) {
                return parent.email.split('@')[0].toLowerCase();
            }

            return 'unknown_user';
        }
    },
    RotaEntry: {
        id: (parent: { _id: string }) => String(parent._id),
        shiftTypeId: (parent: { shiftTypeId?: string | null }) =>
            parent.shiftTypeId ? String(parent.shiftTypeId) : null,
        shiftType: async (parent: { shiftTypeId?: string | null; userId?: string }) => {
            if (!parent.shiftTypeId || !parent.userId) {
                return null;
            }

            return shiftTypeRepository.findByIdForUser(String(parent.shiftTypeId), String(parent.userId));
        }
    },
    ShiftType: {
        id: (parent: { _id: string }) => String(parent._id),
        userId: (parent: { userId: string }) => String(parent.userId)
    },
    Friendship: {
        id: (parent: { _id: string }) => String(parent._id),
        requesterUsername: async (parent: { requesterId: string }) => {
            const user = await userRepository.findById(parent.requesterId);
            return user?.username ?? 'unknown';
        },
        addresseeUsername: async (parent: { addresseeId: string }) => {
            const user = await userRepository.findById(parent.addresseeId);
            return user?.username ?? 'unknown';
        }
    },
    Conversation: {
        id: (parent: { _id: string }) => String(parent._id)
    },
    Message: {
        id: (parent: { _id: string }) => String(parent._id)
    }
};
