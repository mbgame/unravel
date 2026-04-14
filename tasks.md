# Implementation Tasks

> Each task maps to one branch: `feat/task-{ID}-short-name`
> Status: 🔲 TODO | 🔄 IN PROGRESS | ✅ DONE | 🚫 BLOCKED

---

## Phase 0 — Project Setup & Scaffolding

### TASK-001 — Monorepo Bootstrap
**Status:** ✅ DONE
**Estimated:** 4h  
**Assignee:** AI  
**Branch:** `feat/task-001-monorepo-setup`

**Steps:**
1. Initialize Turborepo monorepo at root
2. Configure `pnpm-workspace.yaml`
3. Create `apps/frontend` (Next.js 14 with App Router, TypeScript, strict mode)
4. Create `apps/backend` (NestJS 10, TypeScript)
5. Create `packages/shared-types` 
6. Configure root `package.json` with workspace scripts:
   - `pnpm dev` → starts both apps
   - `pnpm build` → builds all
   - `pnpm test` → runs all tests
   - `pnpm lint` → lints all
7. Setup `.gitignore` at root and app levels

**Files to create:**
- `turbo.json`
- `pnpm-workspace.yaml`
- `package.json` (root)
- `.gitignore`
- `README.md`

---

### TASK-002 — Frontend Base Configuration
**Status:** ✅ DONE
**Estimated:** 3h  
**Depends on:** TASK-001  
**Branch:** `feat/task-002-frontend-config`

**Steps:**
1. Configure `next.config.js`:
   - Enable `swcMinify`
   - Configure `webpack` for Three.js tree shaking
   - Set up image optimization domains
2. Install and configure Tailwind CSS
3. Install core dependencies:
   - `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`
   - `zustand`
   - `@tanstack/react-query`
   - `framer-motion`
   - `zod`
   - `axios`
4. Configure `tsconfig.json` (strict, path aliases `@/` → `src/`)
5. Set up Vitest for testing
6. Create `.env.local.example`
7. Create base app layout (`src/app/layout.tsx`) with mobile viewport meta tags
8. Configure PWA: `next-pwa`, `manifest.json`

**Mobile viewport meta (critical):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

---

### TASK-003 — Backend Base Configuration
**Status:** ✅ DONE
**Estimated:** 3h  
**Depends on:** TASK-001  
**Branch:** `feat/task-003-backend-config`

**Steps:**
1. Configure NestJS with:
   - `ConfigModule` (global, `.env` file, Joi validation)
   - `TypeOrmModule` (PostgreSQL, entities autoload)
   - `ThrottlerModule` (10 req/min)
   - Helmet.js middleware
   - CORS with whitelist
   - Global validation pipe
   - Global transform interceptor
   - Global exception filter
2. Install dependencies:
   - `@nestjs/typeorm`, `typeorm`, `pg`
   - `@nestjs/config`, `joi`
   - `@nestjs/throttler`
   - `helmet`
   - `class-validator`, `class-transformer`
   - `@nestjs/passport`, `passport`, `passport-local`, `passport-jwt`
   - `bcrypt`
   - `@nestjs/jwt`
3. Create `.env.example`
4. Set up TypeORM CLI config (`typeorm.config.ts`)
5. Configure `nest-cli.json`

---

### TASK-004 — Database Setup & First Migration
**Status:** ✅ DONE
**Estimated:** 2h  
**Depends on:** TASK-003  
**Branch:** `feat/task-004-database-setup`

**Steps:**
1. Create all entities (User, Level, Score, Achievement, UserAchievement, DailyChallenge)
2. Generate and run migration `001_initial_schema`
3. Create seed script with 10 sample levels (knot data)
4. Document local PostgreSQL setup in README

---

### TASK-005 — Shared Types Package
**Status:** ✅ DONE
**Estimated:** 2h  
**Depends on:** TASK-001  
**Branch:** `feat/task-005-shared-types`

**Steps:**
1. Define all shared TypeScript interfaces in `packages/shared-types/src/`
2. Export: `KnotGraph`, `KnotNode`, `KnotEdge`, `Level`, `Score`, `User`, API response types
3. Configure package to build with `tsc`
4. Import in both FE and BE

---

## Phase 1 — Core Game Engine (R3F)

