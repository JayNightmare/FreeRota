# FreeRota – Project Memory

## Architecture

- **Monorepo**: `backend/` (Node.js + GraphQL Yoga + MongoDB/Mongoose), `mobile/` (React Native + Expo + Apollo Client), `shared/`
- **Auth**: JWT-based, stored in `authStorage` (AsyncStorage), hydrated in `AuthProvider`
- **GraphQL**: Yoga server with hand-rolled resolvers, Apollo Client on mobile
- **Email**: Mailtrap API or SMTP (nodemailer), via `emailService`

## Active Tasks

### Completed
- Email verification overhaul (2026-04-12):
  - Verification uses 6-char alphanumeric code (no ambiguous chars: 0/O/I/1/L)
  - Token TTL extended to 7 days (was 24h)
  - Unverified users can log in and use the app
  - Friendship mutations (`sendFriendRequest`, `acceptFriendRequest`) gated behind email verification via `requireVerifiedEmail` helper
  - Register returns `AuthPayload` for auto-login
  - `verifyEmail` is now an authenticated mutation taking `code: String!`, returning `ActionResult`
  - Verification UI on FriendsScreen (top card) and ProfileScreen (highlighted card)
  - AuthScreen simplified: removed `verify-email` mode and deep link flow
  - `emailVerifiedAt` added to `AuthenticatedUser` type and GraphQL context

### Next Steps
- Consider adding a verification code resend cooldown (rate limiting)
- Add push notification when verification email is sent
- Add email change flow (re-verification)

## Key Decisions

- **Short codes over deep links for verification**: Better UX for mobile users — no link-clicking, just type 6 characters
- **Charset excludes ambiguous characters**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/I/1/L)
- **Login doesn't require verification**: Reduces friction, verification only gates social features
- **Verification gating at resolver level**: `requireVerifiedEmail()` in `helpers.ts` rather than service layer, keeps services testable

## File Map (key files)

| File | Purpose |
|------|---------|
| `backend/src/utils/token.ts` | `createShortCode()`, `createRandomToken()`, `hashToken()` |
| `backend/src/services/authService.ts` | Register, login, verify, password reset |
| `backend/src/services/emailService.ts` | Email delivery (Mailtrap API or SMTP) |
| `backend/src/graphql/resolvers/helpers.ts` | `requireAuth()`, `requireVerifiedEmail()` |
| `backend/src/types/index.ts` | `AuthenticatedUser`, `GraphQLContext` |
| `mobile/src/screens/AuthScreen.tsx` | Login/register/password-reset flows |
| `mobile/src/screens/FriendsScreen.tsx` | Friend management + verification UI |
| `mobile/src/screens/ProfileScreen.tsx` | Profile editing + verification UI |
