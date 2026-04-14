# Architecture Document

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER DEVICE (Mobile)                   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │          Next.js App (Vercel CDN)               │     │
│  │                                                 │     │
│  │  ┌──────────┐  ┌────────────┐  ┌────────────┐  │     │
│  │  │  App     │  │  Zustand   │  │  R3F       │  │     │
│  │  │  Router  │  │  Stores    │  │  Canvas    │  │     │
│  │  └──────────┘  └────────────┘  └────────────┘  │     │
│  │        │              │               │         │     │
│  │        └──────────────┼───────────────┘         │     │
│  │                       │                         │     │
│  │              ┌────────────────┐                 │     │
│  │              │ React Query    │                 │     │
│  │              │ (API Cache)    │                 │     │
│  │              └───────┬────────┘                 │     │
│  └──────────────────────┼─────────────────────────┘     │
│                         │ HTTPS                          │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Railway Infrastructure                      │
│                                                           │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │    NestJS API            │  │   PostgreSQL 15       │  │
│  │    (Railway Service)     │  │   (Railway Add-on)    │  │
│  │                          │  │                       │  │
│  │  ┌──────────────────┐   │  │  ┌─────────────────┐  │  │
│  │  │ Auth Module      │   │  │  │ users           │  │  │
│  │  │ Users Module     │   │◄─►  │ levels          │  │  │
│  │  │ Levels Module    │   │  │  │ scores          │  │  │
│  │  │ Scores Module    │   │  │  │ achievements    │  │  │
│  │  │ Leaderboard      │   │  │  │ daily_challenges│  │  │
│  │  │ Daily Challenge  │   │  │  └─────────────────┘  │  │
│  │  └──────────────────┘   │  │                       │  │
│  └──────────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### State Management (Zustand)

```
┌────────────────────────────────────────────────────┐
│                  Zustand Stores                     │
│                                                     │
│  gameStore          yarnGameStore      uiStore       │
│  ─────────          ─────────────     ───────       │
│  phase              phase(yarn)       activeModal   │
│  currentLevel       leftCollector     toasts        │
│  score              rightCollector    isPaused      │
│  timerMs            bufferStack       zoom          │
│  moves              celebration       setZoom       │
│  hintsUsed          clearedBalls                    │
│                     totalBalls        settingsStore │
│  authStore                            ────────────  │
│  ─────────          debugStore        quality       │
│  user               ──────────        soundEnabled  │
│  token              animation vals    musicEnabled  │
│  isAuthenticated    lighting vals     hapticEnabled │
│                     colour vals                     │
└────────────────────────────────────────────────────┘
```

### R3F Scene Graph

```
<Canvas gl={{ localClippingEnabled: true }}>
  <Suspense fallback={<LoadingScreen />}>
    <Scene>
      <Camera />              ← Perspective, FOV 60, Z=10
      <Lights />              ← Debug-driven (ambient + key + fill + rim)
      <CollectorCelebration /> ← Full-screen shader burst on collector fill
      
      <YarnBallGenerator>     ← Spawns yarn stacks per level
        <YarnBall /> × N      ← Collectible pieces with:
          <group>               - Core geometry (house/tree/ball part)
            <mesh />            - Spiral tubes (for standard balls)
          </group>
          <mesh (fresnel) />    - Rim glow (standard balls only)
          <mesh (thread) />     - Unravel animation thread
          <mesh (disc) />       - Colour disc (fly-to-collector)
      </YarnBallGenerator>
      
      <OrbitControls />       ← Horizontal + limited vertical rotation
    </Scene>
  </Suspense>
</Canvas>

HTML Overlays (outside Canvas):
  <BackButton />
  <TargetColorDisplay />    ← Top-center progress
  <ZoomSlider />            ← Left-center vertical slider
  <BufferStack />           ← Buffer wrong-colour balls
  <ColorCollectors />       ← Bottom left/right collector panels
  <GameResultOverlay />     ← Win/lose screen
  <DebugPanel />            ← Leva GUI (dev only)
```

### Knot Data Structure

```typescript
// A knot is a planar graph where strings are edges
// and crossing points are nodes

interface KnotGraph {
  nodes: KnotNode[]     // 3D positions of crossing points
  edges: KnotEdge[]     // Rope segments between nodes
  strings: KnotString[] // Complete string paths (sequence of edges)
}

interface KnotNode {
  id: string
  position: Vector3     // Current 3D position
  isFixed: boolean      // Fixed endpoints
  crossingEdges: string[] // Which strings cross here
}

interface KnotEdge {
  id: string
  from: string          // node id
  to: string            // node id  
  stringId: string      // which string this belongs to
  over: boolean         // goes OVER or UNDER at crossing
}

interface KnotString {
  id: string
  color: string         // Hex color
  nodeSequence: string[] // Ordered node ids
}
```

### Interaction Flow

```
User Tap on Yarn Piece
      │
      ▼
YarnBallGenerator (centralised pointerdown/pointerup)
      │
      ├── Raycast against yarn piece groups
      │
      ├── Determine colour match:
      │     ├── Matches left collector  → collectTarget = 'left'
      │     ├── Matches right collector → collectTarget = 'right'
      │     └── No match               → collectTarget = 'buffer'
      │
      ├── Set shouldCollect=true on the top layer
      │
      └── YarnBall animation plays:
            ├── Phase 1: UNRAVEL — zigzag thread + clip plane (0.85s)
            ├── Phase 2: GATHER  — thread morphs into yarn ball (0.6s)
            ├── Phase 3: FLY     — colour disc arcs to target (0.35s)
            └── onCollected callback fires:
                  ├── addToCollector(side) → if 3/3 → celebration + clearCollector
                  ├── or addToBuffer() → if 5 → phase='lost'
                  ├── clearBalls() → if all cleared → phase='won'
                  └── Reveal next inner layer (spawn animation)
```