### TASK-006 — R3F Canvas Setup
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-002  
**Branch:** `feat/task-006-r3f-canvas`

**Steps:**
1. Create `GameCanvas.tsx` with R3F `<Canvas>`:
   - `camera`: perspective, fov=60, position=[0,0,10]
   - `dpr`: `[1, 1.5]` (performance: cap at 1.5x)
   - `gl`: `{ antialias: false, powerPreference: 'high-performance' }`
   - `frameloop`: `'demand'` for perf (switch to `'always'` during animation)
2. Create `Scene.tsx` wrapping with `<Suspense>`
3. Create `Lights.tsx`: ambient (intensity 0.6) + directional (intensity 1.0, no shadows)
4. Create `Camera.tsx` with OrbitControls disabled (custom controls later)
5. Create `Background.tsx`: gradient mesh plane
6. Add `<Stats />` (dev only) gated by `NODE_ENV`
7. Create `usePerformance.ts` hook for quality detection
8. Create game page: `src/app/game/page.tsx`

**Performance rules:**
- `antialias: false` on mobile
- `powerPreference: 'high-performance'`
- Use `dpr` clamp, never `window.devicePixelRatio` directly

---

### TASK-007 — Knot Data Structure & Graph
**Status:** ✅ DONE
**Estimated:** 6h  
**Depends on:** TASK-005  
**Branch:** `feat/task-007-knot-data-structure`

**Steps:**
1. Implement `KnotGraph` class in `src/lib/game/knotGraph.ts`:
   - `fromJSON(data)`: parse stored level data
   - `getCrossings()`: find all edge crossings in 3D space
   - `isUntangled()`: check if graph has no crossings (planar embedding)
   - `getStringPath(stringId)`: ordered 3D points for a string
2. Implement `knotGenerator.ts`:
   - `generateKnot(difficulty: 1-10)`: procedurally create tangled knots
   - Start with straight strings, apply random crossing operations
3. Write unit tests for `isUntangled()` and `getCrossings()`

---

### TASK-008 — String Rendering (TubeGeometry)
**Status:** ✅ DONE
**Estimated:** 6h  
**Depends on:** TASK-006, TASK-007  
**Branch:** `feat/task-008-string-rendering`

**Steps:**
1. Create `StringSegment.tsx` component:
   - Uses `TubeGeometry` (or `CatmullRomCurve3` for smooth curves)
   - Props: `points: Vector3[]`, `color: string`, `radius: number`
   - Material: `MeshStandardMaterial` or `MeshToonMaterial` for cartoon look
   - Memoize geometry to prevent re-creation on every render
2. Create `KnotNode.tsx`:
   - `SphereGeometry` at crossing points
   - Slightly larger than string radius
   - Highlight on hover/selection
3. Create `KnotMesh.tsx`:
   - Reads from `knotStore`
   - Renders all `StringSegment` and `KnotNode` components
   - Group wrapping for rotation
4. Add `UntangleEffect.tsx`: simple particle burst using `Points` geometry

**Performance:**
- Use `useMemo` for all geometries
- Dispose in `useEffect` cleanup
- Use `instancedMesh` for nodes if count > 20

---

### TASK-009 — Touch & Rotation Controls
**Status:** ✅ DONE
**Estimated:** 8h  
**Depends on:** TASK-008  
**Branch:** `feat/task-009-touch-controls`

**Steps:**
1. Create `useKnotInteraction.ts` hook:
   - Touch events: `touchstart`, `touchmove`, `touchend` on canvas
   - Single touch → rotate knot (quaternion-based)
   - Two touch → pinch to zoom (scale clamped 0.5–2.0)
   - Inertia: decay rotation after release (damping factor 0.95)
2. Implement raycasting for string/node selection:
   - `useThree` to get `raycaster` and `camera`
   - On tap (< 150ms touch): raycast against interactable meshes
   - Highlight selected string
3. Connect rotation to `KnotMesh` group rotation in `useFrame`
4. Handle both mouse (desktop) and touch (mobile) events
5. Prevent default scroll behavior on canvas touch

**Critical mobile note:**
- Use `pointer events` API instead of separate touch/mouse where possible
- Set `touch-action: none` on canvas element via CSS

---

### TASK-010 — Knot Interaction & Untangle Logic
**Status:** ✅ DONE
**Estimated:** 10h  
**Depends on:** TASK-009, TASK-007  
**Branch:** `feat/task-010-untangle-logic`

