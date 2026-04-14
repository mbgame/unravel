# Unravel — 3D Yarn Puzzle Game

## Overview

A mobile-first 3D puzzle game where players collect yarn pieces from hand-crafted structures (house, tree, etc.) by tapping them. Each piece unravels with a knitting animation, gathers into a yarn ball, and flies to a colour collector.

---

## Documentation Index

| File | Purpose |
|------|---------|
| `ai_rules.md` | Coding rules & constraints for AI implementation |
| `architecture.md` | System design, stores, scene graph, interaction flow |
| `project_structure.md` | Folder/file structure for all apps |
| `tech_specs.md` | Detailed code configs, algorithms, types |
| `game_design.md` | Game mechanics, levels, visual design, audio |
| `user_stories.md` | User-facing requirements and acceptance criteria |
| `deployment.md` | Vercel + Railway deployment guide |

---

## Tech Stack

```
Frontend:  Next.js 14 + React Three Fiber + Three.js + Zustand + Leva (debug)
Backend:   NestJS + TypeORM + PostgreSQL
Deploy FE: Vercel
Deploy BE: Railway
Testing:   Vitest (FE) + Jest (BE)
Monorepo:  Turborepo + pnpm workspaces
```

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

### Collect Animation
1. **Unravel** (0.85s) — Zigzag thread traces rows top→bottom with clipping plane
2. **Gather** (0.6s) — Thread morphs into yarn ball (loxodrome winding)
3. **Fly** (0.35s) — Colour disc arcs to collector or buffer

### Controls
- **Rotate**: Drag to orbit (horizontal + limited vertical with damping)
- **Zoom**: Vertical slider on left edge
- **Tap**: Collect yarn pieces

### Textures
- 6 knit fabric textures (knit1–knit6.jpg) randomly assigned per object
- string.png for thread/unravel animations

### Debug Panel (dev only)
Leva GUI with real-time controls for:
- Animation timings (unravel, travel, fly, spawn durations)
- Thread radius, spindle turns, arc height, row height
- Lighting (ambient, key, fill, rim intensities + positions)
- House colours (blue, green, orange) with live preview

---

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+
git clone <repo>
cd unravel
pnpm install
pnpm dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Key Architecture

### Stores (Zustand)
- `gameStore` — Phase, level, score, timer, moves
- `yarnGameStore` — Yarn game phase, collectors, buffer, celebration state
- `uiStore` — Modals, toasts, zoom level
- `debugStore` (via Leva) — Animation/lighting/colour parameters

### Scene Graph (R3F)
```
Canvas → Scene → Camera + Lights + OrbitControls + CollectorCelebration
                → YarnBallGenerator → YarnBall × N (with unravel/gather/fly phases)
HTML overlays: BackButton, TargetColorDisplay, ZoomSlider, ColorCollectors, BufferStack
```

### Geometry Files
- `yarnHouseGeometry.ts` — House parts (walls, roof, floor, gable, chimney, door, window)
- `yarnTreeGeometry.ts` — Tree parts (trunk, branches, leaves, fruits, roots, crown)
- `yarnBallGeometry.ts` — Standard yarn ball shapes (sphere, cone, cylinder, box, torus)
