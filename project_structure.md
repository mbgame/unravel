# Project Structure

## Monorepo Root
```
unravel-master/
├── .github/
│   └── workflows/
│       ├── fe-deploy.yml          # Vercel deployment CI
│       └── be-deploy.yml          # Railway deployment CI
├── apps/
│   ├── frontend/                  # Next.js application
│   └── backend/                   # NestJS application
├── packages/
│   └── shared-types/              # Shared TypeScript types
│       ├── src/
│       │   ├── game.types.ts
│       │   ├── api.types.ts
│       │   ├── user.types.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/                          # All MD documentation files
├── turbo.json                     # Turborepo config
├── pnpm-workspace.yaml
├── package.json                   # Root package.json
├── .gitignore
└── README.md
```

---

## Frontend Structure (`apps/frontend/`)
```
frontend/
├── public/
│   ├── assets/
│   │   ├── models/                # .glb / .gltf 3D models
│   │   │   ├── knot_basic.glb
│   │   │   ├── bead.glb
│   │   │   └── rope_segment.glb
│   │   ├── textures/              # KTX2 compressed textures
│   │   │   ├── rope_diffuse.ktx2
│   │   │   └── background.ktx2
│   │   ├── sounds/
│   │   │   ├── untangle.mp3
│   │   │   ├── complete.mp3
│   │   │   └── background.mp3
│   │   └── fonts/
│   │       └── game-font.woff2
│   ├── icons/                     # PWA icons
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Main menu / landing
│   │   ├── game/
│   │   │   ├── page.tsx           # Game canvas page
│   │   │   └── loading.tsx
│   │   ├── levels/
│   │   │   └── page.tsx           # Level select
│   │   ├── leaderboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/                   # Next.js route handlers (proxy)
│   │       └── [...proxy]/route.ts
│   ├── components/
│   │   ├── game/                  # R3F game components
│   │   │   ├── canvas/
│   │   │   │   ├── GameCanvas.tsx        # Root R3F Canvas (localClippingEnabled)
│   │   │   │   ├── Scene.tsx             # Scene + OrbitControls + zoom + CollectorCelebration
│   │   │   │   ├── Camera.tsx            # Perspective camera setup
│   │   │   │   ├── Lights.tsx            # Debug-driven lighting (reads from DebugPanel store)
│   │   │   │   └── CenterModel.tsx       # Optional center model
│   │   │   ├── yarn/
│   │   │   │   ├── YarnBall.tsx          # Collectible yarn piece (unravel/gather/fly animation)
│   │   │   │   └── YarnBallGenerator.tsx # Spawns yarn stacks, handles tap/collect mechanics
│   │   │   ├── effects/
│   │   │   │   └── CollectorCelebration.tsx # Shader burst when collector fills 3/3
│   │   │   ├── debug/
│   │   │   │   └── DebugPanel.tsx        # Leva GUI for animation, lighting, colors
│   │   │   └── ui/
│   │   │       ├── GameHUD.tsx           # Score, timer, moves
│   │   │       ├── TargetColorDisplay.tsx # Top-center level progress HUD
│   │   │       ├── ColorCollectors.tsx   # Bottom left/right colour collector panels
│   │   │       ├── BufferStack.tsx       # Wrong-colour buffer display
│   │   │       ├── GameResultOverlay.tsx # Win/lose overlay
│   │   │       ├── ZoomSlider.tsx        # Vertical zoom slider (left edge)
│   │   │       ├── PauseMenu.tsx
│   │   │       ├── LevelComplete.tsx
│   │   │       └── SettingsPanel.tsx
│   │   ├── ui/                    # Generic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Toast.tsx
│   │   ├── menu/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── LevelCard.tsx
│   │   │   └── LeaderboardRow.tsx
│   │   └── layout/
│   │       ├── MobileLayout.tsx
│   │       └── SafeArea.tsx
│   ├── stores/                    # Zustand stores (sliced)
│   │   ├── gameStore.ts           # Game state (level, score, phase)
│   │   ├── knotStore.ts           # Knot graph state
│   │   ├── uiStore.ts             # UI state (modal, menu)
│   │   ├── settingsStore.ts       # User settings (quality, sound)
│   │   ├── authStore.ts           # Auth state (user, token)
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useGameLoop.ts         # Main game loop hook
│   │   ├── useKnotInteraction.ts  # Touch/drag interaction
│   │   ├── useUntangleDetection.ts# Knot untangle algorithm
│   │   ├── useHaptics.ts          # Vibration API wrapper
│   │   ├── useAudio.ts            # Web Audio API
│   │   ├── useAuth.ts             # Auth hook
│   │   └── usePerformance.ts      # FPS monitoring, quality tier
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios/fetch instance
│   │   │   ├── auth.api.ts
│   │   │   ├── game.api.ts
│   │   │   ├── leaderboard.api.ts
│   │   │   └── level.api.ts
│   │   ├── game/
│   │   │   ├── levelGenerator.ts  # Deterministic level generation (house/tree/procedural)
│   │   │   ├── shapeFormations.ts # Formation positions for procedural levels
│   │   │   ├── scoreCalculator.ts # Score formula
│   │   │   └── levelParser.ts     # Level JSON → game state
│   │   ├── three/
│   │   │   ├── disposer.ts        # Three.js resource disposal
│   │   │   ├── yarnBallGeometry.ts    # Yarn ball geometry (sphere/cone/cylinder/box/torus)
│   │   │   ├── yarnHouseGeometry.ts   # House part geometry (walls/roof/floor/gable/etc.)
│   │   │   ├── yarnTreeGeometry.ts    # Tree part geometry (trunk/branch/leaf/fruit/etc.)
│   │   │   ├── yarnShaders.ts         # Fresnel glow material
│   │   │   ├── yarnTexture.ts         # Texture URL constants (string.png + 6 knit textures)
│   │   │   └── qualityPresets.ts  # Low/Med/High render presets
│   │   └── utils/
│   │       ├── cn.ts              # className utility
│   │       ├── format.ts          # Time, score formatting
│   │       └── storage.ts         # LocalStorage helpers
│   ├── constants/
│   │   ├── game.constants.ts
│   │   ├── api.constants.ts
│   │   └── theme.constants.ts
│   ├── types/
│   │   └── index.ts               # FE-specific types
│   └── middleware.ts              # Next.js middleware (auth guard)
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Backend Structure (`apps/backend/`)
```
backend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts              # Root module
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── local-auth.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   ├── levels/
│   │   │   ├── levels.module.ts
│   │   │   ├── levels.controller.ts
│   │   │   ├── levels.service.ts
│   │   │   ├── entities/
│   │   │   │   └── level.entity.ts
│   │   │   └── dto/
│   │   │       └── create-level.dto.ts
│   │   ├── scores/
│   │   │   ├── scores.module.ts
│   │   │   ├── scores.controller.ts
│   │   │   ├── scores.service.ts
│   │   │   ├── entities/
│   │   │   │   └── score.entity.ts
│   │   │   └── dto/
│   │   │       └── submit-score.dto.ts
│   │   ├── leaderboard/
│   │   │   ├── leaderboard.module.ts
│   │   │   ├── leaderboard.controller.ts
│   │   │   └── leaderboard.service.ts
│   │   ├── achievements/
│   │   │   ├── achievements.module.ts
│   │   │   ├── achievements.service.ts
│   │   │   └── entities/
│   │   │       ├── achievement.entity.ts
│   │   │       └── user-achievement.entity.ts
│   │   └── daily-challenge/
│   │       ├── daily-challenge.module.ts
│   │       ├── daily-challenge.controller.ts
│   │       ├── daily-challenge.service.ts
│   │       └── entities/
│   │           └── daily-challenge.entity.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── guards/
│   │   │   └── throttle.guard.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   └── database/
│       └── migrations/
│           ├── 001_create_users.ts
│           ├── 002_create_levels.ts
│           ├── 003_create_scores.ts
│           ├── 004_create_achievements.ts
│           └── 005_create_daily_challenges.ts
├── test/
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   └── jest-e2e.json
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Shared Types (`packages/shared-types/`)
```
shared-types/
├── src/
│   ├── game.types.ts      # KnotGraph, Level, Score, GamePhase
│   ├── api.types.ts       # API request/response shapes
│   ├── user.types.ts      # User, UserProfile
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Key Config Files

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
