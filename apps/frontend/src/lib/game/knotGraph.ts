/**
 * KnotGraph — runtime class wrapping the knot graph data structure.
 * Provides algorithms for crossing detection and untangle checking.
 */

import * as THREE from 'three';
import type { KnotGraph as KnotGraphData, KnotNode, KnotEdge } from '@unravel/shared-types';

/** A detected crossing between two edges in 3D projected space. */
export interface Crossing {
  /** First edge involved in the crossing. */
  edgeA: KnotEdge;
  /** Second edge involved in the crossing. */
  edgeB: KnotEdge;
  /** Approximate 3D world position of the crossing point. */
  position: THREE.Vector3;
}

/** Tolerance for floating-point comparisons in crossing detection. */
const EPSILON = 1e-6;

/**
 * Computes the cross product of 2D vectors (returns scalar z-component).
 */
function cross2D(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

/**
 * Tests whether two 2D line segments (p→q) and (r→s) intersect.
 * Returns the parametric t value along (p→q), or null if no intersection.
 */
function segmentIntersect2D(
  px: number, py: number,
  qx: number, qy: number,
  rx: number, ry: number,
  sx: number, sy: number,
): number | null {
  const dx = qx - px;
  const dy = qy - py;
  const ex = sx - rx;
  const ey = sy - ry;

  const denom = cross2D(dx, dy, ex, ey);
  if (Math.abs(denom) < EPSILON) return null; // Parallel

  const fx = rx - px;
  const fy = ry - py;

  const t = cross2D(fx, fy, ex, ey) / denom;
  const u = cross2D(fx, fy, dx, dy) / denom;

  if (t > EPSILON && t < 1 - EPSILON && u > EPSILON && u < 1 - EPSILON) {
    return t;
  }
  return null;
}

/**
 * Runtime class for manipulating and querying the knot graph.
 * Wrap raw KnotGraphData with this class to gain algorithmic methods.
 */
export class KnotGraph {
  private readonly data: KnotGraphData;

  private constructor(data: KnotGraphData) {
    this.data = data;
  }

  /**
   * Creates a KnotGraph instance from raw JSON data.
   *
   * @param data - Raw knot graph data (from API or generator)
   * @returns KnotGraph instance
   */
  static fromJSON(data: KnotGraphData): KnotGraph {
    return new KnotGraph(data);
  }

  /**
   * Returns a copy of the underlying raw data.
   */
  toJSON(): KnotGraphData {
    return { ...this.data };
  }

  /**
   * Returns the ordered sequence of 3D points for a given string.
   * Points correspond to the node positions along the string's path.
   *
   * @param stringId - ID of the string to retrieve
   * @returns Array of Vector3 world positions, in traversal order
   */
  getStringPath(stringId: string): THREE.Vector3[] {
    const str = this.data.strings.find((s) => s.id === stringId);
    if (!str) return [];

    const nodeMap = new Map<string, KnotNode>(
      this.data.nodes.map((n) => [n.id, n]),
    );

    return str.nodeSequence.reduce<THREE.Vector3[]>((acc, nodeId) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        acc.push(new THREE.Vector3(node.position.x, node.position.y, node.position.z));
      }
      return acc;
    }, []);
  }

  /**
   * Finds all crossings between edges by projecting them onto the XY plane
   * and performing 2D segment-segment intersection tests.
   *
   * @returns Array of detected Crossing objects
   */
  getCrossings(): Crossing[] {
    const crossings: Crossing[] = [];
    const edges = this.data.edges;
    const nodeMap = new Map<string, KnotNode>(
      this.data.nodes.map((n) => [n.id, n]),
    );

    for (let i = 0; i < edges.length - 1; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edgeA = edges[i];
        const edgeB = edges[j];

        // Skip edges that share a node — they meet at a point, not a crossing
        if (
          edgeA.from === edgeB.from ||
          edgeA.from === edgeB.to ||
          edgeA.to === edgeB.from ||
          edgeA.to === edgeB.to
        ) {
          continue;
        }

        const fromA = nodeMap.get(edgeA.from);
        const toA = nodeMap.get(edgeA.to);
        const fromB = nodeMap.get(edgeB.from);
        const toB = nodeMap.get(edgeB.to);

        if (!fromA || !toA || !fromB || !toB) continue;

        const t = segmentIntersect2D(
          fromA.position.x, fromA.position.y,
          toA.position.x, toA.position.y,
          fromB.position.x, fromB.position.y,
          toB.position.x, toB.position.y,
        );

        if (t !== null) {
          const pos = new THREE.Vector3(
            fromA.position.x + t * (toA.position.x - fromA.position.x),
            fromA.position.y + t * (toA.position.y - fromA.position.y),
            fromA.position.z + t * (toA.position.z - fromA.position.z),
          );
          crossings.push({ edgeA, edgeB, position: pos });
        }
      }
    }

    return crossings;
  }

  /**
   * Checks whether the knot graph is fully untangled (no edge crossings).
   *
   * @returns `true` if no crossings remain in the XY projection
   */
  isUntangled(): boolean {
    return this.getCrossings().length === 0;
  }

  /**
   * Returns all nodes in the graph.
   */
  getNodes(): KnotNode[] {
    return this.data.nodes;
  }

  /**
   * Returns all edges in the graph.
   */
  getEdges(): KnotEdge[] {
    return this.data.edges;
  }
}
