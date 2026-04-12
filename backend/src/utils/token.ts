import { createHash, randomBytes } from 'node:crypto';

const SHORT_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRandomToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('hex');
}

export function createShortCode(length = 6): string {
    const bytes = randomBytes(length);
    let code = '';

    for (let i = 0; i < length; i++) {
        code += SHORT_CODE_CHARSET[bytes[i] % SHORT_CODE_CHARSET.length];
    }

    return code;
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
