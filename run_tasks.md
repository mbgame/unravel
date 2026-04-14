# Run Tasks Guide

> This file tells the AI (or developer) exactly how to execute each task — step by step — including commands, setup, and verification.

---

## Prerequisites

### Required Tools
```bash
node --version    # v20+ required
pnpm --version    # v8+ required (install: npm i -g pnpm)
git --version     # any recent version
docker --version  # optional, needed for production-like local DB
psql --version    # PostgreSQL 15+ (for local DB)
```

### One-Time Setup (Local)
```bash
# 1. Clone the repo
git clone https://github.com/your-org/unravel-master.git
cd unravel-master

# 2. Install all dependencies (all workspaces)
pnpm install

# 3. Setup local PostgreSQL database
# Option A: Docker (recommended)
docker run --name unravel-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=unravel_master \
  -p 5432:5432 \
  -d postgres:15-alpine

# Option B: Local PostgreSQL
createdb unravel_master

# 4. Setup environment files
cp apps/frontend/.env.local.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
# Edit both files with your local values

# 5. Run DB migrations
pnpm migration:run

# 6. Seed initial data (levels etc.)
pnpm seed

# 7. Start development servers
pnpm dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Development Commands Reference

### Root Level (Turborepo)
```bash
pnpm dev              # Start all apps in parallel
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check all packages
pnpm clean            # Clean all .next, dist folders
```

### Frontend Only
```bash
cd apps/frontend
pnpm dev              # http://localhost:3000
pnpm build            # Production build
pnpm start            # Serve production build
pnpm test             # Vitest unit tests
pnpm test:watch       # Watch mode
pnpm analyze          # Bundle analyzer
```

### Backend Only
```bash
cd apps/backend
pnpm dev              # http://localhost:3001 (watch mode)
pnpm build            # Compile TypeScript → dist/
pnpm start            # Run compiled output
pnpm start:dev        # NestJS watch mode with hot reload
pnpm test             # Jest unit tests
pnpm test:e2e         # End-to-end tests
pnpm test:cov         # Coverage report
```

### Database Commands
```bash
# From repo root or apps/backend:
pnpm migration:generate -- src/database/migrations/MigrationName
pnpm migration:run
pnpm migration:revert
pnpm migration:show    # List all migrations and their status
pnpm seed              # Seed initial data
pnpm db:reset          # DROP all + re-migrate + seed (DEV ONLY)
```

---

## How to Implement a Task (AI Instructions)

Follow this exact process for each task:

### Step 1: Read Required Context
```
Before coding, read:
1. ai_rules.md          ← Non-negotiable constraints
2. architecture.md      ← System design decisions
3. project_structure.md ← Where files go
4. The specific task in tasks.md
```

### Step 2: Create the Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feat/task-{ID}-short-description
```

### Step 3: Implement (Follow This Order)
```
1. Types first — define interfaces and types
2. Core logic — pure functions, no side effects
3. Tests — write tests alongside (not after) logic
4. Integration — connect to stores, API, components
5. UI — render layer last
```

### Step 4: Verify Before Committing
```bash
# Must all pass before committing:
pnpm lint              # No lint errors
pnpm type-check        # No TypeScript errors
pnpm test              # All tests pass
pnpm build             # Production build succeeds

# Manual verification:
# - Open http://localhost:3000 in mobile viewport (375px)
# - Test the feature on mobile emulation in DevTools
# - Check console for errors/warnings
```

### Step 5: Commit & Push
```bash
git add .
git commit -m "feat(scope): description of what was implemented"
git push origin feat/task-{ID}-short-description
```

### Step 6: Update Task Status
```
In tasks.md, change task status from 🔲 TODO to ✅ DONE
```

---

## Running Individual Tasks

### TASK-001: Monorepo Bootstrap
```bash
# Create root structure
mkdir unravel-master && cd unravel-master
pnpm init
pnpm add -D turbo -w

# Create apps
pnpm dlx create-next-app@latest apps/frontend \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"

pnpm dlx @nestjs/cli new apps/backend --package-manager pnpm

# Verify
ls apps/    # should show: frontend/ backend/
pnpm dev    # should start both
```

---

### TASK-002: Frontend Config
```bash
cd apps/frontend
pnpm add three @react-three/fiber @react-three/drei @react-three/rapier
pnpm add zustand @tanstack/react-query framer-motion zod axios
pnpm add next-pwa
pnpm add -D @types/three vitest @vitejs/plugin-react @testing-library/react

# Verify Three.js works
# Add a simple R3F canvas to a test page and check browser
```

---

### TASK-003: Backend Config
```bash
cd apps/backend
pnpm add @nestjs/typeorm typeorm pg
pnpm add @nestjs/config joi
pnpm add @nestjs/throttler
pnpm add helmet
pnpm add class-validator class-transformer
pnpm add @nestjs/passport passport passport-local passport-jwt
pnpm add bcrypt
pnpm add @nestjs/jwt
pnpm add -D @types/passport-local @types/passport-jwt @types/bcrypt

# Test that server starts
pnpm start:dev
# Should show: Application is running on: http://localhost:3001
```

---

### TASK-006: R3F Canvas
```bash
# After creating GameCanvas.tsx:
# Open http://localhost:3000/game
# DevTools → Performance → record 5s
# Check: stable 60fps, no memory leaks
# Check: Stats panel shows draw calls < 10 (empty scene)
```

---

