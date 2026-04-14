# AI Rules & Coding Standards

## Project Identity
- **Project**: Unravel — 3D Yarn Puzzle Game
- **Stack**: Next.js 14 (App Router) + React Three Fiber + Three.js + Zustand + Leva (FE) | NestJS + PostgreSQL (BE)
- **Deployment**: Vercel (FE) · Railway (BE + DB)
- **Priority**: Mobile performance, smooth 60fps on mid-range devices
- **Game Type**: Tap-to-collect yarn pieces from 3D structures (house, tree, etc.) with knitting unravel animations

---

## Core Principles

### 1. Performance First (Mobile Critical)
- Every component must be written with mobile performance as the #1 concern
- Target 60fps on devices with Snapdragon 660 / Mali-G72 or equivalent
- Use `React.memo`, `useMemo`, `useCallback` aggressively
- Avoid re-renders at all costs — profile before and after every feature
- Three.js: dispose geometries, materials, textures when unmounted
- Use `instancedMesh` for repeated objects (strings, knots, beads)
- Limit draw calls to < 50 per frame
- Avoid shadows unless baked — use fake ambient occlusion instead
- Use compressed textures (KTX2/Basis) for all assets
- LOD (Level of Detail) for complex meshes

### 2. Code Structure Rules
- One component = one responsibility
- Max file length: 300 lines. Split if longer
- No `any` in TypeScript — always type explicitly
- Zustand stores must be sliced (one slice per domain)
- API calls only from dedicated service files — never inline in components
- Environment variables must be validated at startup (use `zod`)
- No magic numbers — use named constants in a `constants/` file

### 3. R3F / Three.js Rules
- Always use `useFrame` with delta time — never hardcode animation speed
- Use `@react-three/drei` helpers before writing custom implementations
- Dispose pattern mandatory:
  ```tsx
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [])
  ```
- `Suspense` wrapping mandatory for all R3F canvas content
- Use `<Stats />` in dev mode only (gated by `NODE_ENV`)
- Physics: use `@react-three/rapier` — keep physics bodies minimal
- Camera: fixed orthographic or perspective with controlled FOV for mobile

### 4. NestJS / Backend Rules
- All endpoints must be versioned: `/api/v1/...`
- DTOs with `class-validator` on every controller input
- No business logic in controllers — use services
- All DB access through TypeORM repositories — no raw queries unless justified
- Errors must return consistent format: `{ statusCode, message, error }`
- JWT authentication for protected routes
- Rate limiting on all public endpoints
- Migrations for every DB schema change — never `synchronize: true` in production

### 5. Git & Task Rules
- One task = one feature branch = one PR
- Branch naming: `feat/task-{id}-short-description`
- Commit format: `feat(scope): description` / `fix(scope): description`
- Never commit `.env` files
- Every task must include unit tests (Jest) and integration test if BE endpoint

### 6. File & Folder Discipline
- Follow the project structure defined in `project_structure.md` exactly
- Do not create files outside defined directories without updating structure doc
- Assets go in `public/assets/` with subfolders: `models/`, `textures/`, `sounds/`, `fonts/`
- Shared types live in `packages/shared-types/` (monorepo)

### 7. Level & Geometry Rules
- Every hand-crafted level total ball count must be exactly divisible into colour groups of 3
- All colour counts must be multiples of 3 (each collector run = 3 balls)
- New 3D structures require: geometry file (e.g. `yarnTreeGeometry.ts`), part type union, factory function, level generator function
- Geometry parts return `{ coreGeometry, spiralGeometries[], dispose() }` — spirals are empty for solid parts (yarn look comes from texture)
- Level generator uses `houseLayers()` helper + shuffled inner pool for deterministic colour assignment
- `isCustomPart` flag in YarnBall controls: no fresnel, no bobbing, yarn texture, higher roughness
- 6 knit textures (knit1–knit6.jpg) assigned per-stack via hash for visual variety
- Debug panel (Leva) must expose all tuneable values for new levels

### 7. Environment & Config
- FE env vars prefixed with `NEXT_PUBLIC_` only when truly needed client-side
- BE env vars validated with `ConfigModule` + `Joi` schema
- Local dev: `.env.local` (FE) and `.env` (BE) — both gitignored
- Staging/prod: set via Railway environment variables and Vercel project settings

### 8. Accessibility & UX
- Touch targets minimum 48×48px
- All interactive elements must have `aria-label`
- Support both portrait and landscape orientations
- Handle slow connections gracefully — show loading states

### 9. Security
- Never expose secrets client-side
- Sanitize all user inputs (BE)
- CORS configured to allow only Vercel domain + localhost in dev
- Helmet.js on NestJS

### 10. Testing Standards
- FE: Vitest + React Testing Library for unit tests
- BE: Jest + Supertest for e2e
- Minimum coverage: 70% for service layer
- R3F components: snapshot tests + interaction tests with `@testing-library/user-event`

---

## What AI Must NEVER Do
- ❌ Use `synchronize: true` in TypeORM production config
- ❌ Hardcode API URLs — always use env vars
- ❌ Skip disposal of Three.js objects
- ❌ Write business logic in React components
- ❌ Use `console.log` in production code (use a logger service)
- ❌ Skip mobile testing — always consider touch input
- ❌ Create god-components with 500+ lines
- ❌ Use `any` type in TypeScript
- ❌ Deploy without running migrations
- ❌ Skip error boundaries in R3F canvas

---

## What AI Must ALWAYS Do
- ✅ Add JSDoc to exported functions and components
- ✅ Use `zod` for runtime validation on FE API responses
- ✅ Add loading and error states for every async operation
- ✅ Test on mobile viewport (375×667) in browser devtools
- ✅ Use `React.Suspense` for code splitting
- ✅ Memoize expensive calculations
- ✅ Follow the existing naming conventions in the codebase
- ✅ Update the relevant task file status after completing a task
