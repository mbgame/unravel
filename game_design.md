# Game Design Document (GDD)

## Game Overview
- **Title**: Unravel Master
- **Genre**: Puzzle / Casual Arcade
- **Platform**: Mobile Browser (iOS Safari, Chrome Android), Desktop Browser
- **Target Audience**: Ages 12+, casual puzzle game fans
- **Core Emotion**: Satisfying, relaxing, with moments of "aha!" delight

---

## Core Gameplay

### The Objective
The player sees a 3D yarn structure (house, tree, etc.) made of collectible yarn pieces. Each piece is wrapped in knitted yarn texture. The goal is to collect all yarn pieces by tapping them — matching their colour to the active colour collector.

### Player Actions
1. **Rotate** — Drag to orbit the 3D scene (horizontal + limited vertical with damping)
2. **Zoom** — Use the vertical slider on the left edge (or pinch on mobile)
3. **Tap** — Tap a yarn piece to collect it (triggers unravel animation)
4. **Collect** — Pieces fly to the matching colour collector (left/right) or buffer stack (wrong colour)

### Collect Animation Sequence
1. **Unravel** — A thread zigzags top→bottom pulling apart knit rows (clipping plane follows)
2. **Gather** — Thread morphs into a yarn ball shape (loxodrome winding + spin)
3. **Fly** — A colour disc arcs to the collector or buffer stack

### Win Condition
All yarn pieces collected. Each colour collector holds 3 balls; when full it cycles to the next colour.

### Lose Condition
Buffer stack reaches 5 wrong-colour balls → game over.

