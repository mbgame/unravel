# Unravel Master — Game Rules

## Concept

Each level presents the player with a scene full of colourful **yarn balls** floating in 3D space. Every yarn ball is made up of **1 to 10 nested layers**, each with its own colour — like an onion made of yarn. Only the outermost layer's colour is visible until that layer is collected.

The player's goal is to collect every layer that matches the **target colour** shown at the top of the screen, while avoiding wrong-colour taps that fill up the **penalty stack**.

---

## Win Condition

Collect **all layers** across all balls whose colour matches the level's target colour.
When `collected_correct = total_target_layers` → **YOU WIN**.

## Lose Condition

The penalty stack has **5 slots**. Each wrong-colour collection fills one slot.
When all 5 slots are filled → **YOU LOSE**.

---

## Gameplay Step-by-Step

1. **Observe** — A target colour is displayed at the top. Scan the scene for yarn balls matching that colour.
2. **Tap** a yarn ball:
   - **Correct colour** (outer layer = target colour) → the ball transforms into a worm thread and flies away. Your correct-collect count increments. The inner layer (if any) becomes the new outer layer and appears as a fresh ball in the same spot.
   - **Wrong colour** (outer layer ≠ target colour) → the ball still animates away, but its colour is added to the **penalty stack**. Five wrong taps = game over.
3. **Inner reveals** — After collecting a correct layer, a new ball appears at the same position showing the next inner colour. That inner colour may or may not match the target — treat it the same way (collect only if it matches the target).
4. **Progress** — The HUD shows `🪙 collected / total` so the player always knows how many target layers remain.

---

## Penalty Stack

- Located at the bottom of the screen.
- Contains **5 slots** displayed as coloured pill shapes.
- Each wrong-colour collection fills the next empty slot with that colour.
- Slots are not cleared during a level — there is no way to recover lost slots.

---

## Level Difficulty Scaling

| Level | # Colours | # Balls | Max Layers/Ball |
|-------|-----------|---------|-----------------|
| 1     | 3         | 20      | 2               |
| 2     | 4         | 23      | 3               |
| 3     | 5         | 26      | 4               |
| 4     | 5         | 29      | 5               |
| 5     | 6         | 32      | 6               |
| 6     | 7         | 35      | 7               |
| 7     | 8         | 38      | 8               |
| 8     | 9         | 41      | 9               |
| 9     | 10        | 44      | 10              |
| 10+   | 10        | 47+     | 10              |

Difficulty increases because:
- More colours → target colour is rarer → more distractors per ball.
- More layers → more inner-reveal surprises → harder to predict what's inside.
- More balls → scene is denser → easier to mis-tap.

---

## Yarn Ball Colour Palette

| Colour | Hex     |
|--------|---------|
| Red    | #E63946 |
| Orange | #F4A261 |
| Teal   | #2A9D8F |
| Purple | #8338EC |
| Blue   | #3A86FF |
| Amber  | #FB8500 |
| Mint   | #06D6A0 |
| Pink   | #FF006E |
| Yellow | #FFBE0B |
| Green  | #8AC926 |

---

## Animation — Collect Sequence

1. **Idle** — ball floats gently and rotates.
2. **Transform (0.2 s)** — ball squishes with a non-uniform scale (flat on Y, expand on X/Z) while fading out.
3. **Worm (0.9 s)** — the ball becomes a sinuous yarn thread that wiggles and crawls toward the top-right corner of the screen, like a worm moving.
4. **Fading (0.38 s)** — the thread fades out and shrinks as it reaches the corner.
5. **Reveal** — if the collected ball had more layers, a new ball immediately appears at the original position showing the next inner colour.

---

## Camera Controls

- **Drag / swipe** anywhere on the screen to rotate the camera around the scene.
- Zoom and pan are disabled to keep the experience focused.
- Use camera rotation to find hidden balls obscured by others.
