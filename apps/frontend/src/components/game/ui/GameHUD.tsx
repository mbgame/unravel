/**
 * GameHUD — HTML overlay that sits above the R3F canvas.
 * Shows the live timer, move counter, hint button, and pause button.
 * Reads from gameStore; does NOT own any game logic.
 */

'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import { useUiStore } from '../../../stores/uiStore';
import { useGameTimer } from '../../../hooks/useGameTimer';

/** Maximum hints a player can use per level. */
const MAX_HINTS = 3;

/**
 * Formats milliseconds into `MM:SS` display string.
 *
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted string, e.g. `"01:24"`
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * In-game heads-up display overlay.
 * Rendered as a sibling of the canvas, positioned absolutely.
 *
 * @example
 * ```tsx
 * <main style={{ position: 'relative' }}>
 *   <GameCanvas />
 *   <GameHUD />
 * </main>
 * ```
 */
export const GameHUD = React.memo(function GameHUD() {
  // Drive the timer tick
  useGameTimer();

  const timerMs = useGameStore((s) => s.timerMs);
  const moves = useGameStore((s) => s.moves);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const useHint = useGameStore((s) => s.useHint);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const openModal = useUiStore((s) => s.openModal);
  const setIsPaused = useUiStore((s) => s.setIsPaused);

  const hintsRemaining = MAX_HINTS - hintsUsed;

  const handlePause = useCallback(() => {
    pauseGame();
    setIsPaused(true);
    openModal('pause');
  }, [pauseGame, setIsPaused, openModal]);

  const handleHint = useCallback(() => {
    if (hintsRemaining > 0) useHint();
  }, [hintsRemaining, useHint]);

  return (
    <motion.div
      aria-label="Game HUD"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Left — Timer + Moves */}
      <div className="flex flex-col gap-1">
        <div
          aria-label="Elapsed time"
          className="rounded-lg bg-black/50 px-3 py-1 font-mono text-xl font-bold text-white"
        >
          {formatTime(timerMs)}
        </div>
        <div
          aria-label={`Moves: ${moves}`}
          className="rounded-lg bg-black/40 px-3 py-1 text-sm text-white/80"
        >
          {moves} moves
        </div>
      </div>

      {/* Right — Hint + Pause (pointer-events re-enabled for buttons) */}
      <div className="pointer-events-auto flex gap-2">
        <button
          aria-label={`Use hint (${hintsRemaining} remaining)`}
          disabled={hintsRemaining === 0}
          onClick={handleHint}
          className={[
            'flex h-12 w-12 items-center justify-center rounded-xl',
            'bg-black/50 text-2xl transition active:scale-95',
            hintsRemaining === 0 ? 'opacity-40' : 'hover:bg-white/20',
          ].join(' ')}
        >
          💡
          {hintsRemaining > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black"
            >
              {hintsRemaining}
            </span>
          )}
        </button>

        <button
          aria-label="Pause game"
          onClick={handlePause}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/50 text-2xl transition hover:bg-white/20 active:scale-95"
        >
          ⏸
        </button>
      </div>
    </motion.div>
  );
});
