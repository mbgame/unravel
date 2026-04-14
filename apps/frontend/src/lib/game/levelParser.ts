/**
 * Level parser — transforms API Level data into an initial GameState shape
 * that can be loaded directly into the Zustand stores.
 */

import type { Level } from '@unravel/shared-types';
import type { KnotGraph } from '@unravel/shared-types';

/** Initial game state derived from a parsed level. */
export interface ParsedGameState {
  /** The level definition. */
  level: Level;
  /** The knot graph ready for rendering. */
  graph: KnotGraph;
  /** Suggested initial camera distance based on knot bounding box. */
  cameraDistance: number;
}

/** Compute a rough bounding radius from node positions. */
function computeBoundingRadius(graph: KnotGraph): number {
  if (graph.nodes.length === 0) return 5;

  let maxDist = 0;
  for (const node of graph.nodes) {
    const dist = Math.sqrt(
      node.position.x ** 2 + node.position.y ** 2 + node.position.z ** 2,
    );
    if (dist > maxDist) maxDist = dist;
  }
  return maxDist;
}

/**
 * Parses a Level from the API into an initial game state object.
 * Validates the level structure and sets up the knot graph for rendering.
 *
 * @param levelData - Level data from the API
 * @returns Parsed game state ready for store initialization
 * @throws Error if level data is structurally invalid
 *
 * @example
 * const state = parseLevel(apiLevel);
 * gameStore.startLevel(state.level);
 * knotStore.setGraph(state.graph);
 */
export function parseLevel(levelData: Level): ParsedGameState {
  const { knotData } = levelData;

  if (!knotData || !Array.isArray(knotData.nodes) || !Array.isArray(knotData.edges)) {
    throw new Error(`Invalid level data for level "${levelData.id}": missing knot graph fields`);
  }

  if (knotData.nodes.length === 0) {
    throw new Error(`Level "${levelData.id}" has no nodes`);
  }

  const radius = computeBoundingRadius(knotData);
  // Camera distance: bounding radius * 2.5, clamped between 8 and 20
  const cameraDistance = Math.max(8, Math.min(20, radius * 2.5));

  return {
    level: levelData,
    graph: knotData,
    cameraDistance,
  };
}
