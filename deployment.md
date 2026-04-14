# Deployment Guide

## Overview

| Service | Platform | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel | Hobby (Free) | $0/month |
| Backend API | Railway | Starter | ~$1-2/month (from $5 credit) |
| Database | Railway PostgreSQL | Included add-on | Included above |

---

## Local Development (Test Before Deploy)

### 1. Environment Setup

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/unravel_master
JWT_SECRET=local-dev-secret-change-this-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-this-too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 2. Start Local Database
```bash
# Docker (recommended):
docker run --name unravel-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=unravel_master \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running:
docker ps | grep unravel-db
```

### 3. Run Migrations & Seed
```bash
cd apps/backend
pnpm migration:run
pnpm seed
```

### 4. Start Both Apps
```bash
# From repo root:
pnpm dev

# Or separately:
# Terminal 1:
cd apps/backend && pnpm start:dev

# Terminal 2:
cd apps/frontend && pnpm dev
```

### 5. Verify Local Setup
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Health check: http://localhost:3001/api/v1/health
- API docs (Swagger): http://localhost:3001/api/docs

---

## Railway Backend Deployment

### Step 1: Create Railway Account
1. Go to https://railway.com
2. Sign up with GitHub account
3. You get **$5 free credit** — enough for this project at low traffic

### Step 2: Create New Project
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your `unravel-master` repository
3. Railway will detect the project

### Step 3: Configure Service
1. Click on the service Railway created
2. Go to **Settings** tab
3. Set **Root Directory**: `apps/backend`
4. Set **Build Command**: `pnpm install && pnpm build`
5. Set **Start Command**: `pnpm start:prod`

> **Note**: If using Turborepo, Railway may need build from repo root:
> - Root Directory: ` ` (leave empty / repo root)  
> - Build Command: `pnpm install && pnpm turbo build --filter=backend`
> - Start Command: `node apps/backend/dist/main.js`

### Step 4: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically adds `DATABASE_URL` to your service environment

### Step 5: Set Environment Variables
Go to your backend service → **Variables** tab → add:

```
JWT_SECRET=<run: openssl rand -base64 64>
JWT_REFRESH_SECRET=<run: openssl rand -base64 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://YOUR-GAME.vercel.app
```

> ⚠️ Set CORS_ORIGIN after you know your Vercel URL. You can use `*` temporarily then update.

### Step 6: Configure Auto-Deploy
- Railway auto-deploys on every push to `main` branch
- Go to **Settings** → **Deploy** → confirm GitHub branch is `main`

### Step 7: Set Up Domain
1. Go to service **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get: `https://your-app.railway.app`
4. Note this URL — you'll need it for Vercel

### Step 8: Verify Backend is Live
```bash
export RAILWAY_URL=https://your-app.railway.app

# Health check
curl $RAILWAY_URL/api/v1/health
# Expected: {"status":"ok"}

# Check levels loaded
curl $RAILWAY_URL/api/v1/levels
# Expected: {"success":true,"data":[...levels]}
```

### Step 9: Run Production Migrations
Migrations should run automatically on startup if configured in `main.ts`:
```typescript
// apps/backend/src/main.ts
const dataSource = app.get(DataSource);
await dataSource.runMigrations();
```

Or run manually via Railway CLI:
```bash
railway run pnpm migration:run
```

---

## Vercel Frontend Deployment

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub account
3. **Hobby plan is free** — no credit card needed for basic usage

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your `unravel-master` GitHub repository
3. Click **"Import"**

### Step 3: Configure Build Settings
```
Framework Preset: Next.js (auto-detected)
Root Directory: apps/frontend
Build Command: pnpm build  (or leave default: next build)
Output Directory: .next
Install Command: pnpm install
```

> **Monorepo note**: If Vercel can't find `apps/frontend`:
> - Set Root Directory to `apps/frontend`
> - Vercel will run `pnpm install` from that directory

### Step 4: Set Environment Variables
In Vercel project settings → **Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://your-app.railway.app/api/v1
NEXT_PUBLIC_APP_URL = https://your-game.vercel.app
```

> Set these for **Production**, **Preview**, and **Development** environments

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build (2-4 minutes)
3. Get your production URL: `https://your-game.vercel.app`

### Step 6: Update Railway CORS
Go back to Railway → Backend service → Variables:
```
CORS_ORIGIN=https://your-game.vercel.app
```
Redeploy backend.

### Step 7: Configure Custom Domain (Optional)
- Vercel Dashboard → Domains → Add domain
- Works with free plan for any domain you own

### Step 8: Verify Frontend is Live
1. Open `https://your-game.vercel.app` on mobile
2. Open DevTools (Desktop) → Network tab
3. Verify API calls go to Railway URL
4. Test: register an account, load a level, submit a score

---

## Continuous Deployment

Both platforms auto-deploy on push to `main`:

```
Developer pushes to main branch
         │
         ├──► Railway detects push
         │         └── Builds & deploys backend
         │              └── Runs migrations
         │
         └──► Vercel detects push
                   └── Builds & deploys frontend
                        └── Purges CDN cache
```

### Preview Deployments
- **Vercel**: Every PR gets a preview URL automatically
- **Railway**: Only deploys `main` by default (add PR environments in settings if needed)

---

## GitHub Actions CI (Optional but Recommended)

**`.github/workflows/ci.yml`**:
```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm --filter frontend lint
      - run: pnpm --filter frontend type-check
      - run: pnpm --filter frontend test

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: unravel_test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm --filter backend lint
      - run: pnpm --filter backend type-check
      - run: pnpm --filter backend test
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/unravel_test
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
```

---

## Monitoring & Debugging Production

### Railway Logs
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login

# View live logs
railway logs --follow

# Open shell in running container
railway shell
```

### Vercel Logs
- Dashboard → Project → Functions tab → View logs
- Or: `vercel logs https://your-game.vercel.app`

### Common Production Issues

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| CORS error | `CORS_ORIGIN` not updated | Update Railway env var |
| 502 Bad Gateway | Backend crashed | Check Railway logs |
| Slow API | DB query without index | Add index in migration |
| PWA not installing | Wrong HTTPS setup | Ensure Vercel URL is HTTPS |
| Score not submitting | JWT expired | Check token refresh logic |

---

## Free Tier Limits Reference

### Vercel Hobby (Free)
- 100GB bandwidth/month
- Unlimited deployments
- Serverless function: 10s timeout
- No bandwidth or deployment limit worries for a game at low traffic

### Railway Starter
- $5/month free credit
- Estimated usage for this project:
  - Backend service: ~512MB RAM → ~$2-3/month
  - PostgreSQL 1GB → ~$0.5/month
  - **Total: ~$3/month** (within free credit)
- If exceeding: upgrade to Hobby ($5/month) or optimize service to sleep

### Scale Strategy (if game grows)
1. Add response caching (Redis on Railway) for leaderboards
2. Move static level data to Vercel edge config (free)
3. Consider PlanetScale or Neon for serverless PostgreSQL
4. Add Cloudflare CDN in front of Railway
