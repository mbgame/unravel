/**
 * LevelCard — displays a single level's metadata in the level select grid.
 * Shows the level name, difficulty stars, best score, and lock state.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/** Data needed to render one level card. */
export interface LevelCardData {
  /** Level UUID. */
  id: string;
  /** Display name. */
  name: string;
  /** Difficulty 1–10 (displayed as 1–5 filled stars). */
  difficulty: number;
  /** Player's best score for this level, or null if never played. */
  bestScore: number | null;
  /** Whether the level is locked (not yet unlocked). */
  isLocked: boolean;
  /** 1-based sequential level number for display. */
  orderIndex: number;
}

interface LevelCardProps {
  level: LevelCardData;
  /** Animation delay offset for staggered entrance. */
  animationDelay?: number;
}

/**
 * Converts a 1–10 difficulty value into a 0–5 filled-star count.
 */
function difficultyToStars(difficulty: number): number {
  return Math.round((difficulty / 10) * 5);
}

/**
 * Level select card component.
 *
 * @param level - Level metadata to display
 * @param animationDelay - Framer Motion stagger delay in seconds
 */
export const LevelCard = React.memo(function LevelCard({
  level,
  animationDelay = 0,
}: LevelCardProps) {
  const stars = difficultyToStars(level.difficulty);

  if (level.isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay, type: 'spring', stiffness: 280, damping: 24 }}
        className="flex min-h-[96px] min-w-[96px] flex-col items-center justify-center rounded-2xl bg-white/5 p-4 opacity-50"
        aria-label={`Level ${level.orderIndex}: locked`}
      >
        <span aria-hidden="true" className="text-3xl">🔒</span>
        <span className="mt-1 text-xs text-white/40">{level.orderIndex}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: animationDelay, type: 'spring', stiffness: 280, damping: 24 }}
    >
      <Link
        href={`/game?levelId=${level.id}`}
        aria-label={`Level ${level.orderIndex}: ${level.name}, difficulty ${level.difficulty} out of 10`}
        className={[
          'flex min-h-[96px] flex-col gap-1 rounded-2xl bg-white/10 p-4',
          'transition hover:bg-white/20 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        ].join(' ')}
      >
        {/* Level number */}
        <span className="text-xs font-medium text-white/50">{level.orderIndex}</span>

        {/* Level name */}
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {level.name}
        </span>

        {/* Stars */}
        <div aria-hidden="true" className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={['text-xs', i < stars ? 'text-yellow-400' : 'text-white/20'].join(' ')}
            >
              ★
            </span>
          ))}
        </div>

        {/* Best score */}
        {level.bestScore !== null && (
          <span className="text-xs text-white/50">{level.bestScore.toLocaleString()} pts</span>
        )}
      </Link>
    </motion.div>
  );
});
