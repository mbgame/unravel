/**
 * Procedural knot generator — creates tangled knot graphs for gameplay.
 * Difficulty 1–10 controls the number of crossings and strings.
 */

import type { KnotGraph, KnotNode, KnotEdge, KnotString } from '@unravel/shared-types';
import { MIN_DIFFICULTY, MAX_DIFFICULTY, STRING_COLORS } from '../../constants';

/** Seeded pseudo-random number generator (LCG) for reproducibility. */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Generates a UUID-like string for IDs. */
function makeId(prefix: string, index: number): string {
  return `${prefix}-${index.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generates a procedurally tangled knot graph for the given difficulty.
 *
 * Algorithm:
 * 1. Create straight horizontal strings arranged vertically.
 * 2. Apply random "crossing" operations by inserting midpoints and offsetting them.
 * 3. Higher difficulty → more strings and more crossing operations.
 *
 * @param difficulty - Difficulty level (1–10)
 * @param seed - Optional RNG seed for reproducibility
 * @returns A KnotGraph data object suitable for gameplay
 */
export function generateKnot(difficulty: number, seed?: number): KnotGraph {
  const clampedDifficulty = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, difficulty));
  const rng = createRng(seed ?? Math.floor(Math.random() * 999999));

  const stringCount = 2 + Math.floor(clampedDifficulty / 3);
  const crossingsPerString = clampedDifficulty;

  const nodes: KnotNode[] = [];
  const edges: KnotEdge[] = [];
  const strings: KnotString[] = [];

  let nodeIndex = 0;
  let edgeIndex = 0;

  for (let si = 0; si < stringCount; si++) {
    const stringId = makeId('s', si);
    const color = STRING_COLORS[si % STRING_COLORS.length];
    const y = (si - (stringCount - 1) / 2) * 1.5;

    // Start and end anchor nodes
    const startNode: KnotNode = {
      id: makeId('n', nodeIndex++),
      position: { x: -4, y, z: 0 },
      isFixed: true,
      crossingEdges: [],
    };
    const endNode: KnotNode = {
      id: makeId('n', nodeIndex++),
      position: { x: 4, y, z: 0 },
      isFixed: true,
      crossingEdges: [],
    };

    nodes.push(startNode, endNode);

    // Insert midpoints with random Y offsets to create visual tangles
    const midNodes: KnotNode[] = [];
    const midCount = crossingsPerString + 1;

    for (let mi = 0; mi < midCount; mi++) {
      const t = (mi + 1) / (midCount + 1);
      const xPos = -4 + t * 8;
      const yOffset = (rng() - 0.5) * 3;
      const zOffset = (rng() - 0.5) * 2;

      const midNode: KnotNode = {
        id: makeId('n', nodeIndex++),
        position: { x: xPos, y: y + yOffset, z: zOffset },
        isFixed: false,
        crossingEdges: [],
      };

      nodes.push(midNode);
      midNodes.push(midNode);
    }

    // Build ordered node sequence: start → mid[0..n] → end
    const nodeSequence = [
      startNode.id,
      ...midNodes.map((n) => n.id),
      endNode.id,
    ];

    // Create edges connecting sequential nodes
    const allNodesInOrder = [startNode, ...midNodes, endNode];
    for (let i = 0; i < allNodesInOrder.length - 1; i++) {
      const edge: KnotEdge = {
        id: makeId('e', edgeIndex++),
        from: allNodesInOrder[i].id,
        to: allNodesInOrder[i + 1].id,
        stringId,
        over: rng() > 0.5,
      };
      edges.push(edge);
    }

    strings.push({ id: stringId, color, nodeSequence });
  }

  return { nodes, edges, strings };
}
