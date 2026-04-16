# FreeRota Web Tester Deployment

This path gets FreeRota to testers quickly without app store review by shipping the Expo app as a static web bundle.

## Why Web First

- Fast distribution: send a URL instead of a binary install.
- Lower friction for testing: works on desktop and mobile browsers.
- Early product feedback before app store packaging.

## Deployment Overview

1. Deploy backend API to a public HTTPS endpoint.
2. Allow your frontend origin via backend CORS (`FRONTEND_ORIGIN`).
3. Build Expo web bundle from `mobile`.
4. Host `mobile/dist` on a static hosting provider.
5. Share URL with testers.

## 1) Deploy Backend API

Your web frontend needs a reachable GraphQL API endpoint, for example:

- `https://api.your-domain.com/graphql`

In `backend/.env`, configure:

```env
PORT=4000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=https://freerota-testers.your-domain.com
DISCORD_SUPPORT_WEBHOOK_URL=<discord-webhook-url>
GITHUB_ISSUE_TOKEN=<github-token-with-issues-write>
GITHUB_ISSUE_OWNER=JayNightmare
GITHUB_ISSUE_REPO=FreeRota
GITHUB_ISSUE_LABELS=tester-feedback,triage
GITHUB_ISSUE_ESCALATION_LEVEL=CRITICAL
```

Notes:

- Use `*` only for temporary testing.
- Prefer exact origin in non-dev environments.
- Every contact submission posts a Discord embed to `DISCORD_SUPPORT_WEBHOOK_URL`.
- `GITHUB_ISSUE_ESCALATION_LEVEL=CRITICAL` keeps issue creation limited to Critical urgency submissions.

## 2) Configure Mobile Web Build Environment

In `mobile/.env`, point Expo web to the deployed API:

```env
EXPO_PUBLIC_GRAPHQL_URL=https://api.your-domain.com/graphql
```

`EXPO_PUBLIC_*` variables are embedded at build time, so rebuild web after changing this value.

## 3) Build Static Web App

From repo root:

```bash
npm run build:web
```

Output directory:

- `mobile/dist`

## 4) Host `mobile/dist`

Any static host works (Netlify, Vercel, Cloudflare Pages, Azure Static Web Apps, S3 + CloudFront).

Typical settings:

- Build command: `npm run build:web`
- Publish directory: `mobile/dist`

If your host supports redirects, route all paths to `index.html` for SPA navigation fallback.

## 5) Tester Checklist

Before sharing the URL, validate:

- App loads from hosted URL over HTTPS.
- Desktop `/` redirects to `/desktop/re/landing`.
- Desktop routes render correctly on desktop and mobile browsers: `/desktop/re/landing`, `/desktop/re/platform`, `/desktop/re/solutions`, `/desktop/re/enterprise`, `/desktop/re/pricing`, `/desktop/re/log-in`, `/desktop/re/get-started`, `/desktop/re/enterprise-inquiry`.
- Unknown desktop route slugs under `/desktop/re/*` fallback to `/desktop/re/landing`.
- Login and registration work.
- GraphQL calls reach the deployed API.
- Browser origin is allowed by backend CORS.
- Core flows (rota, friends, messaging, settings) are usable.

## Local Web Smoke Test

```bash
npm run dev:web
```

Use this during development before rebuilding static artifacts.
