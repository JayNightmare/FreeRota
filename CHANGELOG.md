# Changelog

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