### TASK-016: Auth Module
```bash
# After implementing:
# Test with curl or Postman:

# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Use returned token to test protected route:
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Deployment Runbooks

### Deploy Backend to Railway (TASK-029)

#### First Time Setup
```
1. Go to https://railway.com/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to: apps/backend
5. Add PostgreSQL: "+ New" → "Database" → "PostgreSQL"
6. Railway auto-sets DATABASE_URL — verify in Variables tab
7. Add remaining environment variables:
   JWT_SECRET=<generate: openssl rand -base64 64>
   JWT_REFRESH_SECRET=<generate separately>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=3001
   CORS_ORIGIN=https://your-game.vercel.app
   NODE_ENV=production
8. Deploy — Railway builds and runs your app
9. Get public URL from Settings → Domains
```

#### Verify Railway Deployment
```bash
# Replace with your Railway URL:
export BE_URL=https://your-app.railway.app

# Health check
curl $BE_URL/api/v1/health

# Check migrations ran
curl $BE_URL/api/v1/levels | head -20
```

---

### Deploy Frontend to Vercel (TASK-030)

#### First Time Setup
```
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: Next.js (auto-detected)
4. Root directory: apps/frontend
5. Build command: pnpm build
6. Output directory: .next (default)
7. Add environment variables:
   NEXT_PUBLIC_API_URL=https://your-app.railway.app/api/v1
   NEXT_PUBLIC_APP_URL=https://your-game.vercel.app
8. Deploy
9. Get production URL from Vercel dashboard
10. Go back to Railway → update CORS_ORIGIN with Vercel URL
```

#### Verify Vercel Deployment
```
1. Visit https://your-game.vercel.app
2. Open DevTools → Network
3. Verify API calls go to Railway URL
4. Test login, level load, score submit
5. Test on mobile device via URL
```

---

## Troubleshooting

### "Cannot find module @/..." (Frontend)
```bash
# Check tsconfig.json has:
"paths": { "@/*": ["./src/*"] }
# Check next.config.js has:
experimental: { typedRoutes: true }
```

### "TypeORM connection refused" (Backend)
```bash
# Check .env has correct DATABASE_URL
# Check PostgreSQL is running:
docker ps | grep unravel-db
# Or: pg_isready -h localhost -p 5432
```

### "CORS error" in browser
```bash
# Backend .env: CORS_ORIGIN=http://localhost:3000
# Check NestJS main.ts has:
app.enableCors({ origin: process.env.CORS_ORIGIN })
```

### Poor FPS on mobile
```
- Open Chrome DevTools → Performance tab
- Record 10s of gameplay
- Look for: long frames, layout thrashing, excessive GC
- Check: geometry disposal in useEffect cleanup
- Reduce dpr: change [1, 1.5] to [1, 1]
- Enable LOW quality preset manually
```

### Railway free tier limits
```
Railway Starter: $5 credit/month
- NestJS service: ~$0.50-1.00/month (lightweight)
- PostgreSQL: ~$0.50/month (low traffic)
= ~$1-2/month total
If credit runs out: add $5 payment method or use Railway's Hobby plan
```

---

## Local HTTPS (for PWA testing)
```bash
# PWA features (Add to Home Screen) require HTTPS
# Use mkcert for local HTTPS:
brew install mkcert  # macOS
mkcert -install
mkcert localhost

# Then in next.config.js:
# (use next dev --experimental-https for Next.js 14+)
pnpm dev -- --experimental-https
```

---

## Phase 8 — Yarn Ball Tasks

### TASK-035: Yarn Ball Geometry Utility
```bash
# After creating yarnBallGeometry.ts:
cd apps/frontend
pnpm type-check
# Expected: no TypeScript errors

# Quick visual sanity check (add temporarily to any component):
# import { createYarnBallGeometry } from '@/lib/three/yarnBallGeometry'
# console.log(createYarnBallGeometry({ size: 0.5 }))
# Expected: { coreGeometry: SphereGeometry, spiralGeometries: [x5], dispose: fn }
```

---

### TASK-036: YarnBall Component
```bash
cd apps/frontend && pnpm dev
# Open http://localhost:3000/game in browser with a level loaded
# Visual checks:
# - Yarn ball visible in scene with wound-spiral appearance
# - Ball gently bobs up and down, slow Y-rotation
# - Click the ball:
#   1. Brief scale squeeze (gather phase 0.2s)
#   2. Ball arcs toward top-right corner (moving phase 0.5s)
#   3. Fades out completely (fading phase 0.3s)
# - Coin counter in top-right increments by 1

pnpm type-check && pnpm lint
# Both must pass with zero errors
```

---

### TASK-037: YarnBallGenerator Component
```bash
cd apps/frontend && pnpm dev
# Open http://localhost:3000/game
# Visual checks:
# - Exactly count=3 yarn balls appear at spread positions (not all at origin)
# - Each ball has a distinct random color and size
# - Collect all 3 → coin counter shows 3
# - No balls remain after all collected

pnpm type-check && pnpm lint
```

---

### TASK-038: Yarn Ball Integration
```bash
# Production build verification:
cd apps/frontend
pnpm build   # must succeed with zero errors/warnings
pnpm start   # serve production build

# Verify at http://localhost:3000/game:
# - Yarn balls appear alongside existing knot nodes
# - All interactions work correctly
# - No console errors

# Mobile viewport test (Chrome DevTools):
# - Set viewport to 375×667 (iPhone SE)
# - Tap targets (yarn balls) are large enough to tap accurately
# - 60fps maintained with 3 yarn balls + Fox model + stars + knot graph
```
