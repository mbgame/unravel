/**
 * Unit tests for the levelParser module.
 */

import { describe, it, expect } from 'vitest';
import { parseLevel } from '../levelParser';
import type { Level } from '@unravel/shared-types';

/** Builds a minimal valid Level object for testing. */
function buildMockLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test-level-1',
    name: 'Test Level',
    difficulty: 3,
    parTimeMs: 60_000,
    parMoves: 20,
    orderIndex: 1,
    isDaily: false,
    createdAt: new Date().toISOString(),
    knotData: {
      nodes: [
        { id: 'n1', position: { x: -2, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
        { id: 'n2', position: { x: 2, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
      ],
      edges: [{ id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false }],
      strings: [{ id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] }],
    },
    ...overrides,
  };
}

describe('parseLevel()', () => {
  it('should return a ParsedGameState with correct level reference', () => {
    const level = buildMockLevel();
    const result = parseLevel(level);
    expect(result.level).toBe(level);
  });

  it('should return the knot graph from level data', () => {
    const level = buildMockLevel();
    const result = parseLevel(level);
    expect(result.graph).toBe(level.knotData);
    expect(result.graph.nodes).toHaveLength(2);
  });

  it('should compute a reasonable camera distance for a small knot', () => {
    const level = buildMockLevel();
    const result = parseLevel(level);
    // Nodes at ±2 on X → bounding radius ≈ 2 → cameraDistance = max(8, min(20, 2*2.5)) = 8
    expect(result.cameraDistance).toBeGreaterThanOrEqual(8);
    expect(result.cameraDistance).toBeLessThanOrEqual(20);
  });

  it('should clamp camera distance to minimum 8 for very small knots', () => {
    const level = buildMockLevel({
      knotData: {
        nodes: [
          { id: 'n1', position: { x: 0, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
          { id: 'n2', position: { x: 0.5, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
        ],
        edges: [{ id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false }],
        strings: [{ id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] }],
      },
    });
    const result = parseLevel(level);
    expect(result.cameraDistance).toBe(8);
  });

  it('should clamp camera distance to maximum 20 for very large knots', () => {
    const level = buildMockLevel({
      knotData: {
        nodes: [
          { id: 'n1', position: { x: -20, y: 20, z: 0 }, isFixed: true, crossingEdges: [] },
          { id: 'n2', position: { x: 20, y: -20, z: 0 }, isFixed: true, crossingEdges: [] },
        ],
        edges: [{ id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false }],
        strings: [{ id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] }],
      },
    });
    const result = parseLevel(level);
    expect(result.cameraDistance).toBe(20);
  });

  it('should throw when knotData is missing nodes array', () => {
    const level = buildMockLevel({
      knotData: { nodes: undefined as unknown as [], edges: [], strings: [] },
    });
    expect(() => parseLevel(level)).toThrow();
  });

  it('should throw when knotData has empty nodes', () => {
    const level = buildMockLevel({
      knotData: { nodes: [], edges: [], strings: [] },
    });
    expect(() => parseLevel(level)).toThrow();
  });
});
