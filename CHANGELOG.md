# Changelog

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
