/**
 * Unit tests for KnotGraph algorithms.
 * Tests crossing detection and untangle checking.
 */

import { describe, it, expect } from 'vitest';
import { KnotGraph } from '../knotGraph';
import type { KnotGraph as KnotGraphData } from '@unravel/shared-types';

/** Helper to build a minimal KnotGraph with two straight horizontal strings
 *  that do NOT cross — they're at different Y values. */
function buildUntangledGraph(): KnotGraphData {
  return {
    nodes: [
      { id: 'n1', position: { x: -2, y: 1, z: 0 }, isFixed: true, crossingEdges: [] },
      { id: 'n2', position: { x: 2, y: 1, z: 0 }, isFixed: true, crossingEdges: [] },
      { id: 'n3', position: { x: -2, y: -1, z: 0 }, isFixed: true, crossingEdges: [] },
      { id: 'n4', position: { x: 2, y: -1, z: 0 }, isFixed: true, crossingEdges: [] },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false },
      { id: 'e2', from: 'n3', to: 'n4', stringId: 's2', over: false },
    ],
    strings: [
      { id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] },
      { id: 's2', color: '#00FF00', nodeSequence: ['n3', 'n4'] },
    ],
  };
}

/** Helper to build a KnotGraph where two edges cross (X pattern). */
function buildTangledGraph(): KnotGraphData {
  return {
    nodes: [
      // String 1: goes from top-left to bottom-right
      { id: 'n1', position: { x: -2, y: 2, z: 0 }, isFixed: true, crossingEdges: [] },
      { id: 'n2', position: { x: 2, y: -2, z: 0 }, isFixed: true, crossingEdges: [] },
      // String 2: goes from bottom-left to top-right
      { id: 'n3', position: { x: -2, y: -2, z: 0 }, isFixed: true, crossingEdges: [] },
      { id: 'n4', position: { x: 2, y: 2, z: 0 }, isFixed: true, crossingEdges: [] },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: true },
      { id: 'e2', from: 'n3', to: 'n4', stringId: 's2', over: false },
    ],
    strings: [
      { id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] },
      { id: 's2', color: '#00FF00', nodeSequence: ['n3', 'n4'] },
    ],
  };
}

/** Edges that share a node should NOT be counted as crossings. */
function buildSharedNodeGraph(): KnotGraphData {
  return {
    nodes: [
      { id: 'n1', position: { x: -1, y: 0, z: 0 }, isFixed: false, crossingEdges: [] },
      { id: 'n2', position: { x: 0, y: 1, z: 0 }, isFixed: false, crossingEdges: [] },
      { id: 'n3', position: { x: 1, y: 0, z: 0 }, isFixed: false, crossingEdges: [] },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false },
      { id: 'e2', from: 'n2', to: 'n3', stringId: 's1', over: false },
    ],
    strings: [
      { id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2', 'n3'] },
    ],
  };
}

describe('KnotGraph.isUntangled()', () => {
  it('should return true for a graph with no crossings', () => {
    const graph = KnotGraph.fromJSON(buildUntangledGraph());
    expect(graph.isUntangled()).toBe(true);
  });

  it('should return false for a graph with crossing edges (X pattern)', () => {
    const graph = KnotGraph.fromJSON(buildTangledGraph());
    expect(graph.isUntangled()).toBe(false);
  });

  it('should return true for a graph with a single string (no crossings possible)', () => {
    const singleStringGraph: KnotGraphData = {
      nodes: [
        { id: 'n1', position: { x: -1, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
        { id: 'n2', position: { x: 1, y: 0, z: 0 }, isFixed: true, crossingEdges: [] },
      ],
      edges: [{ id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: false }],
      strings: [{ id: 's1', color: '#FF0000', nodeSequence: ['n1', 'n2'] }],
    };
    const graph = KnotGraph.fromJSON(singleStringGraph);
    expect(graph.isUntangled()).toBe(true);
  });

  it('should return true for an empty graph', () => {
    const emptyGraph: KnotGraphData = { nodes: [], edges: [], strings: [] };
    const graph = KnotGraph.fromJSON(emptyGraph);
    expect(graph.isUntangled()).toBe(true);
  });
});

describe('KnotGraph.getCrossings()', () => {
  it('should return no crossings for parallel horizontal strings', () => {
    const graph = KnotGraph.fromJSON(buildUntangledGraph());
    expect(graph.getCrossings()).toHaveLength(0);
  });

  it('should return one crossing for an X pattern', () => {
    const graph = KnotGraph.fromJSON(buildTangledGraph());
    const crossings = graph.getCrossings();
    expect(crossings).toHaveLength(1);
  });

  it('should not count shared-node edges as crossings', () => {
    const graph = KnotGraph.fromJSON(buildSharedNodeGraph());
    expect(graph.getCrossings()).toHaveLength(0);
  });

  it('should return correct edge references in crossing', () => {
    const graph = KnotGraph.fromJSON(buildTangledGraph());
    const [crossing] = graph.getCrossings();
    expect([crossing.edgeA.id, crossing.edgeB.id]).toContain('e1');
    expect([crossing.edgeA.id, crossing.edgeB.id]).toContain('e2');
  });

  it('should return crossing position near origin for X pattern', () => {
    const graph = KnotGraph.fromJSON(buildTangledGraph());
    const [crossing] = graph.getCrossings();
    expect(crossing.position.x).toBeCloseTo(0, 3);
    expect(crossing.position.y).toBeCloseTo(0, 3);
  });
});

describe('KnotGraph.getStringPath()', () => {
  it('should return ordered Vector3 points for a valid string', () => {
    const graph = KnotGraph.fromJSON(buildUntangledGraph());
    const path = graph.getStringPath('s1');
    expect(path).toHaveLength(2);
    expect(path[0].x).toBe(-2);
    expect(path[0].y).toBe(1);
    expect(path[1].x).toBe(2);
  });

  it('should return empty array for unknown string ID', () => {
    const graph = KnotGraph.fromJSON(buildUntangledGraph());
    expect(graph.getStringPath('nonexistent')).toHaveLength(0);
  });
});

describe('KnotGraph.fromJSON()', () => {
  it('should preserve all data from input', () => {
    const data = buildUntangledGraph();
    const graph = KnotGraph.fromJSON(data);
    expect(graph.getNodes()).toHaveLength(4);
    expect(graph.getEdges()).toHaveLength(2);
    expect(graph.toJSON()).toEqual(data);
  });
});
