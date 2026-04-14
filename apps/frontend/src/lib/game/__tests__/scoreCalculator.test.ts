/**
 * Unit tests for the scoreCalculator module.
 */

import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoreCalculator';
import {
  BASE_SCORE,
  TIME_PENALTY_PER_SECOND,
  MOVE_PENALTY_PER_MOVE,
  HINT_PENALTY_PER_HINT,
  MIN_SCORE,
} from '../../../constants/game.constants';

describe('calculateScore()', () => {
  it('should return the base score for a perfect run (0 time, 0 moves, 0 hints)', () => {
    const result = calculateScore(0, 0, 0);
    expect(result.finalScore).toBe(BASE_SCORE);
    expect(result.baseScore).toBe(BASE_SCORE);
    expect(result.timePenalty).toBe(0);
    expect(result.movePenalty).toBe(0);
    expect(result.hintPenalty).toBe(0);
  });

  it('should apply correct time penalty for 30 seconds', () => {
    const result = calculateScore(30_000, 0, 0);
    const expected = BASE_SCORE - 30 * TIME_PENALTY_PER_SECOND;
    expect(result.timePenalty).toBe(30 * TIME_PENALTY_PER_SECOND);
    expect(result.finalScore).toBe(expected);
  });

  it('should floor time to seconds (ignore sub-second ms)', () => {
    const result = calculateScore(999, 0, 0);
    // 999ms → 0 full seconds → no time penalty
    expect(result.timePenalty).toBe(0);
  });

  it('should apply correct move penalty', () => {
    const result = calculateScore(0, 10, 0);
    expect(result.movePenalty).toBe(10 * MOVE_PENALTY_PER_MOVE);
    expect(result.finalScore).toBe(BASE_SCORE - 10 * MOVE_PENALTY_PER_MOVE);
  });

  it('should apply correct hint penalty', () => {
    const result = calculateScore(0, 0, 2);
    expect(result.hintPenalty).toBe(2 * HINT_PENALTY_PER_HINT);
    expect(result.finalScore).toBe(BASE_SCORE - 2 * HINT_PENALTY_PER_HINT);
  });

  it('should never return a score below MIN_SCORE', () => {
    // Massive penalty should floor at 0
    const result = calculateScore(600_000, 200, 10);
    expect(result.finalScore).toBe(MIN_SCORE);
  });

  it('should combine all penalties correctly', () => {
    const timeMs = 30_000; // 30s
    const moves = 10;
    const hintsUsed = 1;
    const result = calculateScore(timeMs, moves, hintsUsed);
    const expected =
      BASE_SCORE -
      30 * TIME_PENALTY_PER_SECOND -
      moves * MOVE_PENALTY_PER_MOVE -
      hintsUsed * HINT_PENALTY_PER_HINT;
    expect(result.finalScore).toBe(Math.max(MIN_SCORE, expected));
  });

  it('should return breakdown with all fields present', () => {
    const result = calculateScore(10_000, 5, 1);
    expect(result).toHaveProperty('baseScore');
    expect(result).toHaveProperty('timePenalty');
    expect(result).toHaveProperty('movePenalty');
    expect(result).toHaveProperty('hintPenalty');
    expect(result).toHaveProperty('finalScore');
  });
});
