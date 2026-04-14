/**
 * Helper utilities for creating and managing TubeGeometry for rope/string rendering.
 * Wraps Three.js CatmullRomCurve3 + TubeGeometry with performance defaults.
 */

import * as THREE from 'three';
import {
  TUBE_SEGMENTS_HIGH,
  TUBE_SEGMENTS_MEDIUM,
  TUBE_SEGMENTS_LOW,
} from '../../constants/game.constants';
import type { QualityTier } from '../../stores/settingsStore';

/** Options for creating a rope tube geometry. */
export interface TubeGeometryOptions {
  /** 3D control points for the curve. */
  points: THREE.Vector3[];
  /** Tube radius. */
  radius: number;
  /** Quality tier — controls tubular segment count. */
  quality?: Exclude<QualityTier, 'auto'>;
  /** Number of radial segments around the tube cross-section. */
  radialSegments?: number;
  /** Whether the tube should be closed (loop). */
  closed?: boolean;
}

/** Default radial segments for tube cross-section (affects draw call cost). */
const DEFAULT_RADIAL_SEGMENTS = 6;

/**
 * Maps a quality tier to the number of tubular segments (length resolution).
 */
export function getTubeSegmentCount(quality: Exclude<QualityTier, 'auto'>): number {
  switch (quality) {
    case 'high': return TUBE_SEGMENTS_HIGH;
    case 'medium': return TUBE_SEGMENTS_MEDIUM;
    case 'low': return TUBE_SEGMENTS_LOW;
  }
}

/**
 * Creates a TubeGeometry following a CatmullRom spline through the given points.
 * The caller is responsible for disposing the returned geometry when done.
 *
 * @param options - Tube creation options
 * @returns A new TubeGeometry instance
 *
 * @example
 * const geo = createRopeTubeGeometry({ points, radius: 0.08, quality: 'medium' });
 * // In useEffect cleanup:
 * return () => geo.dispose();
 */
export function createRopeTubeGeometry(options: TubeGeometryOptions): THREE.TubeGeometry {
  const {
    points,
    radius,
    quality = 'medium',
    radialSegments = DEFAULT_RADIAL_SEGMENTS,
    closed = false,
  } = options;

  // Need at least 2 points for a valid curve
  const safePoints = points.length >= 2 ? points : [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
  ];

  const curve = new THREE.CatmullRomCurve3(safePoints, closed, 'catmullrom', 0.5);
  const tubularSegments = getTubeSegmentCount(quality);

  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

/**
 * Creates a simple sphere geometry for knot crossing nodes.
 * The caller is responsible for disposing the returned geometry when done.
 *
 * @param radius - Sphere radius
 * @param quality - Quality tier for segment resolution
 * @returns A new SphereGeometry instance
 */
export function createNodeSphereGeometry(
  radius: number,
  quality: Exclude<QualityTier, 'auto'> = 'medium',
): THREE.SphereGeometry {
  const segments = quality === 'high' ? 16 : quality === 'medium' ? 12 : 8;
  return new THREE.SphereGeometry(radius, segments, segments);
}