**Steps:**
1. Implement drag-to-move for string segments:
   - On string select + drag: move string node in screen space
   - Project screen drag delta → world space movement
   - Constrain movement to valid positions
2. Implement `useUntangleDetection.ts`:
   - After each move: call `knotGraph.isUntangled()`
   - Throttle: check at most once per 100ms
   - On untangled: dispatch `LEVEL_COMPLETE` to `gameStore`
3. Implement move validation:
   - Prevent moves that increase crossing complexity beyond threshold
   - Show invalid move feedback (shake animation + sound)
4. Update `knotStore` on every valid move
5. Implement `gameStore` transitions: `IDLE → PLAYING → PAUSED → COMPLETE`

---

### TASK-011 — Zustand Stores
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-002  
**Branch:** `feat/task-011-zustand-stores`

**Steps:**
1. Create all store slices:
   - `gameStore`: phase, currentLevel, score, timer, moves, hintsUsed
   - `knotStore`: graph, nodes, edges, selectedNode, isUntangled
   - `uiStore`: activeModal, toasts, isPaused
   - `settingsStore`: quality, soundEnabled, musicEnabled, hapticEnabled
   - `authStore`: user, accessToken, isAuthenticated
2. Add `persist` middleware to `settingsStore` and `authStore`
3. Add DevTools in development mode
4. Write basic store tests

---

## Phase 2 — Game UI & UX

### TASK-012 — Game HUD
**Status:** ✅ DONE
**Estimated:** 5h  
**Depends on:** TASK-011  
**Branch:** `feat/task-012-game-hud`

**Steps:**
1. Create `GameHUD.tsx` (HTML overlay over canvas via CSS absolute position):
   - Timer (counts up, formatted MM:SS)
   - Move counter
   - Hint button (shows remaining hints)
   - Pause button
2. Create `useGameTimer.ts` hook:
   - Uses `requestAnimationFrame` for accuracy
   - Respects pause state from `gameStore`
3. Style with Tailwind — mobile-first, large touch targets (min 48px)
4. Animate HUD entrance with Framer Motion

---

### TASK-013 — Main Menu & Level Select
**Status:** ✅ DONE
**Estimated:** 6h  
**Depends on:** TASK-006  
**Branch:** `feat/task-013-menu-ui`

**Steps:**
1. Create `MainMenu.tsx` with animated 3D knot preview in background
2. Create `LevelSelect` page with grid of `LevelCard.tsx` components
3. `LevelCard` shows: level name, difficulty stars, best score, lock state
4. Implement level unlock logic (local state, later sync with BE)
5. Animate page transitions with Framer Motion
6. Implement daily challenge highlight card

---

### TASK-014 — Level Complete Screen
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-012  
**Branch:** `feat/task-014-level-complete`

**Steps:**
1. Create `LevelComplete.tsx` modal:
   - Animated score reveal (count-up animation)
   - Star rating (1-3 stars based on score)
   - Score breakdown: time, moves, hints
   - Buttons: Next Level, Replay, Menu
2. Trigger `UntangleEffect` particle burst
3. Play completion sound + haptic
4. Auto-submit score to backend (if authenticated)

---

### TASK-015 — Pause Menu & Settings
**Status:** ✅ DONE
**Estimated:** 3h  
**Depends on:** TASK-011  
**Branch:** `feat/task-015-pause-settings`

**Steps:**
1. Create `PauseMenu.tsx`:
   - Blur background overlay
   - Resume, Restart, Settings, Quit buttons
2. Create `SettingsPanel.tsx`:
   - Graphics quality selector (Auto/Low/Med/High)
   - Sound + Music toggles
   - Haptics toggle
3. Wire to `settingsStore` with persistence

---

## Phase 3 — Backend & Authentication

### TASK-016 — Auth Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 8h  
**Depends on:** TASK-003, TASK-004  
**Branch:** `feat/task-016-auth-module`

**Steps:**
1. Implement `AuthModule` with:
   - `register`: hash password, create user, return tokens
   - `login`: validate credentials, return tokens
   - `refresh`: validate refresh token, return new access token
   - `logout`: invalidate refresh token
