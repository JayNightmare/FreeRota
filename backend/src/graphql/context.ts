import type { YogaInitialContext } from 'graphql-yoga';
import { userRepository } from '../repositories/userRepository.js';
import { verifyAuthToken } from '../utils/jwt.js';
import type { GraphQLContext } from '../types/index.js';

export async function buildContext(ctx: YogaInitialContext): Promise<GraphQLContext> {
    const authHeader = ctx.request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { authUser: null };
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
        const payload = verifyAuthToken(token);
        const user = await userRepository.findById(payload.sub);
        if (!user || user.deletedAt) {
            return { authUser: null };
        }

        return {
            authUser: {
                _id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                isPublic: user.isPublic,
                timezone: user.timezone,
                uiAccentColor: user.uiAccentColor
            }
        };
    } catch {
        return { authUser: null };
    }
}
