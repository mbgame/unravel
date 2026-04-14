/**
 * ShadowGround — fake soft shadow via a custom shader on a ground plane.
 *
 * Renders a soft radial gradient (elliptical blob) that approximates the
 * shape's shadow. Much cheaper than real shadow maps and looks great
 * for static/semi-static objects. Driven by the debug panel store.
 *
 * The shader draws a smooth elliptical falloff from center to edge,
 * with noise-based irregularity to avoid a perfectly circular look.
 */

'use client';

import React, { memo, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useDebugStore } from '../debug/DebugPanel';

// ── Shader ────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uOpacity;
  uniform vec2  uScale;      // ellipse X/Z stretch (wider shapes = wider shadow)
  uniform float uSoftness;   // edge falloff sharpness
  uniform float uNoise;      // irregular edge amount

  varying vec2 vUv;

  // Simple 2D noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Center UV at origin (-1 to +1)
    vec2 uv = (vUv - 0.5) * 2.0;

    // Apply elliptical scaling
    vec2 scaled = uv / uScale;

    // Distance from center (elliptical)
    float dist = length(scaled);

    // Add noise to break up the perfect circle
    float n = noise(uv * 4.0) * uNoise;
    dist += n;

    // Smooth falloff from center
    float shadow = 1.0 - smoothstep(0.0, uSoftness, dist);

    // Extra softening at the very edge
    shadow *= shadow;

    gl_FragColor = vec4(0.0, 0.0, 0.0, shadow * uOpacity);
  }
`;

// ── Component ─────────────────────────────────────────────────────────────

export const ShadowGround = memo(function ShadowGround() {
  const visible    = useDebugStore((s) => s.groundVisible);
  const groundY    = useDebugStore((s) => s.groundY);
  const groundSize = useDebugStore((s) => s.groundSize);

  const uniforms = useMemo(() => ({
    uOpacity:  { value: 0.18 },
    uScale:    { value: new THREE.Vector2(1.0, 0.7) },
    uSoftness: { value: 1.0 },
    uNoise:    { value: 0.08 },
  }), []);

  // Update from debug store each frame
  useFrame(() => {
    const dbg = useDebugStore.getState();
    uniforms.uOpacity.value  = dbg.shadowOpacity;
    uniforms.uSoftness.value = dbg.shadowSoftness;
    uniforms.uNoise.value    = dbg.shadowNoise;
    uniforms.uScale.value.set(dbg.shadowScaleX, dbg.shadowScaleZ);
  });

  if (!visible) return null;

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, groundY, 0]}
    >
      <planeGeometry args={[groundSize, groundSize]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
});
