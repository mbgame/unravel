/**
 * Background — a large gradient quad plane placed behind the scene.
 * Uses vertex colors to simulate a gradient without a texture lookup.
 */

'use client';

import React, { useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';

/** Width and height of the background plane (large enough to fill any viewport). */
const PLANE_SIZE = 50;

/** Gradient colors: top (dark purple) and bottom (very dark navy). */
const COLOR_TOP = new THREE.Color('#1A0A2E');
const COLOR_BOTTOM = new THREE.Color('#0D0D1A');

/**
 * Renders a large gradient plane behind the scene at Z = -10.
 * Uses vertex colors to avoid a texture sample per fragment.
 * Memoized — never re-renders after mount.
 */
export const Background = memo(function Background() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);

    // Assign vertex colors for gradient
    const colors = new Float32Array(4 * 3); // 4 vertices × 3 channels (RGB)

    // PlaneGeometry vertices: bottom-left, bottom-right, top-left, top-right
    // Bottom vertices → COLOR_BOTTOM
    colors[0] = COLOR_BOTTOM.r; colors[1] = COLOR_BOTTOM.g; colors[2] = COLOR_BOTTOM.b;
    colors[3] = COLOR_BOTTOM.r; colors[4] = COLOR_BOTTOM.g; colors[5] = COLOR_BOTTOM.b;
    // Top vertices → COLOR_TOP
    colors[6] = COLOR_TOP.r; colors[7] = COLOR_TOP.g; colors[8] = COLOR_TOP.b;
    colors[9] = COLOR_TOP.r; colors[10] = COLOR_TOP.g; colors[11] = COLOR_TOP.b;

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} position={[0, 0, -10]} />;
});
