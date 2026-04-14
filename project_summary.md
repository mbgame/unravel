# Project Summary — Unravel Master

## Overview
**Unravel Master** is a mobile-first 3D arcade puzzle game inspired by the popular "Unravel Master" genre. Players untangle colorful knotted strings/ropes by rotating, dragging, and solving increasingly complex knot puzzles. The game runs in the browser using WebGL (Three.js / React Three Fiber) and is optimized for mobile devices.

## Vision
Create an addictive, visually satisfying 3D puzzle game that runs smoothly on mobile browsers, with level progression, leaderboards, and daily challenges — all powered by a scalable backend.

---

## Core Gameplay Loop
1. Player is presented with a 3D scene full of colourful **yarn balls** floating in space
2. A **target colour** is displayed — the player must collect only balls matching that colour
3. Player **taps** a yarn ball to collect it — ball transforms into a worm-thread that wiggles to the top-right and fades
4. Each ball has **1–10 nested colour layers** — collecting reveals the next inner layer as a new ball
5. Collecting the **wrong colour** fills a penalty slot (5 slots = game over)
6. Collecting **all target-colour layers** across every ball = level complete
7. Player can **drag to rotate** the camera to find hidden balls obscured by others
8. Difficulty scales per level: more colours, more balls, deeper nesting

---

## Key Features

### Frontend (Next.js + R3F)
- 3D yarn ball scene: procedural loxodrome-spiral geometry (wound yarn look)
- Nested layer mechanic: 1–10 colour layers per ball revealed one at a time
- Collect animation: ball squishes → transforms into worm thread → wiggles to corner → fades
- Target colour HUD (top-center), penalty stack HUD (bottom-center, 5 slots)
- Win/lose overlay with Retry and Next Level buttons
- Drag-to-rotate camera (OrbitControls with damping, vertical limits)
- Starfield background (three.js Stars from @react-three/drei)
- Deterministic client-side level generation (seeded RNG + Fibonacci sphere layout)
- Level scaling: Level 1 = 3 colours / 20 balls; Level 10+ = 10 colours / 47+ balls
- Progressive Web App (PWA) support for "Add to Home Screen"

### Backend (NestJS)
- User authentication (JWT + refresh tokens)
- Level definitions stored in DB (knot graph data)
- Score submission & validation
- Global and friends leaderboards
- Daily challenge generation (cron job)
- User progression tracking
- Analytics events logging

### Database (PostgreSQL on Railway)
- Users, sessions, scores, levels, achievements tables
- Soft deletes, created_at/updated_at on all tables

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| 3D Engine | Three.js via React Three Fiber (R3F) |
| R3F Helpers | @react-three/drei, @react-three/rapier |
| State Management | Zustand (sliced stores) |
| Styling | Tailwind CSS + CSS Modules for game UI |
| Animations (UI) | Framer Motion |
| API Client | TanStack Query (React Query) v5 |
| Backend Framework | NestJS 10 |
| Language | TypeScript (strict mode, both FE and BE) |
| Database | PostgreSQL 15 |
| ORM | TypeORM |
| Auth | Passport.js + JWT |
| Validation | class-validator (BE), zod (FE) |
| Testing FE | Vitest + React Testing Library |
| Testing BE | Jest + Supertest |
| Monorepo | Turborepo |

---

## Deployment Architecture

```
[User Mobile Browser]
        │
        ▼
[Vercel — Next.js FE]
   next.js app
   static assets
   PWA manifest
        │
        │ HTTPS API calls
        ▼
[Railway — NestJS BE]        [Railway — PostgreSQL]
   /api/v1/*          ──────►   unravel_master DB
   JWT auth
   Game logic
   Leaderboards
```

### Vercel (Frontend)
- Free Hobby plan — sufficient for this project
- Automatic deployments from `main` branch
- Preview deployments for PRs
- Edge network CDN for assets

### Railway (Backend + Database)
- Free Starter plan: $5 credit/month (enough for lightweight game BE)
- NestJS service auto-deploys from `main` branch
- PostgreSQL add-on on same Railway project
- Environment variables configured in Railway dashboard

---

## Local Development Setup
```
# Root
pnpm install

# Start frontend (http://localhost:3000)
pnpm dev:fe

# Start backend (http://localhost:3001)  
pnpm dev:be

# Start both
pnpm dev

# Run migrations
pnpm migration:run

# Run tests
pnpm test
```

---

## Performance Targets
| Metric | Target |
|--------|--------|
| FPS (mid-range mobile) | 60fps |
| Initial bundle size | < 250KB gzipped |
| 3D canvas draw calls | < 50/frame |
| Time to Interactive (mobile 4G) | < 3s |
| Lighthouse Performance Score | > 85 |
| API response time (p95) | < 200ms |

---

## Phases Overview

| Phase | Name | Duration | Description |
|-------|------|----------|-------------|
| 0 | Setup & Scaffolding | 3 days | Monorepo, CI, base configs |
| 1 | Core Game Engine | 2 weeks | R3F canvas, knot rendering, basic interaction |
| 2 | Game Logic | 2 weeks | Untangle detection, scoring, level system |
| 3 | Backend & Auth | 1.5 weeks | NestJS API, DB, auth |
| 4 | Leaderboards & Progression | 1 week | Scores, levels, achievements |
| 5 | Polish & Mobile Optimization | 1 week | Perf tuning, haptics, PWA |
| 6 | Deployment | 3 days | Vercel + Railway production deploy |
| 7 | Testing & QA | Ongoing | Coverage, device testing |

---

## Constraints
- Zero paid infrastructure in early phases (Railway free tier + Vercel free tier)
- Must work offline after first load (PWA, service worker)
- Must support iOS Safari 15+ and Chrome Android 90+
- No native app — pure web-based