2. JWT Strategy (access token, 15min)
3. JWT Refresh Strategy (refresh token, 7 days, stored hashed in DB)
4. `@Public()` decorator for unprotected routes
5. `@CurrentUser()` parameter decorator
6. Write e2e tests for all auth endpoints

---

### TASK-017 — Users Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-016  
**Branch:** `feat/task-017-users-module`

**Steps:**
1. `GET /api/v1/users/me` — return current user profile
2. `PATCH /api/v1/users/me` — update username, avatar
3. `GET /api/v1/users/:id/profile` — public profile (no email)
4. Input validation DTOs
5. Service layer with TypeORM repository

---

### TASK-018 — Levels Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 5h  
**Depends on:** TASK-004  
**Branch:** `feat/task-018-levels-module`

**Steps:**
1. `GET /api/v1/levels` — paginated level list with difficulty filter
2. `GET /api/v1/levels/:id` — single level with full knot_data
3. `GET /api/v1/levels/daily/today` — today's daily challenge
4. Seed 20+ levels in seed script
5. Level data caching (in-memory for 5 min, low traffic)

---

### TASK-019 — Scores Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 5h  
**Depends on:** TASK-016, TASK-018  
**Branch:** `feat/task-019-scores-module`

**Steps:**
1. `POST /api/v1/scores` — submit score (server-side score calculation)
2. `GET /api/v1/scores/me` — authenticated user's best scores
3. Upsert logic: only update if new score > existing best
4. Server-side score formula validation
5. Rate limit: 10 score submissions per minute

---

### TASK-020 — Leaderboard Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-019  
**Branch:** `feat/task-020-leaderboard-module`

**Steps:**
1. `GET /api/v1/leaderboard/global` — top 100 across all levels
2. `GET /api/v1/leaderboard/level/:id` — top 100 for specific level
3. Include user's own rank even if not in top 100
4. Cache leaderboard for 60 seconds
5. Paginate results

---

### TASK-021 — Daily Challenge Module (NestJS)
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-018  
**Branch:** `feat/task-021-daily-challenge`

**Steps:**
1. `GET /api/v1/daily-challenge/today` — get today's challenge
2. `GET /api/v1/daily-challenge/leaderboard` — daily leaderboard
3. Cron job: daily at 00:00 UTC, select random level and mark as daily
4. Streak tracking per user

---

## Phase 4 — Frontend-Backend Integration

### TASK-022 — API Client & React Query Setup
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-002  
**Branch:** `feat/task-022-api-client`

**Steps:**
1. Create `src/lib/api/client.ts` with axios instance:
   - Base URL from `NEXT_PUBLIC_API_URL` env var
   - Request interceptor: attach access token
   - Response interceptor: handle 401 → auto refresh token
2. Create API service files for each module
3. Set up `QueryClientProvider` in root layout
4. Configure React Query: `staleTime: 60s`, `retry: 1`
5. Create typed query/mutation hooks

---

### TASK-023 — Auth UI Integration
**Status:** ✅ DONE
**Estimated:** 5h  
**Depends on:** TASK-016, TASK-022  
**Branch:** `feat/task-023-auth-ui`

**Steps:**
1. Create Login page (`/auth/login`)
2. Create Register page (`/auth/register`)
3. Connect to `authStore`
4. Middleware: redirect unauthenticated users from protected pages
5. Guest mode: skip auth, use localStorage

---

### TASK-024 — Levels & Scores Integration
**Status:** ✅ DONE
**Estimated:** 5h  
**Depends on:** TASK-018, TASK-019, TASK-022  
**Branch:** `feat/task-024-levels-integration`

**Steps:**
1. Fetch levels from API in Level Select page
2. Load level data from API when starting a level
3. Auto-submit score on level complete
4. Show best score in Level Select (from API + local cache)
5. Offline fallback: use localStorage cached level data

---

### TASK-025 — Leaderboard UI
**Status:** ✅ DONE
**Estimated:** 4h  
**Depends on:** TASK-020, TASK-022  
**Branch:** `feat/task-025-leaderboard-ui`

**Steps:**
1. Create Leaderboard page
2. `LeaderboardRow.tsx` component
3. Fetch global and per-level leaderboards
4. Highlight current user's row
5. Show "offline — scores unavailable" when no connection

---

## Phase 5 — Polish & Mobile Optimization

