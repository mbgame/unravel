/**
 * CenterModel — loads and renders the central Fox GLB model.
 * Gently rotates and bobs to draw the player's eye to the scene center.
 * Must be rendered inside a Suspense boundary (handled by Scene).
 */

'use client';

import React, { useRef, memo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_PATH = '/assets/models/fox.glb';

/**
 * Renders the Fox.glb model at scene center with continuous rotation and
 * a gentle floating animation.
 *
 * Scale 0.022 converts the model's centimeter units (~130cm tall) to ~2.9
 * scene units, fitting naturally within the knot layout (nodes span ±3 units).
 * Positioned at z=-2 so it sits behind the knot layer from camera perspective.
 */
export const CenterModel = memo(function CenterModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.35;
    groupRef.current.position.y = -1.2 + Math.sin(t * 0.55) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, -1.2, -2]} scale={0.022}>
      <primitive object={scene} />
    </group>
  );
});

// Preload so it's ready when the scene mounts
useGLTF.preload(MODEL_PATH);
