# FreeRota – Project Memory

## Architecture

- **Monorepo**: `backend/` (Node.js + GraphQL Yoga + MongoDB/Mongoose), `mobile/` (React Native + Expo + Apollo Client), `shared/`
- **Auth**: JWT-based, stored in `authStorage` (AsyncStorage), hydrated in `AuthProvider`
- **GraphQL**: Yoga server with hand-rolled resolvers, Apollo Client on mobile
- **Email**: Mailtrap API or SMTP (nodemailer), via `emailService`

## Active Tasks

### Completed
- Friends + Messages Screen Merge (2026-04-13):
  - Combined FriendsScreen and MessagesScreen into a single tab.
  - Friend list is the default view; tapping an accepted friend opens a chat sub-view.
  - Removed MESSAGES tab from App.tsx (now 4 tabs: Rota, Friends, Free Time, Profile).
  - MessagesScreen.tsx is now unused/orphaned.
- Brutalist UI Redesign — Global Theme (2026-04-13):
  - Rewrote `themes.ts` with Design.html color palette (`#0A0A0A` background, `#d2bbff` accent, `#abd600` tertiary), 0 radii, 4px borders, industrial shadow tokens.
  - Updated all shared components (`ActionButton`, `FormField`, `StateNotice`, `ScreenIntroCard`) with brutalist styling.
  - Redesigned App.tsx header (minimal, accent purple title) and bottom nav (tertiary green top-border indicator, no dividers).
  - Removed local BRUTALIST overrides from RotaCalendarScreen — all screens now inherit style through the global theme.
  - Forced dark-only mode in ThemeProvider.
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
- Email change feature (2026-04-12):
  - `changeEmail` mutation: requires auth, password confirmation, and reason
  - Resets `emailVerifiedAt` and sends new verification code to new email
  - ProfileScreen: expandable "Change Email" section with reason picker (bottom sheet modal)
  - Predefined reasons: switching email types, typo, old email inaccessible, privacy/security, other
- FriendsScreen content gating (2026-04-12):
  - All friend content hidden when unverified — only verification card shown
- Background fix (2026-04-12):
  - Root `View` wrapper in `App()` given `flex: 1` to fill viewport

## Key Decisions

- **Short codes over deep links for verification**: Better UX for mobile users — no link-clicking, just type 6 characters
- **Charset excludes ambiguous characters**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/I/1/L)
- **Login doesn't require verification**: Reduces friction, verification only gates social features
- **Verification gating at resolver level**: `requireVerifiedEmail()` in `helpers.ts` rather than service layer, keeps services testable

## File Map (key files)

| File | Purpose |
|------|---------|
| `backend/src/utils/token.ts` | `createShortCode()`, `createRandomToken()`, `hashToken()` |
| `backend/src/services/authService.ts` | Register, login, verify, password reset, change email |
| `backend/src/services/emailService.ts` | Email delivery (Mailtrap API or SMTP) |
| `backend/src/repositories/userRepository.ts` | User CRUD, email update, verification |
| `backend/src/graphql/resolvers/helpers.ts` | `requireAuth()`, `requireVerifiedEmail()` |
| `backend/src/types/index.ts` | `AuthenticatedUser`, `GraphQLContext` |
| `mobile/src/screens/AuthScreen.tsx` | Login/register/password-reset flows |
| `mobile/src/screens/FriendsScreen.tsx` | Friend management + verification UI (gated) |
| `mobile/src/screens/ProfileScreen.tsx` | Profile editing + verification + email change |