### TASK-026 — Performance Optimization
**Status:** ✅ DONE
**Estimated:** 8h  
**Depends on:** All game tasks  
**Branch:** `feat/task-026-performance`

**Steps:**
1. Implement `usePerformance.ts`:
   - Detect GPU tier (using `detect-gpu` library)
   - Auto-select quality preset
   - Monitor FPS in `useFrame`, downgrade if < 45fps for 3s
2. Implement quality presets in `qualityPresets.ts`
3. Optimize bundle:
   - Analyze with `next-bundle-analyzer`
   - Dynamic import Three.js components
   - Code split game page from marketing
4. Implement texture compression (KTX2)
5. LOD for rope geometry (less segments when zoomed out)
6. Object pooling for particle effects

---

### TASK-027 — Haptics & Audio
**Status:** ✅ DONE
**Estimated:** 4h  
**Branch:** `feat/task-027-haptics-audio`

**Steps:**
1. Create `useHaptics.ts`:
   - Wrap `navigator.vibrate()` with feature detection
   - `vibrateShort()`: 20ms — valid move
   - `vibrateLong()`: 100ms — level complete
   - `vibrateError()`: [20,50,20] pattern — invalid move
2. Create `useAudio.ts`:
   - Web Audio API based
   - Preload sounds on first user interaction
   - Respect `settingsStore.soundEnabled`
3. Integrate with game events

---

### TASK-028 — PWA & Offline Support
**Status:** ✅ DONE
**Estimated:** 5h  
**Branch:** `feat/task-028-pwa`

**Steps:**
1. Configure `next-pwa`:
   - Cache: app shell, first 10 level assets
   - Runtime caching for API responses (stale-while-revalidate)
2. Create `public/manifest.json` with correct icons and theme
3. Create `OfflineBanner.tsx` component
4. Queue score submissions when offline, sync on reconnect
5. Test offline flow with Chrome DevTools

---

## Phase 6 — Deployment

### TASK-029 — Railway Backend Deployment
**Status:** ✅ DONE
**Estimated:** 3h  
**Branch:** `feat/task-029-railway-deploy`

**Steps:**
1. Create `Dockerfile` for NestJS (multi-stage, node:20-alpine)
2. Create `railway.json` / `railway.toml` config
3. Configure `package.json` start script: `node dist/main.js`
4. Document Railway setup steps in `deployment.md`:
   - Create Railway account
   - Connect GitHub repo
   - Add PostgreSQL plugin
   - Set environment variables
5. Ensure migrations run on startup
6. Test Railway deployment

---

### TASK-030 — Vercel Frontend Deployment
**Status:** ✅ DONE
**Estimated:** 2h  
**Branch:** `feat/task-030-vercel-deploy`

**Steps:**
1. Configure `vercel.json`:
   - Build command: `pnpm build`
   - Output directory: `.next`
   - Root: `apps/frontend`
2. Document Vercel setup steps:
   - Connect GitHub repo
   - Set `NEXT_PUBLIC_API_URL` env var
   - Configure monorepo root directory
3. Test production build locally with `pnpm build && pnpm start`
4. Configure preview deployments for PRs

---

### TASK-031 — CI/CD Pipelines
**Status:** ✅ DONE
**Estimated:** 3h  
**Branch:** `feat/task-031-cicd`

**Steps:**
1. `.github/workflows/fe-ci.yml`: lint + test on PR
2. `.github/workflows/be-ci.yml`: lint + test on PR
3. Document that Vercel and Railway auto-deploy from `main`
4. Add status badges to README

---

## Phase 7 — Testing & QA

### TASK-032 — Frontend Unit Tests
**Status:** ✅ DONE
**Estimated:** 6h  
**Branch:** `feat/task-032-fe-tests`

**Steps:**
1. Test `knotGraph.ts` (untangle detection algorithm)
2. Test `scoreCalculator.ts`
3. Test Zustand stores
4. Test `useGameTimer.ts` hook
5. Snapshot tests for critical UI components

---

### TASK-033 — Backend E2E Tests
**Status:** ✅ DONE
**Estimated:** 6h  
**Branch:** `feat/task-033-be-tests`

**Steps:**
1. Auth flow e2e tests (register, login, refresh, logout)
2. Score submission and leaderboard tests
3. Level fetch tests
4. Rate limiting tests

---

