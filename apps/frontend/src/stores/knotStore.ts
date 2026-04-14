/**
 * Knot state store — manages the active knot graph, selection, untangle state,
 * and coin collection.
 * Owns all runtime mutable knot data (positions, selection, coins).
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { KnotGraph } from '@unravel/shared-types';

/** Alias for the shared KnotGraph type used in store context. */
type KnotGraphData = KnotGraph;

/** Shape of the knot state slice. */
interface KnotState {
  /** Active knot graph data; null when no level is loaded. */
  graph: KnotGraphData | null;
  /** ID of the currently selected knot node, null if none. */
  selectedNodeId: string | null;
  /** Whether the current graph has been fully untangled. */
  isUntangled: boolean;
  /** IDs of nodes that have been collected by the player. */
  collectedNodeIds: string[];
  /** Total coins earned in the current level. */
  coinsEarned: number;
}

/** Actions available on the knot store. */
interface KnotActions {
  /**
   * Loads a new knot graph (called when a level starts).
   * @param graph - The knot graph data to load
   */
  setGraph: (graph: KnotGraphData) => void;
  /**
   * Updates the 3D position of a single node.
   * @param nodeId - ID of the node to move
   * @param position - New position as {x, y, z}
   */
  updateNodePosition: (nodeId: string, position: { x: number; y: number; z: number }) => void;
  /**
   * Sets the selected node (for highlighting and drag operations).
   * @param nodeId - Node ID to select, or null to deselect
   */
  selectNode: (nodeId: string | null) => void;
  /**
   * Marks a node as collected, awarding one coin.
   * No-op if the node is already collected.
   * @param nodeId - ID of the node to collect
   */
  collectNode: (nodeId: string) => void;
  /**
   * Marks the knot as untangled (triggers level complete flow).
   * @param value - Untangle state to set
   */
  setUntangled: (value: boolean) => void;
  /** Clears all knot state (called on reset/quit). */
  clearGraph: () => void;
}

const INITIAL_STATE: KnotState = {
  graph: null,
  selectedNodeId: null,
  isUntangled: false,
  collectedNodeIds: [],
  coinsEarned: 0,
};

/**
 * Zustand store for knot graph runtime state.
 * DevTools enabled in development mode only.
 */
export const useKnotStore = create<KnotState & KnotActions>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      setGraph: (graph) =>
        set(
          { graph, selectedNodeId: null, isUntangled: false, collectedNodeIds: [], coinsEarned: 0 },
          false,
          'knot/setGraph',
        ),

      updateNodePosition: (nodeId, position) =>
        set((state) => {
          if (!state.graph) return state;

          const updatedNodes = state.graph.nodes.map((node) =>
            node.id === nodeId ? { ...node, position } : node,
          );

          return { graph: { ...state.graph, nodes: updatedNodes } };
        }, false, 'knot/updateNodePosition'),

      selectNode: (nodeId) =>
        set({ selectedNodeId: nodeId }, false, 'knot/selectNode'),

      collectNode: (nodeId) =>
        set((state) => {
          if (state.collectedNodeIds.includes(nodeId)) return state;
          return {
            collectedNodeIds: [...state.collectedNodeIds, nodeId],
            coinsEarned: state.coinsEarned + 1,
          };
        }, false, 'knot/collectNode'),

      setUntangled: (value) =>
        set({ isUntangled: value }, false, 'knot/setUntangled'),

      clearGraph: () => set(INITIAL_STATE, false, 'knot/clearGraph'),
    }),
    { name: 'KnotStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
