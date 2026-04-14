/**
 * LevelComplete — modal shown when the player untangles the knot.
 * Displays animated score reveal, star rating, score breakdown,
 * and navigation buttons (Next Level / Replay / Menu).
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../../stores/gameStore';
import { useUiStore } from '../../../stores/uiStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  BASE_SCORE,
  TIME_PENALTY_PER_SECOND,
  MOVE_PENALTY_PER_MOVE,
  HINT_PENALTY_PER_HINT,
} from '../../../constants/game.constants';

/** Duration of the score count-up animation in ms. */
const COUNT_UP_DURATION_MS = 1200;
/** Frames per second for the count-up rAF loop. */
const COUNT_UP_FPS = 60;

/**
 * Runs a numeric count-up animation from 0 to `target`.
 *
 * @param target - Final score value
 * @param durationMs - Animation duration in milliseconds
 * @param onUpdate - Called each frame with the current animated value
 * @returns Cleanup function to cancel the animation
 */
function runCountUp(
  target: number,
  durationMs: number,
  onUpdate: (value: number) => void,
): () => void {
  const startTime = performance.now();
  let handle: number;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    onUpdate(Math.round(eased * target));
    if (progress < 1) {
      handle = requestAnimationFrame(tick);
    }
  };

  handle = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(handle);
}

/**
 * Returns a 1–3 star rating based on the normalised score (0–1000).
 *
 * @param score - Final score value (capped at BASE_SCORE)
 */
function getStarRating(score: number): 1 | 2 | 3 {
  const ratio = score / BASE_SCORE;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

/**
 * Level complete overlay modal.
 * Reads final stats from gameStore and shows animated results.
 */
export const LevelComplete = React.memo(function LevelComplete() {
  const router = useRouter();
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const timerMs = useGameStore((s) => s.timerMs);
  const moves = useGameStore((s) => s.moves);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const resetGame = useGameStore((s) => s.resetGame);
  const startLevel = useGameStore((s) => s.startLevel);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const closeModal = useUiStore((s) => s.closeModal);

  const isOpen = phase === 'COMPLETE';
  const [displayScore, setDisplayScore] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDisplayScore(0);
      return;
    }
    cleanupRef.current?.();
    cleanupRef.current = runCountUp(score, COUNT_UP_DURATION_MS, setDisplayScore);
    return () => cleanupRef.current?.();
  }, [isOpen, score]);

  const stars = getStarRating(score);

  const timePenalty = Math.floor(timerMs / 1000) * TIME_PENALTY_PER_SECOND;
  const movePenalty = moves * MOVE_PENALTY_PER_MOVE;
  const hintPenalty = hintsUsed * HINT_PENALTY_PER_HINT;

  const handleReplay = () => {
    closeModal();
    if (currentLevel) {
      startLevel(currentLevel);
    }
  };

  const handleMenu = () => {
    resetGame();
    closeModal();
    router.push('/');
  };

  const handleNextLevel = () => {
    resetGame();
    closeModal();
    router.push('/levels');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleMenu} ariaLabel="Level complete">
      <div className="flex flex-col items-center gap-6 px-6 py-8">
        {/* Title */}
        <motion.h2
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Untangled! 🎉
        </motion.h2>

        {/* Stars */}
        <motion.div
          className="flex gap-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
          aria-label={`${stars} star${stars !== 1 ? 's' : ''}`}
        >
          {([1, 2, 3] as const).map((n) => (
            <span
              key={n}
              aria-hidden="true"
              className={['text-4xl transition-all', n <= stars ? 'opacity-100' : 'opacity-25'].join(' ')}
            >
              ⭐
            </span>
          ))}
        </motion.div>

        {/* Score counter */}
        <motion.div
          className="text-5xl font-bold text-brand-primary"
          aria-live="polite"
          aria-label={`Score: ${displayScore}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {displayScore.toLocaleString()}
        </motion.div>

        {/* Breakdown */}
        <motion.dl
          className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between">
            <dt>Base</dt>
            <dd className="font-mono text-white">+{BASE_SCORE}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Time penalty</dt>
            <dd className="font-mono text-red-400">−{timePenalty}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Move penalty</dt>
            <dd className="font-mono text-red-400">−{movePenalty}</dd>
          </div>
          {hintsUsed > 0 && (
            <div className="flex justify-between">
              <dt>Hint penalty</dt>
              <dd className="font-mono text-red-400">−{hintPenalty}</dd>
            </div>
          )}
        </motion.dl>

        {/* Buttons */}
        <motion.div
          className="flex w-full flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button variant="primary" onClick={handleNextLevel} aria-label="Go to next level">
            Next Level →
          </Button>
          <Button variant="secondary" onClick={handleReplay} aria-label="Replay this level">
            Replay
          </Button>
          <Button variant="ghost" onClick={handleMenu} aria-label="Return to main menu">
            Menu
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
});