### TASK-034 — Mobile Device Testing
**Status:** 🔲 TODO  
**Estimated:** 4h  
**Branch:** N/A (QA task)

**Devices to test:**
- iPhone SE (375×667) — iOS Safari
- iPhone 14 (390×844) — iOS Safari
- Samsung Galaxy A52 — Chrome Android
- Low-end Android (simulate with throttling)

**Checklist:**
- [ ] 60fps gameplay on mid-range device
- [ ] Touch controls work correctly
- [ ] No layout overflow
- [ ] PWA install prompt appears
- [ ] Offline mode works
- [ ] Haptics work on supported devices

---

## Phase 8 — Visual Experience: Yarn Ball Mechanic

### TASK-035 — Yarn Ball Geometry Utility
**Status:** ✅ DONE
**Estimated:** 2h
**Branch:** `feat/task-035-yarn-ball-geometry`

**Steps:**
1. Create `src/lib/three/yarnBallGeometry.ts`
2. Implement `createYarnBallGeometry({ size, spiralCount?, spiralResolution?, tubeRadialSegments? })` returning `{ coreGeometry, spiralGeometries, dispose }`
3. Loxodrome spiral formula: for t∈[0,1], θ=π*t, φ=N*2π*t → x=r·sin(θ)·cos(φ), y=r·cos(θ), z=r·sin(θ)·sin(φ)
4. Generate 5 spirals at different axis rotations (0°, 60°Z, 120°Z, 60°X, 90°X+45°Y) each → CatmullRomCurve3 → TubeGeometry (tubeRadius = 0.04×size, 5 radial segments)
5. Core: SphereGeometry at 0.7×size, 16×16 segments
6. Return `{ coreGeometry, spiralGeometries, dispose }` where `dispose` releases all geometries

**Files:**
- `apps/frontend/src/lib/three/yarnBallGeometry.ts` (NEW)

---

### TASK-036 — YarnBall Component
**Status:** ✅ DONE
**Estimated:** 4h
**Depends on:** TASK-035
**Branch:** `feat/task-036-yarn-ball-component`

**Steps:**
1. Create `src/components/game/yarn/YarnBall.tsx`
2. Props: `id`, `position: [x,y,z]`, `size`, `color`, `onCollected(id)`
3. Idle state: gentle float bob + slow Y-rotation (same pattern as KnotNodeMesh)
4. Collect animation state machine via `useRef<CollectPhase>` (no useState — avoids re-renders during animation):
   - `idle → gather (0.2s)`: scale squeeze = `1 - sin(progress×π)×0.25`
   - `gather → moving (0.5s)`: lerp toward unprojected NDC `(0.85, 0.85, 0.5)` with cubic ease-in-out; target computed once at phase start
   - `moving → fading (0.3s)`: opacity 1→0, scale 1→0.5
   - `fading → done`: call `onCollected(id)`
5. onClick: set phase='gather', delete `userData.yarnBallId`, call `event.stopPropagation()`
6. Materials: `MeshStandardMaterial` with `transparent:true`, `depthWrite:false` on both core + spiral meshes
7. `renderOrder={1}` on group
8. Dispose all geometries and materials in `useEffect` cleanup

**Files:**
- `apps/frontend/src/components/game/yarn/YarnBall.tsx` (NEW)

---

### TASK-037 — YarnBallGenerator Component
**Status:** ✅ DONE
**Estimated:** 2h
**Depends on:** TASK-036
**Branch:** `feat/task-037-yarn-ball-generator`

**Steps:**
1. Create `src/components/game/yarn/YarnBallGenerator.tsx`
2. Props: `count?: number` (default 3)
3. On mount: generate N instances with ring-based position spread (radiusXY 2.5–3.5, random Z -1 to +1.5)
4. Color palette: `['#E63946','#F4A261','#2A9D8F','#8338EC','#3A86FF','#FB8500','#06D6A0']`
5. Random size per ball: 0.35–0.75
6. On collect: call `useKnotStore(s=>s.collectNode)(id)` to increment coin counter; filter ball from `useState` list
7. Render `<YarnBall />` for each active ball instance

**Files:**
- `apps/frontend/src/components/game/yarn/YarnBallGenerator.tsx` (NEW)

---

### TASK-038 — Integrate Yarn Balls into Game Page
**Status:** ✅ DONE
**Estimated:** 0.5h
**Depends on:** TASK-037
**Branch:** `feat/task-038-yarn-ball-integration`

