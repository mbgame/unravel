/**
 * Level progress store — tracks which of the 5 game levels have been completed.
 * Level 1 is always unlocked; each subsequent level unlocks when the previous is done.
 * Persisted to localStorage so progress survives page reloads.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Total number of playable levels in the game. */
export const TOTAL_LEVELS = 5;

interface LevelProgressState {
  /** Array of level numbers (1-based) the player has completed at least once. */
  completedLevels: number[];

  /** Mark a level as completed (idempotent). */
  markComplete: (levelNumber: number) => void;

  /** Returns true if the level has been completed. */
  isCompleted: (levelNumber: number) => boolean;

  /**
   * Returns true if the level is playable.
   * Level 1 is always unlocked; level N requires N-1 to be completed.
   */
  isUnlocked: (levelNumber: number) => boolean;
}

export const useLevelProgressStore = create<LevelProgressState>()(
  persist(
    (set, get) => ({
      completedLevels: [],

      markComplete: (n) =>
        set((s) => ({
          completedLevels: s.completedLevels.includes(n)
            ? s.completedLevels
            : [...s.completedLevels, n],
        })),

      isCompleted: (n) => get().completedLevels.includes(n),

      isUnlocked: (n) => n === 1 || get().completedLevels.includes(n - 1),
    }),
    {
      name: 'unravel-level-progress',
      partialize: (s) => ({ completedLevels: s.completedLevels }),
    },
  ),
);
