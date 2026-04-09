# FreeRota Deployment Setup

This guide covers:

1. Backend deployment to Render.
2. Frontend deployment to GitHub Pages (with GitHub Actions workflow).

## Prerequisites

1. A MongoDB database reachable from Render (MongoDB Atlas recommended).
2. Your GitHub repository pushed to the default branch.
3. Render account connected to GitHub.

## Part A: Backend Deployment to Render

### 1) Create a Render Web Service

1. Open Render dashboard.
2. Select New +, then Web Service.
3. Connect the GitHub repository FreeRota.
4. Configure service:
      - Name: freerota-backend (or your preferred name)
      - Root Directory: backend
      - Runtime: Node
      - Build Command: npm install && npm run build
      - Start Command: npm run start

### 2) Configure Render Environment Variables

In Render service settings, add:

1. MONGODB_URI = your MongoDB connection string
2. JWT_SECRET = a strong secret (minimum 16 chars)
3. JWT_EXPIRES_IN = 7d
4. FRONTEND_ORIGIN = `https://rota.nexusgit.info`

Notes:

- Do not hardcode localhost values in Render.
- Render provides PORT automatically, and backend already supports this.

### 3) Deploy and Verify Backend

1. Trigger first deploy.
2. After deploy completes, copy your backend URL:
      - `https://freerota.onrender.com`
3. Verify GraphQL endpoint responds:
      - `https://freerota.onrender.com/graphql`

The frontend workflow is already configured to use `https://freerota.onrender.com/graphql`.

## Part B: Frontend Deployment to GitHub Pages

A workflow has been added at [.github/workflows/deploy-frontend-gh-pages.yml](.github/workflows/deploy-frontend-gh-pages.yml).

### 1) Configure GitHub Pages Source

1. Open repository Settings, then Pages.
2. Under Build and deployment:
      - Source: GitHub Actions

### 2) Confirm Frontend Build API URL

1. Open [.github/workflows/deploy-frontend-gh-pages.yml](.github/workflows/deploy-frontend-gh-pages.yml).
2. Confirm job-level environment contains:
      - `EXPO_PUBLIC_GRAPHQL_URL: https://freerota.onrender.com/graphql`
      - `FRONTEND_DOMAIN: rota.nexusgit.info`
3. If backend URL changes later, update `EXPO_PUBLIC_GRAPHQL_URL` in that workflow.

### 3) Commit and Push Workflow

The workflow triggers on pushes to main affecting mobile, root package files, or the workflow itself. It can also run manually via workflow_dispatch.

What the workflow does:

1. Installs dependencies with npm ci.
2. Builds static Expo web output (mobile/dist).
3. Rewrites /\_expo asset path references to ./\_expo for GitHub Pages project-path compatibility.
4. Writes `CNAME` with `rota.nexusgit.info` for custom domain mapping.
5. Copies index.html to 404.html to support SPA fallback routing.
6. Publishes mobile/dist to GitHub Pages.

### 4) Find Your GitHub Pages URL

After deployment succeeds, GitHub provides the Pages URL in:

1. Actions run summary.
2. Settings, Pages.

Typical URL format:

- `https://rota.nexusgit.info/`

### 5) Final CORS Update in Render

Now update backend CORS origin:

1. Go to Render service Environment.
2. Set FRONTEND_ORIGIN to your GitHub Pages origin (scheme + host only).
      - `https://rota.nexusgit.info`
3. Trigger backend redeploy.

This aligns GraphQL Yoga CORS with your deployed frontend origin.

## End-to-End Validation Checklist

1. Open GitHub Pages URL and confirm app loads.
2. Register/login from web app.
3. Ensure GraphQL requests succeed (no CORS errors in browser console).
4. Validate core flows: rota, friends, messages, settings.

## Troubleshooting

### Need to change API host later

Update `EXPO_PUBLIC_GRAPHQL_URL` in [.github/workflows/deploy-frontend-gh-pages.yml](.github/workflows/deploy-frontend-gh-pages.yml).

### Frontend loads but API calls fail with CORS

Set Render FRONTEND_ORIGIN to `https://rota.nexusgit.info` (no trailing slash).

### Slow first backend response on free plan

Render free services can cold start; subsequent requests are faster.
