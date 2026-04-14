/**
 * Game domain types shared between frontend and backend.
 * These types represent the core knot graph data structures.
 */

/** A single node (crossing point) in the knot graph. */
export interface KnotNode {
  id: string;
  position: { x: number; y: number; z: number };
  isFixed: boolean;
  crossingEdges: string[];
}

/** An edge connecting two nodes in the knot graph. */
export interface KnotEdge {
  id: string;
  from: string;
  to: string;
  stringId: string;
  /** Whether this edge passes over the crossing edge. */
  over: boolean;
}

/** A single colored string in the knot, defined by an ordered sequence of nodes. */
export interface KnotString {
  id: string;
  color: string;
  nodeSequence: string[];
}

/** The full knot graph representing a tangled configuration. */
export interface KnotGraph {
  nodes: KnotNode[];
  edges: KnotEdge[];
  strings: KnotString[];
}

/** The current phase of the game state machine. */
export type GamePhase = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETE';

/** A playable level containing knot data and scoring parameters. */
export interface Level {
  id: string;
  name: string;
  difficulty: number;
  knotData: KnotGraph;
  parTimeMs: number;
  parMoves: number;
  orderIndex: number;
  isDaily: boolean;
  createdAt: string;
}

/** A player's score record for a completed level. */
export interface Score {
  id: string;
  userId: string;
  levelId: string;
  score: number;
  timeMs: number;
  moves: number;
  hintsUsed: number;
  createdAt: string;
}
