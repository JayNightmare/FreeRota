# FreeRota

<p align="center">
     <img src="mobile/images/FreeRota.png" alt="FreeRota logo" width="144" />
</p>

FreeRota is a rota and schedule coordination platform with a React Native (Expo) client, a GraphQL API, and MongoDB persistence.

## Current Stack

- Mobile/Web client: Expo + React Native + Apollo Client
- Backend API: Node.js + GraphQL Yoga + TypeScript
- Database: MongoDB + Mongoose
- Monorepo workspaces: `mobile`, `backend`, `shared`

## Current Product Scope

- Auth and account lifecycle:
     - Register/login
     - Email verification using 6-character code
     - Password reset
     - Change email (with reason and password confirmation)
     - Change password and soft-delete account
- Rota and shifts:
     - Shift type management
     - Rota CRUD
     - Rota screenshot OCR preview/import
     - Device calendar preview/import with duplicate/conflict handling
- Social and messaging:
     - Friend request flow (send/accept/reject/remove)
     - Block/unblock users
     - Conversations and direct messaging
     - Friends + Chat merged into one tab experience
- Coordination tools:
     - Shared free-time overlap finder
     - Privacy policy enforcement on rota visibility
- In-app operations:
     - Notifications and unread tracking
     - Admin application flow
     - Support contact flow with escalation hooks

## Repository Structure

- `backend`: GraphQL API, services, repositories, models
- `mobile`: Expo app (native + web)
- `shared`: shared package for cross-workspace contracts
- `docs`: deployment and design guidance

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for local MongoDB via compose)

### 1) Start MongoDB

```bash
docker compose up -d
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Set required values in `backend/.env` for your environment.

### 4) Configure mobile environment

```bash
cp mobile/.env.example mobile/.env
```

Set `EXPO_PUBLIC_GRAPHQL_URL` in `mobile/.env` to a URL reachable by your simulator/device.

Example local URL:

- `http://localhost:4000/graphql` (web/local emulator)
- `http://<your-lan-ip>:4000/graphql` (physical device)

### 5) Run backend

```bash
npm run dev:backend
```

GraphQL endpoint:

- `http://localhost:4000/graphql`

### 6) Run Expo app (native)

```bash
npm run dev:mobile
```

### 7) Run Expo app (web)

```bash
npm run dev:web
```

## Build Commands

- Build backend: `npm run build:backend`
- Start built backend: `npm run start:backend`
- Build web bundle: `npm run build:web` (output in `mobile/dist`)

## Desktop Web Entry Route

- Desktop users opening `/` are redirected to `/desktop/re/landing`.
- Desktop marketing routes follow `/desktop/re/[screen]`.
- Supported desktop screens: `landing`, `platform`, `solutions`, `enterprise`, `pricing`, `log-in`, `get-started`, `enterprise-inquiry`.
- Unknown desktop slugs (for example `/desktop/re/abc`) fall back to `/desktop/re/landing`.
- Mobile users can still open desktop routes directly.

## Deployment Guides

- Web tester rollout guide: `docs/web-tester-deployment.md`
- Render + GitHub Pages setup: `docs/render-github-pages-setup.md`

## Architecture Notes

- Backend layering:
     - GraphQL resolvers (transport)
     - Services (business rules)
     - Repositories (data access)
     - Models (MongoDB schemas)
- UTC-normalized date handling for rota/free-time calculations
- Runtime mobile API resolution supports:
     - `EXPO_PUBLIC_GRAPHQL_URL`
     - Expo `extra` values
     - Expo host-derived fallback