**Steps:**
1. Import `YarnBallGenerator` in `src/app/game/page.tsx`
2. Add `<YarnBallGenerator count={3} />` inside `<GameCanvas>` alongside `<KnotMesh />`
3. Verify coin counter increments on each ball collected
4. Verify `pnpm build` succeeds with zero TypeScript errors

**Files:**
- `apps/frontend/src/app/game/page.tsx` (MODIFIED)

---

## Phase 9 — Yarn Ball Game Mechanics

### TASK-039 — Game Rules Document
**Status:** ✅ DONE | **Est:** 0.5h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Create `game_rules.md` at repo root documenting the full yarn-ball collecting
mechanic: target colour, penalty stack, layer reveal, win/lose conditions, and
difficulty scaling table.

**Files:**
- `game_rules.md` (NEW)

---

### TASK-040 — Yarn Game Store
**Status:** ✅ DONE | **Est:** 1h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Create `src/stores/yarnGameStore.ts` — Zustand store managing:
- `targetColor`, `targetColorName`, `totalTargetLayers`
- `collectedCorrect`, `penaltyStack` (max 5)
- `phase`: idle → playing → won | lost
- Actions: `initLevel`, `collectCorrect`, `collectWrong`, `resetYarnGame`

**Files:**
- `apps/frontend/src/stores/yarnGameStore.ts` (NEW)

---

### TASK-041 — Level Generator
**Status:** ✅ DONE | **Est:** 2h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Create `src/lib/game/levelGenerator.ts` — deterministic client-side level
generation using seeded xorshift PRNG + Fibonacci sphere ball distribution.

Scaling:
- Level 1: 3 colours, 20 balls, max 2 layers
- Level 10+: 10 colours, 47+ balls, max 10 layers

Guarantees ≥ 8 target-colour layers per level to ensure beatable games.

**Files:**
- `apps/frontend/src/lib/game/levelGenerator.ts` (NEW)

---

### TASK-042 — Game HUD Components
**Status:** ✅ DONE | **Est:** 2h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Create three HTML overlay components:
- `TargetColorDisplay` — top-center, shows colour swatch + name + progress
- `PenaltyStack` — bottom-center, shows 5 penalty slots with colour fills
- `GameResultOverlay` — full-screen blur overlay for win/lose with Retry / Next Level buttons

**Files:**
- `apps/frontend/src/components/game/ui/TargetColorDisplay.tsx` (NEW)
- `apps/frontend/src/components/game/ui/PenaltyStack.tsx` (NEW)
- `apps/frontend/src/components/game/ui/GameResultOverlay.tsx` (NEW)

---

### TASK-043 — YarnBallGenerator with Layer System
**Status:** ✅ DONE | **Est:** 3h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Rewrite `YarnBallGenerator.tsx` with full layer mechanic:
- Accepts `levelNumber` prop, generates level via `generateLevel()`
- Inits `yarnGameStore` on mount
- Manages `ActiveBall[]` state with `layerIndex`
- On `handleCollected`: check colour vs target, call `collectCorrect/collectWrong`,
  either reveal next layer (force remount via new key) or remove ball

**Files:**
- `apps/frontend/src/components/game/yarn/YarnBallGenerator.tsx` (REWRITTEN)

---

### TASK-044 — Remove Fox Model, Simplify Scene
**Status:** ✅ DONE | **Est:** 0.5h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Remove `CenterModel` from `Scene.tsx`. Scene now contains only Camera, Lights,
Stars starfield, children (yarn balls), and OrbitControls.

**Files:**
- `apps/frontend/src/components/game/canvas/Scene.tsx` (MODIFIED)

---

### TASK-045 — Game Page Refactor
**Status:** ✅ DONE | **Est:** 1h | **Branch:** `feat/task-039-to-045-yarn-game-mechanics`

Rewrite `game/page.tsx` to use `?level=N` query param (integer, default 1).
Renders: `GameCanvas > YarnBallGenerator` + three HTML overlays
(TargetColorDisplay, PenaltyStack, GameResultOverlay).
Removes all old knot-graph / API-level / score-submission logic.

**Files:**
- `apps/frontend/src/app/game/page.tsx` (REWRITTEN)
