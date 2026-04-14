/**
 * YarnHouse — decorative 3D knitted toy house made of wound yarn threads.
 *
 * Procedurally generated walls, roof, door, windows, and chimney using the
 * same CatmullRomCurve3 + TubeGeometry technique as the game's yarn balls.
 *
 * Positioned behind the game pieces as a thematic background decoration
 * for Level 1 (the "House" formation).
 */

'use client';

import React, { useRef, useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  createYarnHouseGeometry,
  type HouseColorGroup,
} from '../../../lib/three/yarnHouseGeometry';
import { STRING_TEXTURE_URL } from '../../../lib/three/yarnTexture';

// ── Component ──────────────────────────────────────────────────────────────

export const YarnHouse = memo(function YarnHouse() {
  const groupRef = useRef<THREE.Group>(null);
  const stringTex = useTexture(STRING_TEXTURE_URL) as THREE.Texture;

  // ── Geometry (computed once) ──────────────────────────────────────────────
  const houseGeo = useMemo(() => createYarnHouseGeometry(1.0), []);

  // ── Materials per colour group ────────────────────────────────────────────
  const materials = useMemo(() => {
    // Configure the string texture for tiled thread appearance
    stringTex.wrapS = THREE.RepeatWrapping;
    stringTex.wrapT = THREE.RepeatWrapping;
    stringTex.repeat.set(12, 2);
    stringTex.needsUpdate = true;

    return houseGeo.groups.map((grp: HouseColorGroup) => {
      const col = new THREE.Color(grp.color);
      return {
        spiral: new THREE.MeshStandardMaterial({
          map:               stringTex,
          color:             col,
          emissive:          col,
          emissiveIntensity: 0.30,
          roughness:         0.65,
          metalness:         0.02,
        }),
        core: new THREE.MeshStandardMaterial({
          color:     col.clone().multiplyScalar(0.45),
          roughness: 0.88,
          metalness: 0.02,
        }),
      };
    });
  }, [houseGeo, stringTex]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      houseGeo.dispose();
      for (const m of materials) {
        m.spiral.dispose();
        m.core.dispose();
      }
    };
  }, [houseGeo, materials]);

  // ── Animation — gentle sway + subtle bob ──────────────────────────────────
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.06;
    groupRef.current.position.y = -1.0 + Math.sin(t * 0.4) * 0.04;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <group ref={groupRef} position={[0, -1.0, -3]} scale={0.7}>
      {houseGeo.groups.map((grp, i) => (
        <group key={i}>
          <mesh geometry={grp.cores}   material={materials[i].core}   />
          <mesh geometry={grp.spirals} material={materials[i].spiral} />
        </group>
      ))}
    </group>
  );
});
