/**
 * Score calculation for completed levels.
 * Formula mirrors the server-side calculation to provide real-time feedback.
 */

import {
  BASE_SCORE,
  TIME_PENALTY_PER_SECOND,
  MOVE_PENALTY_PER_MOVE,
  HINT_PENALTY_PER_HINT,
  MIN_SCORE,
} from '../../constants/game.constants';

/** Input parameters for score calculation. */
export interface ScoreInput {
  /** Time taken to complete the level in milliseconds. */
  timeMs: number;
  /** Total number of moves made. */
  moves: number;
  /** Number of hints consumed. */
  hintsUsed: number;
}

/** Detailed score breakdown for UI display. */
export interface ScoreBreakdown {
  /** Starting base score. */
  baseScore: number;
  /** Penalty deducted for elapsed time. */
  timePenalty: number;
  /** Penalty deducted for moves made. */
  movePenalty: number;
  /** Penalty deducted for hints used. */
  hintPenalty: number;
  /** Final score after all deductions (min 0). */
  finalScore: number;
}

/**
 * Calculates the final score and breakdown for a completed level.
 *
 * Formula:
 * - baseScore = 1000
 * - timePenalty = floor(timeMs / 1000) * 2
 * - movePenalty = moves * 5
 * - hintPenalty = hintsUsed * 100
 * - finalScore = max(0, baseScore - timePenalty - movePenalty - hintPenalty)
 *
 * @param timeMs - Time taken in milliseconds
 * @param moves - Total moves made
 * @param hintsUsed - Number of hints consumed
 * @returns Complete score breakdown including final score
 *
 * @example
 * const { finalScore } = calculateScore(30000, 10, 0);
 * // baseScore=1000, timePenalty=60, movePenalty=50, hintPenalty=0 → 890
 */
export function calculateScore(timeMs: number, moves: number, hintsUsed: number): ScoreBreakdown {
  const timePenalty = Math.floor(timeMs / 1000) * TIME_PENALTY_PER_SECOND;
  const movePenalty = moves * MOVE_PENALTY_PER_MOVE;
  const hintPenalty = hintsUsed * HINT_PENALTY_PER_HINT;

  const rawScore = BASE_SCORE - timePenalty - movePenalty - hintPenalty;
  const finalScore = Math.max(MIN_SCORE, rawScore);

  return {
    baseScore: BASE_SCORE,
    timePenalty,
    movePenalty,
    hintPenalty,
    finalScore,
  };
}
