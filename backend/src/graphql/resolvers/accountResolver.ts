import { authService } from '../../services/authService.js';
import { userService } from '../../services/userService.js';
import { requireAuth } from './helpers.js';

export const accountResolver = {
    Query: {
        me: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return userService.me(userId);
        },
        userProfile: async (_parent: unknown, args: { userId: string }) => {
            return userService.getProfile(args.userId);
        }
    },
    Mutation: {
        register: async (
            _parent: unknown,
            args: {
                input: {
                    email: string;
                    username: string;
                    password: string;
                    displayName?: string;
                    timezone?: string;
                    isPublic?: boolean;
                };
            }
        ) => authService.register(args.input),
        login: async (_parent: unknown, args: { username: string; password: string }) => authService.login(args.username, args.password),
        updateAccount: async (
            _parent: unknown,
            args: {
                input: {
                    email?: string;
                    displayName?: string;
                    timezone?: string;
                    isPublic?: boolean;
                    uiAccentColor?: string | null;
                };
            },
            context: Parameters<typeof requireAuth>[0]
        ) => {
            const userId = requireAuth(context);
            return userService.updateUser(userId, args.input);
        },
        deleteAccount: async (_parent: unknown, _args: unknown, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return userService.deleteAccount(userId);
        }
    }
};
