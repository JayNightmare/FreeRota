# FreeRota – Project Memory

## Architecture

- **Monorepo**: `backend/` (Node.js + GraphQL Yoga + MongoDB/Mongoose), `mobile/` (React Native + Expo + Apollo Client), `shared/`
- **Auth**: JWT-based, stored in `authStorage` (AsyncStorage), hydrated in `AuthProvider`
- **GraphQL**: Yoga server with hand-rolled resolvers, Apollo Client on mobile
- **Email**: Mailtrap API or SMTP (nodemailer), via `emailService`

## Active Tasks

### Completed

- Desktop / Mobile Split + Enterprise Registration (2026-04-21):
     - Split desktop and mobile into two fully separate experiences. Desktop routes stay in `/desktop/re/*` after auth; mobile retains portrait-only guard.
     - Created `DesktopDashboardScreen.tsx` — sidebar-nav admin portal with org profile, sites/teams, SSO identity, audit log, and enterprise application panels.
     - Added `applyForEnterprise` mutation (fires Discord enterprise webhook) and `approveEnterpriseApplication` (system admin only, upgrades billingTier to ENTERPRISE and enables SSO).
     - Added `PENDING_ENTERPRISE` billing tier to Organization model.
- FreeRota Enterprise Phase 5 (2026-04-21):
     - Engineered structural IdP integrations via mock `ssoService` architecture natively binding incoming tokens via a global REST interception wrapper over the GraphQL engine.
     - Scaffolded Just-In-Time (`JIT`) account provisioning bound strictly to MongoDB role assignments safely bypassing traditional user verification layers.
- FreeRota Enterprise Phase 4 (2026-04-21):
     - Scaffolded cross-platform React Native frontend implementation via `EnterpriseAdminScreen.tsx`.
     - Integrated the complete read/write capability to `Site`, `Team`, and immutable `AuditEvent` ledgers seamlessly exposing backend UI rendering cleanly mapped entirely to the user's localized Organization token.
- FreeRota Enterprise Phase 3 (2026-04-21):
     - Engineered append-only MongoDB `AuditEvent` collection logic utilizing strict 1-year auto-TTL retention natively.
     - Centralized standard `logEvent` triggers globally within `auditService.ts`.
     - Instrumented all GraphQL generation endpoints (`createSite`, `createSchedule`, etc.) behind `tenantResolver` to automatically construct localized immutable logs upon resolving.
     - Completed underlying `updateScheduleStatus` logic bridging organizational authorizations accurately to trigger approval states securely.
- FreeRota Enterprise Phase 2 (2026-04-21):
     - Engineered `tenantRepository.ts` abstracting multitenancy CRUD queries structure securely.
     - Upgraded `schema.ts` introducing `Organization`, `Schedule`, `Site`, `Team`, `Role` data types to public GraphQL schema alongside mutative API surface.
     - Finalized logic inside `tenantResolver.ts` using `requireOrganizationPermission` context blocks to authorize and block unauthorized organization endpoints.
- FreeRota Enterprise Phase 1 (2026-04-21):
     - Created fully multi-tenant enterprise data models (`Organization`, `Site`, `Team`, `Role`, `OrganizationMembership`, `Schedule`).
     - Updated `RotaEntry` schemas to link to `organizationId` and `scheduleId`.
     - Added RBAC utilities (`hasOrganizationPermission` and `requireOrganizationPermission`) for generic organizational authorization.
     - Developed migration script to map existing legacy users into auto-created personal `Organization` tenants.
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

- **Enterprise Architecture**: Built a unified multi-tenant model. All users reside inside an `Organization` workspace instance (even `PERSONAL` users). Hierarchy is semi-flattened: `Region` and `Department` are just attributes on physical `Site` and `Team` collections. Schedule workflow states map onto a new parent `Schedule` model bridging `RotaEntry` components.
- **Short codes over deep links for verification**: Better UX for mobile users — no link-clicking, just type 6 characters
- **Charset excludes ambiguous characters**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/I/1/L)
- **Login doesn't require verification**: Reduces friction, verification only gates social features
- **Verification gating at resolver level**: `requireVerifiedEmail()` in `helpers.ts` rather than service layer, keeps services testable

## File Map (key files)

| File                                         | Purpose                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| `backend/src/utils/token.ts`                 | `createShortCode()`, `createRandomToken()`, `hashToken()` |
| `backend/src/services/authService.ts`        | Register, login, verify, password reset, change email     |
| `backend/src/services/emailService.ts`       | Email delivery (Mailtrap API or SMTP)                     |
| `backend/src/repositories/userRepository.ts` | User CRUD, email update, verification                     |
| `backend/src/graphql/resolvers/helpers.ts`   | `requireAuth()`, `requireVerifiedEmail()`                 |
| `backend/src/types/index.ts`                 | `AuthenticatedUser`, `GraphQLContext`                     |
| `mobile/src/screens/AuthScreen.tsx`          | Login/register/password-reset flows                       |
| `mobile/src/screens/FriendsScreen.tsx`       | Friend management + verification UI (gated)               |
| `mobile/src/screens/ProfileScreen.tsx`       | Profile editing + verification + email change             |
