/**
 * StringSegment — renders a single rope segment as a TubeGeometry.
 * Uses CatmullRomCurve3 for smooth curves and MeshToonMaterial for cartoon look.
 */

'use client';

import React, { useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';
import { DEFAULT_STRING_RADIUS } from '../../../constants/game.constants';
import { createRopeTubeGeometry } from '../../../lib/three/tubeGeometry';

/** Props for the StringSegment component. */
interface StringSegmentProps {
  /** Ordered 3D world positions defining the rope curve. */
  points: THREE.Vector3[];
  /** Hex color string for the rope. */
  color: string;
  /** Tube radius. Defaults to DEFAULT_STRING_RADIUS. */
  radius?: number;
  /** Whether this segment belongs to the selected string. */
  isSelected?: boolean;
}

/**
 * Renders a smooth rope segment between a series of 3D points.
 * - TubeGeometry wrapping a CatmullRomCurve3
 * - MeshToonMaterial for a flat/cartoon shading look
 * - Geometry is memoized; disposed on unmount
 *
 * @param props - StringSegment props
 */
export const StringSegment = memo(function StringSegment({
  points,
  color,
  radius = DEFAULT_STRING_RADIUS,
  isSelected = false,
}: StringSegmentProps) {
  const geometry = useMemo(
    () => createRopeTubeGeometry({ points, radius, quality: 'medium' }),
    // Re-create geometry when points array identity changes (new positions from store)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, radius],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: isSelected ? 0.5 : 0.15,
        metalness: 0.4,
        roughness: 0.5,
      }),
    [color, isSelected],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
});
