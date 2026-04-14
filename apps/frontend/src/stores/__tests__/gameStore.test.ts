/**
 * Unit tests for the gameStore Zustand slice.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import type { Level } from '@unravel/shared-types';

/** Minimal mock level for testing. */
const mockLevel: Level = {
  id: 'level-1',
  name: 'Test Level',
  difficulty: 1,
  knotData: { nodes: [], edges: [], strings: [] },
  parTimeMs: 60000,
  parMoves: 20,
  orderIndex: 1,
  isDaily: false,
  createdAt: new Date().toISOString(),
};

describe('gameStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    useGameStore.getState().resetGame();
  });

  it('should initialize with IDLE phase and zeroed counters', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe('IDLE');
    expect(state.currentLevel).toBeNull();
    expect(state.score).toBe(0);
    expect(state.timerMs).toBe(0);
    expect(state.moves).toBe(0);
    expect(state.hintsUsed).toBe(0);
  });

  it('should transition to PLAYING and load level on startLevel()', () => {
    useGameStore.getState().startLevel(mockLevel);
    const state = useGameStore.getState();
    expect(state.phase).toBe('PLAYING');
    expect(state.currentLevel).toEqual(mockLevel);
    expect(state.score).toBe(0);
    expect(state.timerMs).toBe(0);
    expect(state.moves).toBe(0);
    expect(state.hintsUsed).toBe(0);
  });

  it('should transition to PAUSED on pauseGame() from PLAYING', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().pauseGame();
    expect(useGameStore.getState().phase).toBe('PAUSED');
  });

  it('should not change phase on pauseGame() when already PAUSED', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().pauseGame();
    useGameStore.getState().pauseGame();
    expect(useGameStore.getState().phase).toBe('PAUSED');
  });

  it('should transition back to PLAYING on resumeGame() from PAUSED', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().pauseGame();
    useGameStore.getState().resumeGame();
    expect(useGameStore.getState().phase).toBe('PLAYING');
  });

  it('should set COMPLETE phase and final score on completeLevel()', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().completeLevel(750);
    const state = useGameStore.getState();
    expect(state.phase).toBe('COMPLETE');
    expect(state.score).toBe(750);
  });

  it('should increment moves counter on incrementMoves()', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().incrementMoves();
    useGameStore.getState().incrementMoves();
    expect(useGameStore.getState().moves).toBe(2);
  });

  it('should increment hintsUsed on useHint()', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintsUsed).toBe(1);
  });

  it('should tick timer only when PLAYING', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().tickTimer(500);
    expect(useGameStore.getState().timerMs).toBe(500);
  });

  it('should not tick timer when PAUSED', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().pauseGame();
    useGameStore.getState().tickTimer(500);
    expect(useGameStore.getState().timerMs).toBe(0);
  });

  it('should reset all state on resetGame()', () => {
    useGameStore.getState().startLevel(mockLevel);
    useGameStore.getState().incrementMoves();
    useGameStore.getState().useHint();
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();
    expect(state.phase).toBe('IDLE');
    expect(state.currentLevel).toBeNull();
    expect(state.moves).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.timerMs).toBe(0);
  });
});
