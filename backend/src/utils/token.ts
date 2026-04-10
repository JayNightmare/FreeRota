import { createHash, randomBytes } from 'node:crypto';

export function createRandomToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('hex');
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
