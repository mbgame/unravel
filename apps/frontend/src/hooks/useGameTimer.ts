/**
 * useGameTimer — drives the in-game timer via requestAnimationFrame.
 * Respects the game's pause state and updates `timerMs` in gameStore.
 *
 * @remarks
 * Uses RAF instead of `setInterval` to stay accurate when the tab
 * is in the foreground and to automatically pause when backgrounded.
 * Call this hook once inside the game page or HUD component.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

/**
 * Attaches a requestAnimationFrame loop that ticks the game timer
 * while the game phase is `'PLAYING'`.
 *
 * @example
 * ```tsx
 * // Inside GameHUD or the game page
 * useGameTimer();
 * ```
 */
export function useGameTimer(): void {
  const tickTimer = useGameStore((s) => s.tickTimer);
  const phase = useGameStore((s) => s.phase);

  /** Tracks the timestamp of the previous RAF frame. */
  const lastTimestampRef = useRef<number | null>(null);
  /** Stores the current RAF handle so we can cancel on cleanup. */
  const rafHandleRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'PLAYING') {
      // If not playing, cancel any running loop and reset last timestamp.
      cancelAnimationFrame(rafHandleRef.current);
      lastTimestampRef.current = null;
      return;
    }

    /** RAF callback — calculates delta and ticks the store. */
    const tick = (now: number): void => {
      if (lastTimestampRef.current !== null) {
        const deltaMs = now - lastTimestampRef.current;
        tickTimer(deltaMs);
      }
      lastTimestampRef.current = now;
      rafHandleRef.current = requestAnimationFrame(tick);
    };

    rafHandleRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafHandleRef.current);
      lastTimestampRef.current = null;
    };
  }, [phase, tickTimer]);
}
