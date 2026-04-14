/**
 * UntangleEffect — particle burst displayed when the player solves a level.
 * Uses Points geometry for efficient GPU-side rendering.
 */

'use client';

import React, { useMemo, useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKnotStore } from '../../../stores/knotStore';
import { PARTICLE_COUNT_MEDIUM } from '../../../constants/game.constants';

/** How long the particle effect lasts (seconds). */
const EFFECT_DURATION = 2.0;

/** Maximum spread radius for particles. */
const SPREAD_RADIUS = 4.0;

/**
 * Renders a one-shot burst of particles when the knot is untangled.
 * Particles are animated outward and fade by scaling opacity via the
 * material's opacity property.
 *
 * Only visible when knotStore.isUntangled === true.
 */
export const UntangleEffect = memo(function UntangleEffect() {
  const isUntangled = useKnotStore((s) => s.isUntangled);
  const elapsedRef = useRef<number>(0);
  const activeRef = useRef<boolean>(false);

  const particleCount = PARTICLE_COUNT_MEDIUM;

  // Randomized initial directions per particle
  const initialPositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return positions;
  }, [particleCount]);

  const velocities = useMemo(() => {
    const vels = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1 + Math.random() * 2;
      vels[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vels[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vels[i * 3 + 2] = Math.cos(phi) * speed;
    }
    return vels;
  }, [particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(initialPositions.slice(), 3));
    return geo;
  }, [initialPositions]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#FFD700',
        size: 0.15,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        depthWrite: false,
      }),
    [],
  );

  // Reset effect state when isUntangled toggles on
  useEffect(() => {
    if (isUntangled) {
      elapsedRef.current = 0;
      activeRef.current = true;

      // Reset positions
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.array.set(initialPositions.slice());
      posAttr.needsUpdate = true;
      material.opacity = 1.0;
    } else {
      activeRef.current = false;
    }
  }, [isUntangled, geometry, initialPositions, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!activeRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current / EFFECT_DURATION;

    if (t >= 1) {
      activeRef.current = false;
      material.opacity = 0;
      return;
    }

    // Update positions based on velocity
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] += velocities[i * 3] * delta * SPREAD_RADIUS;
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta * SPREAD_RADIUS;
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta * SPREAD_RADIUS;
    }

    posAttr.needsUpdate = true;
    material.opacity = 1 - t;
  });

  if (!isUntangled && !activeRef.current) return null;

  return <points geometry={geometry} material={material} />;
});