### Collector Celebration
When a collector fills 3/3, a shader-based burst effect plays (expanding ring, radiating rays, sparkle particles in the collector's colour).

---

## Level Design

### Hand-Crafted Levels (1–2)

| Level | Theme | Stacks | Balls | Colours | Layers |
|-------|-------|--------|-------|---------|--------|
| 1 | Yarn House | 15 | 60 | 5 (Blue ×18, Green ×15, Orange ×12, Red ×9, Purple ×6) | 3–5 per stack |
| 2 | Yarn Tree | 16 | 60 | 5 (Brown ×18, LGreen ×12, DGreen ×12, Red ×9, Yellow ×9) | 3–5 per stack |

### Level 1 — Yarn House
- 4 walls (front/back/left/right), 2 floor halves, 2 roof slopes, 2 gables, chimney, door, 2 square windows
- Each piece has 3–5 hidden layers of different colours underneath
- All colour counts are multiples of 3

### Level 2 — Yarn Tree
- 2 trunk segments (lower/upper), 4 branches (left/right/back-left/back-right), 4 leaf clusters, 3 fruits, 2 roots, crown top
- Each piece has 3–5 hidden layers of different colours underneath
- All colour counts are multiples of 3

### Colour Constraint
Every level must have all colour counts as exact multiples of 3 (since each collector run is 3 balls).

### Procedural Levels (3+)
- Seeded RNG generates formation positions, colour assignments, stack depths
- 2–10 colours available depending on level
- Stack depth scales with level (1 at easy, up to 3 at hard)

### Texture Variety
6 knit textures (knit1.jpg–knit6.jpg) are randomly assigned per yarn object for visual variety.

---

## Scoring System

### Score Formula
```
Base Score = 1000 × difficulty_tier

Time Bonus:
  if time < par_time: +(par_time - time) / 1000 × 10 (max +200)
  if time > par_time: -(time - par_time) / 1000 × 5 (uncapped)

Move Penalty:
  if moves > par_moves: -(moves - par_moves) × 5

Hint Penalty: -100 × hints_used

Final Score = max(0, base + time_bonus - move_penalty - hint_penalty)
```

### Star Rating
| Stars | Condition |
|-------|-----------|
| ⭐⭐⭐ | Score ≥ 90% of perfect score |
| ⭐⭐ | Score ≥ 60% of perfect score |
| ⭐ | Level completed (any score) |

### Perfect Score Conditions
- Complete within par time
- Use par moves or fewer
- Use 0 hints

---

## Progression System

### Player Level
- Players gain XP for completing levels
- XP = final score / 10
- Player level unlocks cosmetics (string colors, backgrounds)

### Unlockable Content
1. **String Themes**: Default → Neon → Pastel → Metallic → Rainbow
2. **Background Themes**: Dark Space (default) → Ocean → Forest → Sunset
3. **Completion Celebrations**: Confetti → Stars → Fireworks → Bubbles

### Achievement System

| ID | Name | Trigger |
|----|------|---------|
| A01 | First Untangle | Complete first level |
| A02 | Speed Demon | Complete any level in under 30 seconds |
| A03 | Perfectionist | 3-star any Medium+ level |
| A04 | No Hints Needed | Complete 10 levels without any hints |
| A05 | Daily Devotee | Complete daily challenge 7 days in a row |
| A06 | Centurion | Complete 100 levels |
| A07 | Untangle Master | 3-star all Expert levels |
| A08 | Marathoner | Spend 10 hours playing |
| A09 | Social Climber | Reach top 10 on any leaderboard |
| A10 | Streak King | 30-day daily challenge streak |

---

## Visual Design

### Art Direction
- **Style**: Cozy, handmade yarn/knitted aesthetic
- **Color Palette**: Light pastel gradient background with soft saturated yarn colours
- **Lighting**: Strong ambient (1.6) + directional key light + warm fill + cool rim (debug-adjustable via Leva)
- **Camera**: Perspective FOV 60, Z=10, orbitable with smooth damping
- **Textures**: 6 knit fabric textures (knit1–knit6.jpg), string.png for thread animations

### Yarn Piece Visual Design
```
Material: MeshStandardMaterial with knit texture + colour tint
Core: Darkened colour (×0.48 multiplier)
Surface: Emissive glow (0.38 intensity) for vibrant yarn look
Roughness: 0.78 (custom parts) / 0.62 (standard balls)
Fresnel rim glow on standard yarn balls (disabled for house/tree parts)

House colours: Light Blue #7EC8E3, Light Green #A8D5A2, Light Orange #F4B183, 
              Light Red #E88B8B, Light Purple #C4A8E0
Tree colours:  Brown #C9A870, Light Green #8FBF7A, Dark Green #5A9E4B,
              Red #E88B8B, Yellow #F0D080
```

### UI Visual Design
- **Font**: Rounded, friendly (e.g., Nunito, Poppins)
- **Buttons**: Large (min 48px), rounded corners, subtle shadow
- **Colors**: Match background — dark with accent highlights
- **HUD**: Minimal, non-intrusive, corners only
- **Animations**: Spring-based (framer-motion), never linear easing

### Particle Effects
- **Untangle move**: Small burst of 5-10 particles in string color
- **Level complete**: Larger burst of 50-100 particles, multi-color confetti
- **Invalid move**: Brief red flash + camera shake (subtle)

---

## Audio Design

### Sound Effects
| Sound | Trigger | Description |
|-------|---------|-------------|
| `untangle.mp3` | Valid move | Soft "pop" or "twang" |
| `invalid.mp3` | Invalid move | Soft "thud" |
| `complete.mp3` | Level complete | Ascending jingle (1-2 seconds) |
| `select.mp3` | String selected | Soft click |
| `hint.mp3` | Hint used | Soft chime |
| `star.mp3` | Star earned | Short sparkle sound |

### Music
- Ambient, relaxing background music
- Low-fi / lo-key electronic
- Loops seamlessly
- Fades out during level complete animation, different track for menu

### Haptics (Vibration API)
| Event | Pattern | Description |
|-------|---------|-------------|
| Valid move | `[20]` | Short single pulse |
| Invalid move | `[20, 50, 20]` | Double short pulse |
| Level complete | `[100, 50, 100]` | Two longer pulses |
| String select | `[10]` | Very brief |

---

## Accessibility

### Motor Accessibility
- Large touch targets (48px minimum)
- No time-sensitive actions required (timer affects score, not completion)
- Undo last move option (doesn't consume a hint)

### Visual Accessibility
- High contrast mode option
- String thickness option (thin/medium/thick)
- Color blind friendly palette option:
  - Replace coral/teal with blue/orange (tritanopia safe)

### Cognitive Accessibility
- Tutorial with hand-holding for first 3 levels
- Clear visual feedback for every action
- No penalty for restarting

---

## Monetization (Future — Not in v1)

> V1 is completely free with no ads or IAP.
> Future versions may consider:
- Cosmetic-only IAP (string themes, backgrounds)
- No pay-to-win mechanics
- No ads in gameplay

---

## Platform-Specific Notes

### iOS Safari
- Must handle `touchstart` with `{ passive: false }` to prevent scroll
- No Vibration API support → graceful degradation
- PWA: limited — no push notifications, no background sync
- Web Audio requires user gesture to unlock AudioContext

### Chrome Android
- Full Vibration API support
- Full PWA support including background sync
- WebGL2 available on modern devices

### Desktop (Secondary)
- Mouse events (no touch) — same code path via Pointer Events API
- Higher resolution rendering (up to 2x dpr)
- Keyboard shortcuts: Space = pause, R = restart, H = hint
