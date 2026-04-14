/**
 * Scene — root wrapper for all R3F scene content.
 * Provides Suspense boundary and arranges core scene elements.
 * OrbitControls handles horizontal rotation; zoom is driven by uiStore.
 */

'use client';

import React, { Suspense, memo, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Camera } from './Camera';
import { Lights } from './Lights';
import { ShadowGround } from './ShadowGround';
import { CollectorCelebration } from '../effects/CollectorCelebration';
import { CAMERA_Z } from '../../../constants/game.constants';
import { useUiStore } from '../../../stores/uiStore';
import { useDebugStore } from '../debug/DebugPanel';

/** Zoom range: how far the camera can move from default distance. */
const ZOOM_IN_OFFSET = 4;
const ZOOM_OUT_OFFSET = 4;

/** Props for the Scene component. */
interface SceneProps {
  /** Game-specific scene content (yarn balls, effects, etc.). */
  children?: React.ReactNode;
}

/** Inner component — runs inside the R3F context so useThree is available. */
function SceneInner({ children }: SceneProps) {
  const { scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    scene.background = null;
  }, [scene]);

  // Drive OrbitControls from zoom slider + debug store each frame
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const zoom = useUiStore.getState().zoom;
    const offset = zoom > 0
      ? -zoom * ZOOM_IN_OFFSET
      : -zoom * ZOOM_OUT_OFFSET;
    const targetDist = CAMERA_Z + offset;

    const currentDist = controls.getDistance();
    const newDist = currentDist + (targetDist - currentDist) * 0.12;
    controls.minDistance = newDist;
    controls.maxDistance = newDist;

    // Live-update orbit settings from debug store
    const dbg = useDebugStore.getState();
    controls.dampingFactor = dbg.orbitDamping;
    controls.rotateSpeed = dbg.orbitRotateSpeed;
    controls.minPolarAngle = Math.PI * dbg.minPolarAngle;
    controls.maxPolarAngle = Math.PI * dbg.maxPolarAngle;
  });

  return (
    <>
      <Camera />
      <Lights />
      {children}
      <ShadowGround />
      <CollectorCelebration />
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        minDistance={CAMERA_Z}
        maxDistance={CAMERA_Z}
      />
    </>
  );
}

/**
 * Wraps all 3D scene content with a Suspense boundary.
 * Renders Camera, Lights, and children. Background colour is applied
 * via Three.js scene.background so it matches the canvas perfectly.
 * Stars are omitted — they are invisible against light backgrounds.
 */
export const Scene = memo(function Scene({ children }: SceneProps) {
  return (
    <Suspense fallback={null}>
      <SceneInner>{children}</SceneInner>
    </Suspense>
  );
});
