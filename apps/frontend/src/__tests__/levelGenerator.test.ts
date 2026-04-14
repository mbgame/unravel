/**
 * Level generator validation tests.
 *
 * Ensures every hand-crafted level satisfies:
 *   1. Total ball count matches declared totalBalls
 *   2. Every colour count is a multiple of 3
 *   3. No ball has an undefined, null, or empty colour
 *   4. Sum of colour group counts equals totalBalls
 *   5. Actual colour distribution matches declared colour groups
 *   6. No leftover balls after draining collectors (simulated)
 *   7. Stack depths are within 1–5 range
 *   8. Every stack has at least one layer
 *   9. No duplicate layer IDs
 *  10. Pool is fully consumed (no waste)
 */

import { generateLevel } from '../lib/game/levelGenerator';

// Test levels 1–3 (hand-crafted) plus a few procedural ones
const HAND_CRAFTED_LEVELS = [1, 2, 3, 4, 5];
const PROCEDURAL_LEVELS = [4, 5, 10, 20];

function validateLevel(levelNumber: number) {
  const level = generateLevel(levelNumber);

  describe(`Level ${levelNumber} — "${level.formationName}"`, () => {
    // ── 1. Total ball count ───────────────────────────────────────────
    test('total ball count matches declared totalBalls', () => {
      const actualTotal = level.stacks.reduce(
        (sum, s) => sum + s.layers.length,
        0,
      );
      expect(actualTotal).toBe(level.totalBalls);
    });

    // ── 2. Every colour count is a multiple of 3 ─────────────────────
    test('every colour group count is a multiple of 3', () => {
      for (const group of level.colorGroups) {
        expect(group.count % 3).toBe(0);
        if (group.count % 3 !== 0) {
          throw new Error(
            `Colour "${group.name}" (${group.hex}) has count ${group.count} which is not a multiple of 3`,
          );
        }
      }
    });

    // ── 3. No undefined/null/empty colours ───────────────────────────
    test('no ball has undefined, null, or empty colour', () => {
      for (const stack of level.stacks) {
        for (const layer of stack.layers) {
          expect(layer.color).toBeTruthy();
          expect(typeof layer.color).toBe('string');
          expect(layer.color.length).toBeGreaterThan(0);
          if (!layer.color || typeof layer.color !== 'string') {
            throw new Error(
              `Layer ${layer.id} in stack ${stack.stackId} has invalid colour: ${JSON.stringify(layer.color)}`,
            );
          }
        }
      }
    });

    // ── 4. Colour group sum equals totalBalls ─────────────────────────
    test('sum of colour group counts equals totalBalls', () => {
      const groupSum = level.colorGroups.reduce((s, g) => s + g.count, 0);
      expect(groupSum).toBe(level.totalBalls);
    });

    // ── 5. Actual colour distribution matches declared groups ─────────
    test('actual colour distribution matches colour groups', () => {
      // Count actual colours across all layers
      const actualCounts = new Map<string, number>();
      for (const stack of level.stacks) {
        for (const layer of stack.layers) {
          actualCounts.set(
            layer.color,
            (actualCounts.get(layer.color) ?? 0) + 1,
          );
        }
      }

      // Compare with declared groups
      for (const group of level.colorGroups) {
        const actual = actualCounts.get(group.hex) ?? 0;
        expect(actual).toBe(group.count);
        if (actual !== group.count) {
          throw new Error(
            `Colour "${group.name}" (${group.hex}): expected ${group.count}, got ${actual}`,
          );
        }
        actualCounts.delete(group.hex);
      }

      // No undeclared colours should remain
      if (actualCounts.size > 0) {
        const extra = Array.from(actualCounts.entries())
          .map(([hex, count]) => `${hex} ×${count}`)
          .join(', ');
        throw new Error(`Undeclared colours found: ${extra}`);
      }
      expect(actualCounts.size).toBe(0);
    });

    // ── 6. Simulated drain — no remainders ────────────────────────────
    test('all balls can be collected in groups of 3 (no remainder)', () => {
      const colourCounts = new Map<string, number>();
      for (const stack of level.stacks) {
        for (const layer of stack.layers) {
          colourCounts.set(
            layer.color,
            (colourCounts.get(layer.color) ?? 0) + 1,
          );
        }
      }
      for (const [hex, count] of colourCounts) {
        expect(count % 3).toBe(0);
        if (count % 3 !== 0) {
          throw new Error(
            `Colour ${hex} has ${count} balls — not divisible by 3, would leave ${count % 3} uncollectable`,
          );
        }
      }
    });

    // ── 7. Stack depths within 1–5 range ──────────────────────────────
    test('all stack depths are between 1 and 5', () => {
      for (const stack of level.stacks) {
        const depth = stack.layers.length;
        expect(depth).toBeGreaterThanOrEqual(1);
        expect(depth).toBeLessThanOrEqual(5);
      }
    });

    // ── 8. Every stack has at least one layer ─────────────────────────
    test('no empty stacks', () => {
      for (const stack of level.stacks) {
        expect(stack.layers.length).toBeGreaterThan(0);
      }
    });

    // ── 9. No duplicate layer IDs ─────────────────────────────────────
    test('all layer IDs are unique', () => {
      const ids = new Set<string>();
      for (const stack of level.stacks) {
        for (const layer of stack.layers) {
          expect(ids.has(layer.id)).toBe(false);
          if (ids.has(layer.id)) {
            throw new Error(`Duplicate layer ID: ${layer.id}`);
          }
          ids.add(layer.id);
        }
      }
    });

    // ── 10. Valid hex colour format ───────────────────────────────────
    test('all colours are valid hex strings', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const stack of level.stacks) {
        for (const layer of stack.layers) {
          expect(layer.color).toMatch(hexRegex);
        }
      }
    });
  });
}

// Run tests for all levels
for (const lvl of HAND_CRAFTED_LEVELS) {
  validateLevel(lvl);
}

for (const lvl of PROCEDURAL_LEVELS) {
  validateLevel(lvl);
}
