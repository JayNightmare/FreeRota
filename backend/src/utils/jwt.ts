import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthenticatedUser } from '../types/index.js';
import type { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
    sub: string;
    username: string;
}

export function signAuthToken(user: Pick<AuthenticatedUser, '_id' | 'username'>): string {
    const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

    return jwt.sign({ sub: String(user._id), username: user.username }, env.JWT_SECRET, {
        expiresIn
    });
}

export function verifyAuthToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
