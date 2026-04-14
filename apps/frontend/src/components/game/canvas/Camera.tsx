/**
 * Camera — sets up a perspective camera for the game scene.
 */

'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../../../constants/game.constants';

/** Props for the Camera component. */
interface CameraProps {
  /** Distance along the Z axis. Defaults to CAMERA_Z (10). */
  zDistance?: number;
}

/**
 * Configures the R3F perspective camera.
 * Sets FOV, position, and near/far clipping planes appropriate for mobile.
 */
export function Camera({ zDistance = CAMERA_Z }: CameraProps): null {
  const { camera } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    camera.fov = CAMERA_FOV;
    camera.near = 0.1;
    camera.far = 100;
    camera.position.set(0, 0, zDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zDistance]);

  return null;
}
