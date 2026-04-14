/**
 * Standalone untangle checker — wraps the KnotGraph crossing detection
 * for use outside the class context (e.g. in worker threads or plain functions).
 */

import type { KnotGraph as KnotGraphData } from '@unravel/shared-types';
import { KnotGraph } from './knotGraph';

/**
 * Checks whether a given knot graph data object is fully untangled.
 * "Untangled" means no edge crossings exist in the XY projection.
 *
 * @param graph - Raw knot graph data to inspect
 * @returns `true` if the graph has no crossings
 *
 * @example
 * if (checkUntangled(knotStore.graph)) {
 *   gameStore.completeLevel(score);
 * }
 */
export function checkUntangled(graph: KnotGraphData): boolean {
  return KnotGraph.fromJSON(graph).isUntangled();
}

/**
 * Counts the number of crossings in a knot graph.
 * Useful for difficulty estimation and hint systems.
 *
 * @param graph - Raw knot graph data to inspect
 * @returns Number of detected crossings
 */
export function countCrossings(graph: KnotGraphData): number {
  return KnotGraph.fromJSON(graph).getCrossings().length;
}
