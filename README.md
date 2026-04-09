# FreeRota

FreeRota is a work rota and schedule coordination app with:

- React Native mobile client (`mobile`)
- Node.js + GraphQL backend (`backend`)
- MongoDB persistence
- Shared contracts package (`shared`)

## Quick Start

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure backend environment

```bash
cp .env.example backend/.env
```

Update values in `backend/.env` as needed.

### 4. Run backend

```bash
npm run dev:backend
```

GraphQL endpoint:

- `http://localhost:4000/graphql`

### 5. Run mobile app

```bash
cp mobile/.env.example mobile/.env
```

Set `EXPO_PUBLIC_GRAPHQL_URL` in `mobile/.env` to a backend URL reachable by your simulator or physical device.

```bash
npm run dev:mobile
```

### 6. Run web app locally (tester preview)

Use this when you want to validate the same app flow in a browser before app store distribution.

```bash
npm run dev:web
```

### 7. Build web app for testers

Set `EXPO_PUBLIC_GRAPHQL_URL` in `mobile/.env` to your deployed backend GraphQL endpoint, then build:

```bash
npm run build:web
```

Static files are generated in `mobile/dist`.

For production-like tester rollout details (CORS, environment strategy, and hosting options), see `docs/web-tester-deployment.md`.

For a full setup walkthrough targeting Render backend + GitHub Pages frontend (including Actions workflow), see `docs/render-github-pages-setup.md`.

## Implemented in this initial slice

- Account registration, login, profile update, account soft-delete
- Rota CRUD (create, read, update, delete)
- Friendship flow (request, accept/reject, remove, block/unblock)
- Privacy policy enforcement for schedule visibility
- Free-time overlap query over 30-minute slots
- Direct messaging service + GraphQL subscription channel scaffold
- Feature-first React Native screen shell

## Architecture Notes

- Backend follows layered separation:
     - GraphQL resolvers (transport)
     - Services (business rules)
     - Repositories (persistence)
     - Models (MongoDB schema)
- Privacy rules live in a dedicated policy service.
- Free-time computation uses UTC normalized intervals.

## Next Implementation Steps

1. Add robust input validation with schema-level constraints.
2. Add auth refresh strategy and token revocation.
3. Complete real-time subscription payload and client websocket link.
4. Add automated tests for policy and free-time edge cases.
5. Add mobile data hooks and mutation workflows.
