import type { UserDocument } from '../models/User.js';

export type AuthenticatedUser = Pick<UserDocument, '_id' | 'email' | 'username' | 'displayName' | 'isPublic' | 'timezone'>;

export interface GraphQLContext {
    authUser: AuthenticatedUser | null;
}
