# Unravel — 3D Yarn Puzzle Game

A mobile-first 3D puzzle game where players collect yarn pieces from hand-crafted structures by tapping them. Each piece unravels with a knitting animation, gathers into a yarn ball, and flies to a colour collector. Earn coins, gain XP, level up, and spend coins in the cosmetics shop.

**Live:** https://unravel-game.vercel.app

---

## Production URLs

| Service | URL |
|---------|-----|
| Game (Frontend) | https://unravel-game.vercel.app |
| Backend API | https://backend-production-7114.up.railway.app/api/v1 |
| Health check | https://backend-production-7114.up.railway.app/api/v1/health |
| GitHub | https://github.com/mbgame/unravel |

---

## Documentation Index

| File | Purpose |
|------|---------|
| `deployment.md` | Vercel + Railway deployment guide |
| `architecture.md` | System design, stores, scene graph, interaction flow |
| `game_design.md` | Game mechanics, levels, visual design, audio |
| `tech_specs.md` | Detailed code configs, algorithms, types |
| `project_structure.md` | Folder/file structure for all apps |
| `user_stories.md` | User-facing requirements and acceptance criteria |
| `ai_rules.md` | Coding rules & constraints for AI implementation |

---

## Tech Stack

```
Frontend:  Next.js 14 · React Three Fiber · Three.js · Zustand · Tailwind · PWA
Backend:   NestJS · TypeORM · PostgreSQL · Passport JWT
Auth:      JWT (access 15m + refresh 7d)
Deploy FE: Vercel (hobby free tier)
Deploy BE: Railway (Docker/Nixpacks, ~$3/month)
Monorepo:  Turborepo + pnpm workspaces
Testing:   Vitest (FE) · Jest (BE)
```

---

## Quick Start (Local)

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker
git clone https://github.com/mbgame/unravel.git
cd unravel
pnpm install

# Start PostgreSQL
docker run --name unravel-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=unravel \
  -p 5432:5432 -d postgres:15-alpine

# Copy env files
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your DB credentials

# Run migrations + seed
cd apps/backend && pnpm migration:run && pnpm seed && cd ../..

# Start both apps
pnpm dev
```

| App | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api/v1 |
| Health | http://localhost:3001/api/v1/health |

---

## Game Mechanics

### Levels
- **Level 1 — Yarn House**: 15 stacks, 60 balls, 5 colours (walls, roof, floor, door, windows, gables, chimney)
- **Level 2 — Yarn Tree**: 16 stacks, 60 balls, 5 colours (trunk, branches, leaves, fruits, roots, crown)
- **Level 3+**: Procedurally generated formations with seeded RNG

### Colour Rules
- All colour counts must be multiples of 3 (each collector run = 3 balls)
- Each stack has 1–5 hidden layers of different colours underneath
- Wrong-colour taps go to buffer stack (5 = game over)

### Coins & XP
- Yarn balls with a gold coin marker award **1 coin** when collected (~25% of balls)
- Completing a level awards XP: `levelNumber × 15 + 10` (+ 15 bonus for perfect clear)
- Player level threshold: `floor(100 × (level - 1)^1.5)` cumulative XP

### Collect Animation
1. **Unravel** (0.85s) — Zigzag thread traces rows top→bottom with clipping plane
2. **Gather** (0.6s) — Thread morphs into yarn ball (loxodrome winding)
3. **Fly** (0.35s) — Colour disc arcs to collector or buffer

### Controls
- **Rotate**: Drag to orbit (horizontal + limited vertical with damping)
- **Zoom**: Vertical slider on left edge
- **Tap**: Collect yarn pieces

---

## Backend API

Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login → tokens |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | JWT | Logout |
| GET | `/users/me` | JWT | Current user profile |
| PATCH | `/users/me` | JWT | Update profile |
| GET | `/levels` | — | List levels |
| GET | `/levels/:id` | — | Level detail |
| POST | `/scores` | JWT | Submit score |
| GET | `/leaderboard/global` | — | Global top-100 |
| GET | `/leaderboard/level/:id` | — | Per-level leaderboard |
| POST | `/gamification/complete` | JWT | Award coins + XP for level win |
| GET | `/gamification/profile` | JWT | Coins, XP, player level |
| GET | `/shop/cosmetics` | — | Browse cosmetic items |
| POST | `/shop/purchase/:key` | JWT | Buy cosmetic with coins |
| POST | `/shop/equip/:key` | JWT | Equip owned cosmetic |
| GET | `/daily-challenge/today` | — | Today's challenge level |

---

## Architecture

### Stores (Zustand)
| Store | Responsibility |
|-------|----------------|
| `authStore` | JWT tokens, current user, login/logout |
| `yarnGameStore` | Game phase, collectors, buffer, coins earned |
| `gamificationStore` | Persisted coins, XP, player level, equipped cosmetics |
| `levelProgressStore` | Current level progress, stars, moves |
| `uiStore` | Modals, toasts, zoom level |

### Scene Graph (R3F)
```
Canvas
└── Scene
    ├── Camera + OrbitControls
    ├── Lights (ambient, key, fill, rim)
    ├── YarnBallGenerator
    │   └── YarnBall × N  (coin marker → gold torus ring when hasCoin)
    └── CollectorCelebration (particle burst on complete)

