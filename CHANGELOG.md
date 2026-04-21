# Changelog

## [0.2.5]

### 2026-04-17

### Added - Enterprise Plan

- New subscription tier: **Enterprise Plan** at $49.99/month with advanced features and priority support.
- Added `SubscriptionPlan` enum with `FREE`, `PRO`, and `ENTERPRISE` values.
- Updated `User` model to include `subscriptionPlan` field.
- **Phase 1 Architecture**: Upgraded the backend to a multi-tenant B2B setup. Introduced `Organization`, `Site`, `Team`, `Role`, `OrganizationMembership`, and `Schedule` models.
- **Phase 1 RBAC**: Added structural middleware for team/site-level administrative gating and validation workflows.
- **Phase 2 Edge API**: Implemented Enterprise GraphQL schema and `tenantRepository` connecting frontend boundaries sequentially to the RBAC capabilities securely.
- **Phase 3 Governance**: Bootstrapped an organizational `AuditEvent` engine seamlessly logging all Phase 2 mutations (hierarchy and schedule approvals) immutably on the backend natively.
- **Phase 4 Front-End Integration**: Established raw React Native entry point for `EnterpriseAdminScreen` containing Brutalist structural layouts and complete tenant query linkage matching phases 1-3.
- **Phase 5 SSO Integration**: Deployed a scalable Identity mapping architecture combining natively injected User `ssoIdentities` array arrays alongside a functional Just-In-Time role mapper driven dynamically from remote assertions safely logged onto the Audit chain automatically.

#### Added — Web Support

- Added web support using Expo for Web. The app is now fully functional in desktop browsers with responsive design adjustments.
- New `dev:web` script to start the web version of the app.
- Web entry route is `/desktop/re/landing`, which redirects desktop users to the appropriate landing page.
- Updated README with web development instructions.

## [0.1.0]

### 2026-04-15 (patch 5)

### Fixed - Keyboard Avoidance on Mobile

- Resolved an issue where the on-screen keyboard would obscure input fields on mobile devices. The app now properly adjusts its layout to ensure all fields remain visible when the keyboard is active.
- Fixed keyboard dismissal behavior on iOS, allowing users to tap outside the input area to close the keyboard.
- Fixed an issue where the keyboard would not appear on certain Android devices when focusing on input fields. This has been resolved by updating the keyboard handling logic in the mobile app.
- Added additional padding to the bottom of screens with input fields to further enhance the keyboard avoidance experience on smaller devices.

### 2026-04-13 (patch 4)

#### Changed — Friends + Messages Merge

- Combined `FriendsScreen` and `MessagesScreen` into a single tab. Clicking an accepted friend opens a chat sub-view inline.
- Removed the **Messages** tab from the bottom nav (4 tabs remain: Rota, Friends, Free Time, Profile).
- Chat view includes back button, message history with own/other styling, compose field.
- `MessagesScreen.tsx` is now orphaned and can be deleted.

### 2026-04-13 (patch 3)

#### Changed — Brutalist UI Redesign (Global)

- **Breaking**: Rewrote the entire design system (`themes.ts`) to match the `Design.html` reference. All screens now inherit the Brutalist dark aesthetic.
- Forced dark-only mode — light theme is no longer available.
- Color palette: `#0A0A0A` background, `#d2bbff` primary purple, `#abd600` tertiary green, all from Google Material 3 spec.
- All border radii set to `0`, border width `4px`, with industrial offset shadows (`4px 4px` and `8px 8px`).
- Updated shared components (`ActionButton`, `FormField`, `StateNotice`, `ScreenIntroCard`) with brutalist borders, shadows, uppercase text.
- Redesigned App header: minimal row with accent purple title on left, settings on right.
- Redesigned bottom nav: flat dark bar with tertiary green top-border on active tab, uppercase 10px labels.

### 2026-04-12 (patch 2)

#### Added — Change Email

- New `changeEmail` mutation: requires authenticated user, password confirmation, and a reason for the change.
- New `ChangeEmailInput` GraphQL input type with `newEmail`, `password`, and `reason` fields.
- New `updateEmailById` repository method that resets verification state when email changes.
- ProfileScreen: expandable "Change Email" section with reason picker (bottom-sheet modal with 6 predefined options).
- Changing email resets `emailVerifiedAt` and triggers a new verification code to the new address.

#### Changed — FriendsScreen Content Gating

- **Breaking UX**: All friend request and relationship content is now fully hidden when the user's email is unverified. Previously, the content was visible but actions were disabled.

#### Fixed — Background Transparency

- Root `View` wrapper in `App()` now includes `flex: 1` to fill the viewport, resolving the transparent background issue on web.

### 2026-04-12 (patch 1)

#### Changed — Email Verification Overhaul

- **Breaking**: `register` mutation now returns `AuthPayload` (was `ActionResult`). Users are auto-logged-in after registration.
- **Breaking**: `verifyEmail` mutation now takes `code: String!` (was `token: String!`) and returns `ActionResult` (was `AuthPayload`). It is now an authenticated mutation.
- Verification email now contains a 6-character alphanumeric code instead of a deep link.
- Verification token TTL extended from 24 hours to 7 days.
- Unverified users can now log in and use the app. Previously, login was blocked until email was verified.
- `sendFriendRequest` and `acceptFriendRequest` mutations now require a verified email.
- Added `emailVerifiedAt` field to the `me` query response.
- Added verification UI to FriendsScreen and ProfileScreen.
- Removed `verify-email` mode from AuthScreen.
- Removed `verify-email` deep link handling.
