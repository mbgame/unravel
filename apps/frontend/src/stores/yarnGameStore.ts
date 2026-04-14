/**
 * yarnGameStore — Zustand store for the yarn-ball collecting game.
 *
 * Game mechanics:
 *   • Two colour collectors (left + right), each accepts 3 balls of its colour.
 *   • When a ball doesn't match either collector it goes to the BUFFER STACK
 *     (up to 5 slots).  When a collector's colour later changes to a buffered
 *     ball's colour the YarnBallGenerator auto-releases those balls.
 *   • 5 buffer balls → phase = 'lost'.
 *   • All balls cleared → phase = 'won'.
 *   • Layered balls: each formation position has 1-3 stacked balls; the outer
 *     ball must be collected to reveal the one beneath.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type YarnGamePhase = 'idle' | 'playing' | 'won' | 'lost';
export type CollectorSide = 'left' | 'right';

export interface CollectorSlot {
  /** Hex colour this collector currently accepts. null only before initLevel. */
  color: string | null;
  /** Balls collected into this slot so far (0–3). */
  count: number;
}

/** A wrong-colour ball held in the buffer stack. */
export interface BufferedBall {
  /** Same as the layer id — unique identifier for this buffered ball. */
  id: string;
  /** Hex colour of this ball. */
  color: string;
}

interface YarnGameState {
  phase: YarnGamePhase;

  // ── Level metadata ──────────────────────────────────────────────────────────
  levelNumber: number;
  formationName: string;

  // ── Ball progress ───────────────────────────────────────────────────────────
  /** Total balls across ALL layers at level start. */
  totalBalls: number;
  /** Balls sent to collectors (not buffer). */
  clearedBalls: number;
  /** Coins collected from coin-bearing yarn balls this level. */
  coinsEarned: number;

  // ── Collectors ──────────────────────────────────────────────────────────────
  leftCollector:  CollectorSlot;
  rightCollector: CollectorSlot;

  // ── Celebration ─────────────────────────────────────────────────────────────
  /** Set when a collector fills (3/3). Holds the side + color for the effect. */
  celebration: { side: CollectorSide; color: string; time: number } | null;

  // ── Buffer stack ────────────────────────────────────────────────────────────
  /**
   * Wrong-colour balls held in the buffer (0–5).
   * At 5 → phase='lost'.
   * When a collector colour changes to match a buffered ball the generator
   * calls releaseFromBuffer() to auto-collect those balls.
   */
  bufferStack: BufferedBall[];

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Initialise a new level. Sets phase='playing', resets all counters, and
   * assigns the two initial collector colours.
   */
  initLevel: (
    levelNumber: number,
    formationName: string,
    totalBalls: number,
    color1: string,
    color2: string,
  ) => void;

  /**
   * Record a ball arriving at the given collector.
   * Returns `true` if the collector just reached 3 (caller should then
   * call `clearCollector` with the next colour to show).
   */
  addToCollector: (side: CollectorSide) => boolean;

  /**
   * Clear a full collector and assign a new colour.
   * Pass `null` when no more balls of any other colour remain.
   */
  clearCollector: (side: CollectorSide, newColor: string | null) => void;

  /**
   * Add one wrong-colour ball to the buffer stack.
   * Automatically transitions to 'lost' when the 5th ball is added.
   */
  addToBuffer: (id: string, color: string) => void;

  /**
   * Remove all buffered balls whose colour matches `color`.
   * Returns the number of balls removed (0 if none matched).
   * Called by the generator after a collector colour change to auto-collect.
   */
  releaseFromBuffer: (color: string) => number;

  /**
   * Mark `count` balls as cleared from the scene.
   * Automatically transitions to 'won' when clearedBalls >= totalBalls.
   */
  clearBalls: (count: number) => void;

  /** Increment coinsEarned by 1 (called when a coin-bearing ball is collected). */
  addCoin: () => void;

