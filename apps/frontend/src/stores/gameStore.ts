/**
 * Game state store — manages phase, level, score, timer, and move tracking.
 * One slice per domain; this slice owns all core gameplay state.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GamePhase, Level } from '@unravel/shared-types';

/** Shape of the game state slice. */
interface GameState {
  /** Current game phase (state machine). */
  phase: GamePhase;
  /** Active level data, null when no level is loaded. */
  currentLevel: Level | null;
  /** Player's current score for this attempt. */
  score: number;
  /** Elapsed game time in milliseconds. */
  timerMs: number;
  /** Number of moves made in this attempt. */
  moves: number;
  /** Number of hints consumed in this attempt. */
  hintsUsed: number;
}

/** Actions available on the game store. */
interface GameActions {
  /**
   * Transitions from IDLE to PLAYING and loads a level.
   * @param level - Level data to play
   */
  startLevel: (level: Level) => void;
  /** Transitions from PLAYING to PAUSED. */
  pauseGame: () => void;
  /** Transitions from PAUSED to PLAYING. */
  resumeGame: () => void;
  /**
   * Transitions to COMPLETE and records the final score.
   * @param finalScore - Calculated score for this run
   */
  completeLevel: (finalScore: number) => void;
  /** Resets all state back to IDLE (fresh start). */
  resetGame: () => void;
  /**
   * Increments the timer by a delta.
   * @param deltaMs - Milliseconds elapsed since last tick
   */
  tickTimer: (deltaMs: number) => void;
  /** Increments the move counter by one. */
  incrementMoves: () => void;
  /** Increments the hints-used counter by one. */
  useHint: () => void;
}

const INITIAL_STATE: GameState = {
  phase: 'IDLE',
  currentLevel: null,
  score: 0,
  timerMs: 0,
  moves: 0,
  hintsUsed: 0,
};

/**
 * Zustand store for core game state.
 * DevTools enabled in development mode only.
 */
export const useGameStore = create<GameState & GameActions>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      startLevel: (level) =>
        set(
          { phase: 'PLAYING', currentLevel: level, score: 0, timerMs: 0, moves: 0, hintsUsed: 0 },
          false,
          'game/startLevel',
        ),

      pauseGame: () =>
        set((state) => {
          if (state.phase !== 'PLAYING') return state;
          return { phase: 'PAUSED' };
        }, false, 'game/pauseGame'),

      resumeGame: () =>
        set((state) => {
          if (state.phase !== 'PAUSED') return state;
          return { phase: 'PLAYING' };
        }, false, 'game/resumeGame'),

      completeLevel: (finalScore) =>
        set({ phase: 'COMPLETE', score: finalScore }, false, 'game/completeLevel'),

      resetGame: () => set(INITIAL_STATE, false, 'game/resetGame'),

      tickTimer: (deltaMs) =>
        set((state) => {
          if (state.phase !== 'PLAYING') return state;
          return { timerMs: state.timerMs + deltaMs };
        }, false, 'game/tickTimer'),

      incrementMoves: () =>
        set((state) => ({ moves: state.moves + 1 }), false, 'game/incrementMoves'),

      useHint: () =>
        set((state) => ({ hintsUsed: state.hintsUsed + 1 }), false, 'game/useHint'),
    }),
    { name: 'GameStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