### Performance Architecture

```
Quality Tiers (auto-detected via usePerformance hook):

HIGH (desktop / flagship)
  pixelRatio: devicePixelRatio
  shadows: false (use baked AO)
  antialias: true
  maxStringSegments: 32
  particleCount: 200

MEDIUM (mid-range mobile)
  pixelRatio: min(devicePixelRatio, 1.5)
  antialias: false
  maxStringSegments: 24
  particleCount: 100

LOW (low-end mobile)
  pixelRatio: 1
  antialias: false
  maxStringSegments: 16
  particleCount: 0
  
FPS Monitor: useFrame accumulates frame times
→ drops below 50fps for 2s → auto-downgrade tier
```

---

## Backend Architecture

### Module Structure

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule (global)
├── ThrottlerModule (global, 10 req/min default)
├── AuthModule
│   ├── LocalStrategy
│   ├── JwtStrategy  
│   └── JwtRefreshStrategy
├── UsersModule
├── LevelsModule
├── ScoresModule
├── LeaderboardModule
├── AchievementsModule
└── DailyChallengeModule (CronJob: daily at midnight UTC)
```

### API Layers

```
Controller (Route handling, DTO validation)
    │
    ▼
Service (Business logic, transactions)
    │
    ▼
Repository (TypeORM, DB queries)
    │
    ▼
PostgreSQL
```

### Auth Flow

```
Register:
POST /api/v1/auth/register
  → Hash password (bcrypt, rounds=12)
  → Create user
  → Return accessToken + refreshToken

Login:
POST /api/v1/auth/login
  → Validate credentials
  → Return accessToken (15min) + refreshToken (7days)

Refresh:
POST /api/v1/auth/refresh
  → Validate refreshToken
  → Return new accessToken

Protected routes:
  → Bearer token in Authorization header
  → JwtAuthGuard validates
  → @CurrentUser() decorator extracts user
```

### Score Validation

```
Submit Score:
  1. Receive: levelId, timeMs, moves, hintsUsed
  2. Validate: level exists, user hasn't submitted identical score
  3. Calculate server-side score:
     baseScore = 1000
     timePenalty = floor(timeMs / 1000) * 2
     movePenalty = moves * 5
     hintPenalty = hintsUsed * 100
     finalScore = max(0, baseScore - timePenalty - movePenalty - hintPenalty)
  4. Store + return rank
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  total_score INTEGER DEFAULT 0,
  levels_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Levels
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  knot_data JSONB NOT NULL,        -- KnotGraph JSON
  par_time_ms INTEGER NOT NULL,    -- Target completion time
  par_moves INTEGER NOT NULL,
  order_index INTEGER UNIQUE NOT NULL,
  is_daily BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, level_id)        -- One best score per level
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(255)
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Daily Challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES levels(id),
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scores_level_score ON scores(level_id, score DESC);
CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_levels_order ON levels(order_index);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(date DESC);
```

---

## API Design

### Base URL
- Development: `http://localhost:3001/api/v1`
- Production: `https://your-app.railway.app/api/v1`

### Endpoints

```
AUTH
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

USERS (protected)
  GET    /users/me
  PATCH  /users/me
  GET    /users/:id/profile (public profile)

LEVELS
  GET    /levels               ?page=1&limit=20&difficulty=3
  GET    /levels/:id
  GET    /levels/daily/today

SCORES (protected)
  POST   /scores               submit score
  GET    /scores/me            my best scores per level

LEADERBOARD
  GET    /leaderboard/global   ?levelId=&limit=100
  GET    /leaderboard/level/:id

ACHIEVEMENTS (protected)
  GET    /achievements/me
```

### Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be a valid email"]
}
```

---

## Deployment Architecture

### Frontend (Vercel)
```
GitHub push to main
       │
       ▼
Vercel CI builds Next.js
       │
       ├── Static pages generated (SSG)
       ├── Dynamic routes → Edge Functions
       └── Assets → Vercel CDN (global)
       
Environment Variables (Vercel Dashboard):
  NEXT_PUBLIC_API_URL=https://your-app.railway.app/api/v1
  NEXT_PUBLIC_APP_URL=https://your-game.vercel.app
```

### Backend (Railway)
```
GitHub push to main
       │
       ▼
Railway builds Docker image
       │
       ├── pnpm install
       ├── pnpm build
       ├── Run migrations
       └── pnpm start:prod

Environment Variables (Railway Dashboard):
  DATABASE_URL=(auto-provided by Railway PostgreSQL)
  JWT_SECRET=<generate with: openssl rand -base64 64>
  JWT_REFRESH_SECRET=<generate separately>
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d
  PORT=3001
  CORS_ORIGIN=https://your-game.vercel.app
  NODE_ENV=production
```

### Local Development
```
.env.local (Frontend):
  NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
  NEXT_PUBLIC_APP_URL=http://localhost:3000

.env (Backend):
  DATABASE_URL=postgresql://postgres:password@localhost:5432/unravel_master
  JWT_SECRET=local-dev-secret-not-for-production
  JWT_REFRESH_SECRET=local-dev-refresh-secret
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d
  PORT=3001
  CORS_ORIGIN=http://localhost:3000
  NODE_ENV=development
```

---

## Security Architecture

```
Frontend:
  - No secrets in client bundle
  - Auth tokens in httpOnly cookies (refresh token)
  - Access token in memory (Zustand)
  - Input sanitization before API calls

Backend:
  - Helmet.js (security headers)
  - CORS whitelist
  - Rate limiting (ThrottlerModule)
  - Request size limits
  - SQL injection impossible via TypeORM
  - bcrypt password hashing (rounds=12)
  - JWT with short expiry
  - Refresh token rotation
```
