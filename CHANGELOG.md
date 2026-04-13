# Changelog

## 2026-04-13 (patch 2)

### Changed — Friends + Messages Merge

- Combined `FriendsScreen` and `MessagesScreen` into a single tab. Clicking an accepted friend opens a chat sub-view inline.
- Removed the **Messages** tab from the bottom nav (4 tabs remain: Rota, Friends, Free Time, Profile).
- Chat view includes back button, message history with own/other styling, compose field.
- `MessagesScreen.tsx` is now orphaned and can be deleted.

## 2026-04-13 (patch 1)

### Changed — Brutalist UI Redesign (Global)

- **Breaking**: Rewrote the entire design system (`themes.ts`) to match the `Design.html` reference. All screens now inherit the Brutalist dark aesthetic.
- Forced dark-only mode — light theme is no longer available.
- Color palette: `#0A0A0A` background, `#d2bbff` primary purple, `#abd600` tertiary green, all from Google Material 3 spec.
- All border radii set to `0`, border width `4px`, with industrial offset shadows (`4px 4px` and `8px 8px`).
- Updated shared components (`ActionButton`, `FormField`, `StateNotice`, `ScreenIntroCard`) with brutalist borders, shadows, uppercase text.
- Redesigned App header: minimal row with accent purple title on left, settings on right.
- Redesigned bottom nav: flat dark bar with tertiary green top-border on active tab, uppercase 10px labels.

## 2026-04-12 (patch 2)

### Added — Change Email

- New `changeEmail` mutation: requires authenticated user, password confirmation, and a reason for the change.
- New `ChangeEmailInput` GraphQL input type with `newEmail`, `password`, and `reason` fields.
- New `updateEmailById` repository method that resets verification state when email changes.
- ProfileScreen: expandable "Change Email" section with reason picker (bottom-sheet modal with 6 predefined options).
- Changing email resets `emailVerifiedAt` and triggers a new verification code to the new address.

### Changed — FriendsScreen Content Gating

- **Breaking UX**: All friend request and relationship content is now fully hidden when the user's email is unverified. Previously, the content was visible but actions were disabled.

### Fixed — Background Transparency

- Root `View` wrapper in `App()` now includes `flex: 1` to fill the viewport, resolving the transparent background issue on web.

## 2026-04-12

### Changed — Email Verification Overhaul

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
