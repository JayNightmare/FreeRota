import { env } from '../config/env.js';

export function buildDeletedAccountSupportMessage(): string {
    if (env.DISCORD_SUPPORT_SERVER) {
        return `This account has been deleted. For help, please contact support on Discord: ${env.DISCORD_SUPPORT_SERVER}`;
    }

    return 'This account has been deleted. Please contact support for help.';
}

export function buildDeletedUsernameConflictMessage(): string {
    if (env.DISCORD_SUPPORT_SERVER) {
        return `This username belongs to a deleted account and cannot be reused. Please contact support on Discord: ${env.DISCORD_SUPPORT_SERVER}`;
    }

    return 'This username belongs to a deleted account and cannot be reused. Please contact support.';
}