HTML overlays:
  CoinDisplay · TargetColorDisplay · ZoomSlider
  ColorCollectors · BufferStack · GameResultOverlay
```

### Database Schema (PostgreSQL)
```
users           — id, username, email, password_hash, coins, total_xp, player_level
levels          — id, name, difficulty, config JSON, created_at
scores          — id, user_id, level_id, score, moves, time_seconds, stars
achievements    — id, key, name, description, xp_reward
user_achievements — user_id, achievement_id, earned_at
daily_challenges  — id, level_id, date, created_at
cosmetics       — id, key, name, type, price_coins, asset_url
user_cosmetics  — user_id, cosmetic_id, equipped, purchased_at
```

### Key Source Files
```
apps/backend/src/
  config/         app.config.ts · database.config.ts · jwt.config.ts
  modules/
    auth/         auth.controller · auth.service · jwt.strategy
    users/        users.controller · users.service
    levels/       levels.controller · levels.service
    scores/       scores.controller · scores.service
    leaderboard/  leaderboard.controller · leaderboard.service
    gamification/ gamification.controller · gamification.service
    shop/         shop.controller · shop.service
    daily-challenge/
  database/
    migrations/   001_users → 007_cosmetics
    seeds/        seed.ts

apps/frontend/src/
  app/            auth/ · game/ · leaderboard/ · levels/ · shop/
  components/
    game/
      canvas/     GameCanvas · Scene · Camera · Lights
      yarn/       YarnBall · YarnBallGenerator
      ui/         CoinDisplay · ColorCollectors · BufferStack · GameResultOverlay
      effects/    CollectorCelebration
  stores/         authStore · yarnGameStore · gamificationStore · levelProgressStore · uiStore
  lib/
    api/          client · auth · level · leaderboard · gamification · shop
    game/         levelGenerator · shapeFormations
    three/        yarnHouseGeometry · yarnTreeGeometry · yarnBallGeometry + more

packages/shared-types/src/
  game.types · user.types · api.types
```

---

## Deployment

Push to `main` → Railway auto-rebuilds backend · Vercel auto-rebuilds frontend.

See [deployment.md](deployment.md) for full setup guide, env vars, and troubleshooting.

### Required env vars

**Backend (Railway)**
```
DATABASE_URL        postgresql://... (auto-set by Railway postgres service)
JWT_SECRET          <random 64-byte base64>
JWT_REFRESH_SECRET  <random 64-byte base64>
JWT_EXPIRES_IN      15m
JWT_REFRESH_EXPIRES_IN  7d
NODE_ENV            production
ALLOWED_ORIGINS     https://unravel-game.vercel.app
```

**Frontend (Vercel)**
```
NEXT_PUBLIC_API_URL   https://backend-production-7114.up.railway.app/api/v1
NEXT_PUBLIC_APP_URL   https://unravel-game.vercel.app
```
