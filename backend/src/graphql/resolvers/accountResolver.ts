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
        requestEmailVerification: async (_parent: unknown, args: { email: string }) =>
            authService.requestEmailVerification(args.email),
        verifyEmail: async (_parent: unknown, args: { code: string }, context: Parameters<typeof requireAuth>[0]) => {
            const userId = requireAuth(context);
            return authService.verifyEmail(args.code, userId);
        },
        requestPasswordReset: async (_parent: unknown, args: { identifier: string }) =>
            authService.requestPasswordReset(args.identifier),
        resetPassword: async (_parent: unknown, args: { token: string; newPassword: string }) =>
            authService.resetPassword(args.token, args.newPassword),
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
