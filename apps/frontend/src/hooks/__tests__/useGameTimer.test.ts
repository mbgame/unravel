/**
 * Unit tests for the useGameTimer hook.
 * Uses Vitest fake timers and the RAF mock.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameTimer } from '../useGameTimer';
import { useGameStore } from '../../stores/gameStore';
import type { Level } from '@unravel/shared-types';

/** Minimal mock level for testing. */
const mockLevel: Level = {
  id: 'level-timer-test',
  name: 'Timer Test',
  difficulty: 1,
  knotData: { nodes: [], edges: [], strings: [] },
  parTimeMs: 60_000,
  parMoves: 20,
  orderIndex: 1,
  isDaily: false,
  createdAt: new Date().toISOString(),
};

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.useRealTimers();
    useGameStore.getState().resetGame();
  });

  it('should not advance timerMs when game is IDLE', () => {
    renderHook(() => useGameTimer());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(useGameStore.getState().timerMs).toBe(0);
  });

  it('should advance timerMs when game is PLAYING', () => {
    // Mock requestAnimationFrame to call callback with a fixed timestamp
    let rafCallback: ((ts: number) => void) | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb as (ts: number) => void;
      return 1;
    });

    useGameStore.getState().startLevel(mockLevel);
    renderHook(() => useGameTimer());

    // Simulate two RAF frames ~16ms apart
    act(() => {
      if (rafCallback) rafCallback(1000);
    });
    act(() => {
      if (rafCallback) rafCallback(1016);
    });

    expect(useGameStore.getState().timerMs).toBeGreaterThan(0);
  });

  it('should not advance timerMs when PAUSED', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().pauseGame();

    renderHook(() => useGameTimer());
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(useGameStore.getState().timerMs).toBe(0);
  });

  it('should stop advancing when game transitions to COMPLETE', () => {
    useGameStore.getState().startLevel(mockLevel);

    let rafCallback: ((ts: number) => void) | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb as (ts: number) => void;
      return 1;
    });

    const { rerender } = renderHook(() => useGameTimer());

    act(() => {
      if (rafCallback) rafCallback(1000);
    });
    act(() => {
      if (rafCallback) rafCallback(1016);
    });

    const timerBefore = useGameStore.getState().timerMs;
    useGameStore.getState().completeLevel(500);
    rerender();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Timer should not advance further after COMPLETE
    expect(useGameStore.getState().timerMs).toBe(timerBefore);
  });
});
