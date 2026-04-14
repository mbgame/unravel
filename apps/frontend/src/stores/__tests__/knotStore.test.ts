/**
 * Unit tests for the knotStore Zustand slice.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useKnotStore } from '../knotStore';
import type { KnotGraph } from '@unravel/shared-types';

/** Simple mock knot graph for testing. */
const mockGraph: KnotGraph = {
  nodes: [
    { id: 'n1', position: { x: 0, y: 0, z: 0 }, isFixed: false, crossingEdges: [] },
    { id: 'n2', position: { x: 1, y: 0, z: 0 }, isFixed: false, crossingEdges: [] },
  ],
  edges: [
    { id: 'e1', from: 'n1', to: 'n2', stringId: 's1', over: true },
  ],
  strings: [
    { id: 's1', color: '#FF6584', nodeSequence: ['n1', 'n2'] },
  ],
};

describe('knotStore', () => {
  beforeEach(() => {
    useKnotStore.getState().clearGraph();
  });

  it('should initialize with null graph and no selection', () => {
    const state = useKnotStore.getState();
    expect(state.graph).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.isUntangled).toBe(false);
  });

  it('should set graph and reset selection on setGraph()', () => {
    useKnotStore.getState().setGraph(mockGraph);
    const state = useKnotStore.getState();
    expect(state.graph).toEqual(mockGraph);
    expect(state.selectedNodeId).toBeNull();
    expect(state.isUntangled).toBe(false);
  });

  it('should update node position on updateNodePosition()', () => {
    useKnotStore.getState().setGraph(mockGraph);
    useKnotStore.getState().updateNodePosition('n1', { x: 2, y: 3, z: 1 });
    const node = useKnotStore.getState().graph?.nodes.find((n) => n.id === 'n1');
    expect(node?.position).toEqual({ x: 2, y: 3, z: 1 });
  });

  it('should not mutate other nodes when updating one position', () => {
    useKnotStore.getState().setGraph(mockGraph);
    useKnotStore.getState().updateNodePosition('n1', { x: 5, y: 5, z: 5 });
    const n2 = useKnotStore.getState().graph?.nodes.find((n) => n.id === 'n2');
    expect(n2?.position).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('should select and deselect a node', () => {
    useKnotStore.getState().setGraph(mockGraph);
    useKnotStore.getState().selectNode('n1');
    expect(useKnotStore.getState().selectedNodeId).toBe('n1');

    useKnotStore.getState().selectNode(null);
    expect(useKnotStore.getState().selectedNodeId).toBeNull();
  });

  it('should set untangled state', () => {
    useKnotStore.getState().setUntangled(true);
    expect(useKnotStore.getState().isUntangled).toBe(true);
    useKnotStore.getState().setUntangled(false);
    expect(useKnotStore.getState().isUntangled).toBe(false);
  });

  it('should clear all state on clearGraph()', () => {
    useKnotStore.getState().setGraph(mockGraph);
    useKnotStore.getState().selectNode('n1');
    useKnotStore.getState().setUntangled(true);
    useKnotStore.getState().clearGraph();
    const state = useKnotStore.getState();
    expect(state.graph).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.isUntangled).toBe(false);
  });

  it('should not throw when updateNodePosition called with no graph', () => {
    expect(() => {
      useKnotStore.getState().updateNodePosition('n1', { x: 0, y: 0, z: 0 });
    }).not.toThrow();
    expect(useKnotStore.getState().graph).toBeNull();
  });
});
