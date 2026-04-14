/**
 * KnotNodeMesh — renders a collectible coin node at a knot crossing point.
 * - Gold metallic sphere with floating bob animation
 * - Shrinks and flashes bright when collected
 * - Raycasting ID is cleared on collection so it can't be re-tapped
 */

'use client';

import React, { useMemo, useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DEFAULT_STRING_RADIUS, NODE_RADIUS_MULTIPLIER } from '../../../constants/game.constants';

/** Props for the KnotNodeMesh component. */
interface KnotNodeMeshProps {
  /** World position for this node. */
  position: { x: number; y: number; z: number };
  /** The node's ID — stored in userData for raycasting. */
  nodeId: string;
  /** Hex color inherited from the string this node belongs to (unused visually, kept for API compat). */
  color: string;
  /** Whether this node is currently selected (shows brighter glow). */
  isSelected?: boolean;
  /** Whether this node is fixed (endpoint — rendered as silver). */
  isFixed?: boolean;
  /** Whether this node has been collected — triggers shrink animation. */
  collected?: boolean;
}

/** Shared geometry instance — all nodes share the same SphereGeometry. */
let _sharedSphereGeo: THREE.SphereGeometry | null = null;

function getSharedSphereGeometry(): THREE.SphereGeometry {
  if (!_sharedSphereGeo) {
    const radius = DEFAULT_STRING_RADIUS * NODE_RADIUS_MULTIPLIER;
    _sharedSphereGeo = new THREE.SphereGeometry(radius, 16, 16);
  }
  return _sharedSphereGeo;
}

/**
 * Returns a stable phase offset in [0, 2π) derived from the nodeId string.
 * Prevents all nodes from bobbing in sync.
 */
function nodePhaseOffset(nodeId: string): number {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = (hash * 31 + nodeId.charCodeAt(i)) & 0xffffffff;
  }
  return ((hash >>> 0) % 628) / 100;
}

/**
 * Gold coin sphere at a knot crossing node.
 * - Shared geometry to minimize draw calls
 * - MeshStandardMaterial with gold metallic sheen
 * - useFrame-driven floating bob + slow Y-rotation
 * - Shrinks and flashes on collection
 *
 * @param props - KnotNodeMesh props
 */
export const KnotNodeMesh = memo(function KnotNodeMesh({
  position,
  nodeId,
  isSelected = false,
  isFixed = false,
  collected = false,
}: KnotNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const collectStartRef = useRef<number | null>(null);
  const phaseOffset = useMemo(() => nodePhaseOffset(nodeId), [nodeId]);

  const geometry = useMemo(() => getSharedSphereGeometry(), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isFixed ? '#C8C8C8' : '#FFD700'),
        emissive: new THREE.Color(isFixed ? '#404040' : '#FF8C00'),
        emissiveIntensity: 0.4,
        metalness: isFixed ? 0.2 : 1.0,
        roughness: isFixed ? 0.6 : 0.1,
      }),
    [isFixed],
  );

  // Store nodeId in userData for raycast picking
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.userData as { nodeId: string }).nodeId = nodeId;
    }
  }, [nodeId]);

  useEffect(() => {
    return () => {
      // Do NOT dispose shared geometry
      material.dispose();
    };
  }, [material]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (collected) {
      if (collectStartRef.current === null) {
        collectStartRef.current = t;
        // Flash bright and remove from raycasting immediately
        material.emissiveIntensity = 2.5;
        delete (meshRef.current.userData as Record<string, unknown>).nodeId;
      }

      const elapsed = t - collectStartRef.current;
      const duration = 0.35;

      if (elapsed >= duration) {
        meshRef.current.visible = false;
        meshRef.current.scale.setScalar(0.001);
      } else {
        const progress = elapsed / duration;
        meshRef.current.scale.setScalar(1 - progress);
        material.emissiveIntensity = Math.max(0.4, 2.5 - progress * 10);
      }
    } else {
      collectStartRef.current = null;
      meshRef.current.visible = true;
      meshRef.current.scale.setScalar(1);
      material.emissiveIntensity = isSelected ? 1.2 : 0.4;

      // Floating bob + slow spin
      const bobY = Math.sin(t * 1.5 + phaseOffset) * 0.08;
      meshRef.current.position.set(position.x, position.y + bobY, position.z);
      meshRef.current.rotation.y = t * 0.8 + phaseOffset;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[position.x, position.y, position.z]}
    />
  );
});
