/**
 * CollectorCelebration — full-screen shader burst when a collector fills 3/3.
 *
 * Renders a screen-space quad with a custom fragment shader that draws:
 *   • An expanding ring of the collector's colour
 *   • Radiating sparkle rays
 *   • Particle-like dots that fly outward
 *
 * The effect originates from the filled collector's screen position
 * (bottom-left or bottom-right) and lasts ~0.8 s.
 */

'use client';

import React, { useRef, useEffect, useMemo, memo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useYarnGameStore } from '../../../stores/yarnGameStore';

const EFFECT_DURATION = 0.8;

// ── Shader ────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uProgress;   // 0 → 1 over effect lifetime
  uniform vec3  uColor;      // collector colour
  uniform vec2  uCenter;     // NDC origin of the burst (0..1)
  uniform vec2  uResolution; // viewport size for aspect correction

  varying vec2 vUv;

  // Pseudo-random from vec2
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float t = uProgress;

    // Aspect-corrected UV relative to burst center
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (vUv - uCenter) * aspect;
    float dist = length(uv);

    // ── Expanding ring ──────────────────────────────────────────────────
    float ringRadius = t * 1.2;
    float ringWidth  = 0.04 + 0.02 * (1.0 - t);
    float ring = smoothstep(ringWidth, 0.0, abs(dist - ringRadius));
    ring *= (1.0 - t); // fade out

    // ── Radiating rays (12 spokes) ──────────────────────────────────────
    float angle = atan(uv.y, uv.x);
    float rays = pow(abs(sin(angle * 6.0 + t * 8.0)), 16.0);
    rays *= smoothstep(ringRadius + 0.15, ringRadius * 0.3, dist);
    rays *= (1.0 - t) * 0.6;

    // ── Sparkle particles ───────────────────────────────────────────────
    float sparkle = 0.0;
    for (int i = 0; i < 18; i++) {
      float fi = float(i);
      float a = hash(vec2(fi, 0.0)) * 6.2832;
      float speed = 0.5 + hash(vec2(fi, 1.0)) * 1.0;
      float r = t * speed;
      vec2 pPos = vec2(cos(a), sin(a)) * r;
      float d = length(uv - pPos);
      float sz = 0.012 + hash(vec2(fi, 2.0)) * 0.01;
      float brightness = smoothstep(sz, sz * 0.3, d);
      // Fade in early, fade out late
      brightness *= smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.5, t);
      sparkle += brightness;
    }

    // ── Combine ─────────────────────────────────────────────────────────
    float alpha = ring + rays + sparkle * 0.8;
    alpha = clamp(alpha, 0.0, 1.0);

    // Warm glow: mix white into the colour near the centre
    vec3 glow = mix(uColor, vec3(1.0), 0.4);
    vec3 col = mix(uColor, glow, ring * 0.5 + sparkle * 0.3);

    gl_FragColor = vec4(col, alpha * 0.85);
  }
`;

// ── Component ─────────────────────────────────────────────────────────────

export const CollectorCelebration = memo(function CollectorCelebration() {
  const celebration = useYarnGameStore((s) => s.celebration);
  const { size } = useThree();

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTimeRef = useRef(0);
  const activeRef = useRef(false);
  const meshRef = useRef<THREE.Mesh>(null);

  // Screen-space position for left / right collector
  // Left collector: bottom-left, Right collector: bottom-right
  const centerForSide = useMemo(() => ({
    left:  new THREE.Vector2(0.12, 0.08),
    right: new THREE.Vector2(0.88, 0.08),
  }), []);

  const uniforms = useMemo(() => ({
    uProgress:   { value: 0 },
    uColor:      { value: new THREE.Color('#ffffff') },
    uCenter:     { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update resolution on resize
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // Trigger effect when celebration changes
  useEffect(() => {
    if (!celebration) return;
    const mat = materialRef.current;
    if (!mat) return;

    uniforms.uColor.value.set(celebration.color);
    uniforms.uCenter.value.copy(centerForSide[celebration.side]);
    uniforms.uProgress.value = 0;
    startTimeRef.current = 0; // will be set on first frame
    activeRef.current = true;
    if (meshRef.current) meshRef.current.visible = true;
  }, [celebration, uniforms, centerForSide]);

  useFrame((_, delta) => {
    if (!activeRef.current) return;
    const mat = materialRef.current;
    if (!mat) return;

    if (startTimeRef.current === 0) startTimeRef.current = delta;

    const p = uniforms.uProgress.value + delta / EFFECT_DURATION;
    uniforms.uProgress.value = Math.min(p, 1);

    if (p >= 1) {
      activeRef.current = false;
      if (meshRef.current) meshRef.current.visible = false;
      // Clear celebration so next fill triggers again
      useYarnGameStore.setState({ celebration: null });
    }
  });

  return (
    <mesh ref={meshRef} visible={false} renderOrder={999} frustumCulled={false}>
      {/* Full-screen triangle (covers clip space -1..1) */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
});