  /** Full reset to idle — called on retry or quit. */
  resetYarnGame: () => void;
}

const EMPTY_SLOT: CollectorSlot = { color: null, count: 0 };

export const useYarnGameStore = create<YarnGameState>()(
  devtools(
    (set, get) => ({
      phase: 'idle',
      levelNumber: 1,
      formationName: '',
      totalBalls: 0,
      clearedBalls: 0,
      coinsEarned: 0,
      leftCollector:  { ...EMPTY_SLOT },
      rightCollector: { ...EMPTY_SLOT },
      celebration: null,
      bufferStack: [],

      // ── initLevel ──────────────────────────────────────────────────────────
      initLevel(levelNumber, formationName, totalBalls, color1, color2) {
        set({
          phase: 'playing',
          levelNumber,
          formationName,
          totalBalls,
          clearedBalls: 0,
          coinsEarned: 0,
          bufferStack: [],
          leftCollector:  { color: color1, count: 0 },
          rightCollector: { color: color2, count: 0 },
        }, false, 'yarn/initLevel');
      },

      // ── addCoin ────────────────────────────────────────────────────────────
      addCoin() {
        set((s) => ({ coinsEarned: s.coinsEarned + 1 }), false, 'yarn/addCoin');
      },

      // ── addToCollector ─────────────────────────────────────────────────────
      addToCollector(side) {
        const slot = side === 'left' ? get().leftCollector : get().rightCollector;
        const newCount = slot.count + 1;
        const filled = newCount >= 3;
        const patch: Partial<YarnGameState> = side === 'left'
          ? { leftCollector:  { ...slot, count: newCount } }
          : { rightCollector: { ...slot, count: newCount } };
        if (filled && slot.color) {
          patch.celebration = { side, color: slot.color, time: Date.now() };
        }
        set(patch, false, 'yarn/addToCollector');
        return filled;
      },

      // ── clearCollector ─────────────────────────────────────────────────────
      clearCollector(side, newColor) {
        const patch = side === 'left'
          ? { leftCollector:  { color: newColor, count: 0 } }
          : { rightCollector: { color: newColor, count: 0 } };
        set(patch, false, 'yarn/clearCollector');
      },

      // ── addToBuffer ────────────────────────────────────────────────────────
      addToBuffer(id, color) {
        const newBuffer = [...get().bufferStack, { id, color }];
        const isLost = newBuffer.length >= 5;
        set(
          { bufferStack: newBuffer, ...(isLost ? { phase: 'lost' as YarnGamePhase } : {}) },
          false,
          isLost ? 'yarn/bufferFull_lost' : 'yarn/addToBuffer',
        );
      },

      // ── releaseFromBuffer ──────────────────────────────────────────────────
      releaseFromBuffer(color) {
        const before = get().bufferStack;
        const kept   = before.filter((b) => b.color !== color);
        const count  = before.length - kept.length;
        if (count > 0) {
          set({ bufferStack: kept }, false, 'yarn/releaseFromBuffer');
        }
        return count;
      },

      // ── clearBalls ─────────────────────────────────────────────────────────
      clearBalls(count) {
        const next = get().clearedBalls + count;
        const won  = next >= get().totalBalls;
        set(
          { clearedBalls: next, ...(won ? { phase: 'won' as YarnGamePhase } : {}) },
          false,
          won ? 'yarn/won' : 'yarn/clearBalls',
        );
      },

      // ── resetYarnGame ──────────────────────────────────────────────────────
      resetYarnGame() {
        set({
          phase: 'idle',
          levelNumber: 1,
          formationName: '',
          totalBalls: 0,
          clearedBalls: 0,
          coinsEarned: 0,
          bufferStack: [],
          celebration: null,
          leftCollector:  { ...EMPTY_SLOT },
          rightCollector: { ...EMPTY_SLOT },
        }, false, 'yarn/reset');
      },
    }),
    { name: 'YarnGameStore' },
  ),
);
