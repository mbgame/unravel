/**
 * Untangle detection hook — monitors the knot graph state and triggers
 * level completion when the graph becomes fully untangled.
 *
 * Throttled to run at most once per UNTANGLE_CHECK_THROTTLE_MS to avoid
 * expensive crossing detection on every render frame.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useKnotStore } from '../stores/knotStore';
import { useGameStore } from '../stores/gameStore';
import { checkUntangled } from '../lib/game/untangleChecker';
import { calculateScore } from '../lib/game/scoreCalculator';
import { UNTANGLE_CHECK_THROTTLE_MS } from '../constants/game.constants';

/**
 * Subscribes to knotStore graph changes and checks whether the knot
 * is untangled after each move. When untangled:
 * 1. Sets knotStore.isUntangled = true
 * 2. Calculates final score
 * 3. Calls gameStore.completeLevel(finalScore)
 *
 * Must be mounted inside the game scene (while a level is PLAYING).
 */
export function useUntangleDetection(): void {
  const lastCheckRef = useRef<number>(0);

  const setUntangled = useKnotStore((s) => s.setUntangled);
  const isUntangled = useKnotStore((s) => s.isUntangled);

  const completeLevel = useGameStore((s) => s.completeLevel);
  const phase = useGameStore((s) => s.phase);
  const timerMs = useGameStore((s) => s.timerMs);
  const moves = useGameStore((s) => s.moves);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  useEffect(() => {
    if (phase !== 'PLAYING' || isUntangled) return;

    const unsubscribe = useKnotStore.subscribe((state) => {
      if (!state.graph || state.isUntangled) return;

      const now = performance.now();
      if (now - lastCheckRef.current < UNTANGLE_CHECK_THROTTLE_MS) return;
      lastCheckRef.current = now;

      const untangled = checkUntangled(state.graph);
      if (untangled) {
        setUntangled(true);
        const { finalScore } = calculateScore(timerMs, moves, hintsUsed);
        completeLevel(finalScore);
      }
    });

    return unsubscribe;
  }, [phase, isUntangled, setUntangled, completeLevel, timerMs, moves, hintsUsed]);
}
