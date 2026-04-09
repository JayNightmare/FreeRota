import type { UserDocument } from '../models/User.js';

export type AuthenticatedUser = Pick<UserDocument, '_id' | 'email' | 'username' | 'displayName' | 'isPublic' | 'timezone' | 'uiAccentColor'>;

export interface GraphQLContext {
    authUser: AuthenticatedUser | null;
}
