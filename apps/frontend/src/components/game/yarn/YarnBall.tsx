/**
 * YarnBall — a collectible 3D yarn ball made of wound threads.
 *
 * Phases:
 *   spawning  Scale-up reveal animation (0.32 s).
 *   idle      Gentle float + slow Y-rotation with fresnel rim glow.
 *   unravel   A string zigzags top→bottom pulling apart rows (0.35 s).
 *   travel    Thread arcs to collector and winds into spindle (0.4 s).
 *   done      → calls onCollected(stackId, layerId).
 */

'use client';

import React, { useRef, useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createYarnBallGeometry, YarnShape } from '../../../lib/three/yarnBallGeometry';
import { createHousePartGeometry, type HousePartType } from '../../../lib/three/yarnHouseGeometry';
import { createTreePartGeometry, type TreePartType } from '../../../lib/three/yarnTreeGeometry';
import { createBoatPartGeometry, type BoatPartType } from '../../../lib/three/yarnBoatGeometry';
import { createCastlePartGeometry, type CastlePartType } from '../../../lib/three/yarnCastleGeometry';
import { createRocketPartGeometry, type RocketPartType } from '../../../lib/three/yarnRocketGeometry';
import { createFresnelGlowMaterial } from '../../../lib/three/yarnShaders';
import { useDebugStore } from '../debug/DebugPanel';

type CollectPhase = 'spawning' | 'idle' | 'unravel' | 'travel' | 'fly' | 'done';

export interface YarnBallProps {
  stackId:       string;
  layerId:       string;
  position:      [number, number, number];
  size:          number;
  color:         string;
  shape:         YarnShape;
  shouldCollect: boolean;
  collectTarget: 'left' | 'right' | 'buffer';
  isSpawning:    boolean;
  hasCoin?:      boolean;
  textureString: THREE.Texture;
  onCollected:   (stackId: string, layerId: string) => void;
  housePart?:    HousePartType;
  treePart?:     TreePartType;
  boatPart?:     BoatPartType;
  castlePart?:   CastlePartType;
  rocketPart?:   RocketPartType;
  textureYarn?:  THREE.Texture;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function phaseOffsetFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return ((hash >>> 0) % 628) / 100;
}

function bounceOut(t: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1)      return n1 * t * t;
  if (t < 2 / d1)      return n1 * (t -= 1.5  / d1) * t + 0.75;
  if (t < 2.5 / d1)    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                        return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

/**
 * Build a zigzag path from top to bottom of the bounding box.
 * `axis` selects which horizontal axis the rows sweep along:
 *   'x' → zigzag along X (Z=0) — for front/back walls
 *   'z' → zigzag along Z (X=0) — for side walls / deep objects
 */
function buildZigzagPath(
  top: number, bottom: number, halfW: number, rowCount: number,
  axis: 'x' | 'z' = 'x',
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let row = 0; row <= rowCount; row++) {
    const yFrac = row / rowCount;
    const y     = top - yFrac * (top - bottom);
    const sign  = row % 2 === 0 ? 1 : -1;
    if (axis === 'x') {
      pts.push(new THREE.Vector3(-halfW * sign, y, 0));
      pts.push(new THREE.Vector3( halfW * sign, y, 0));
    } else {
      pts.push(new THREE.Vector3(0, y, -halfW * sign));
      pts.push(new THREE.Vector3(0, y,  halfW * sign));
    }
  }
  return pts;
}

/**
 * Build a spherical unravel path — horizontal circles (latitude lines)
 * from the top pole to the bottom pole, alternating CW/CCW.
 * Each circle's radius matches the sphere cross-section at that height.
 */
function buildSphereUnravelPath(
  radius: number, rowCount: number, segmentsPerCircle = 12,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let row = 0; row <= rowCount; row++) {
    const yFrac = row / rowCount;
    const y     = radius - yFrac * 2 * radius; // top → bottom
    const r     = Math.sqrt(Math.max(0, radius * radius - y * y));
    const dir   = row % 2 === 0 ? 1 : -1;

    if (r < 0.001) {
      // At the poles, just add a single point
      pts.push(new THREE.Vector3(0, y, 0));
    } else {
      for (let s = 0; s <= segmentsPerCircle; s++) {
        const angle = dir * (s / segmentsPerCircle) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)));
      }
    }
  }
  return pts;
}

// ── NDC target positions for the collect flight path ─────────────────────

const COLLECT_TARGETS: Record<'left' | 'right' | 'buffer', THREE.Vector3> = {
  left:   new THREE.Vector3(-0.85, -0.85, 0.5),
  right:  new THREE.Vector3( 0.85, -0.85, 0.5),
  buffer: new THREE.Vector3( 0.88,  0.88, 0.5),
};

// ── Component ──────────────────────────────────────────────────────────────

export const YarnBall = memo(function YarnBall({
  stackId,
  layerId,
  position,
  size,
  color,
  shape,
  shouldCollect,
  collectTarget,
  isSpawning,
  hasCoin = false,
  textureString,
  onCollected,
  housePart,
  treePart,
  boatPart,
  castlePart,
  rocketPart,
  textureYarn,
}: YarnBallProps) {
  const isCustomPart = !!(housePart || treePart || boatPart || castlePart || rocketPart);
  const groupRef     = useRef<THREE.Group>(null);
  const ballGroupRef = useRef<THREE.Group>(null);
  const fresnelRef   = useRef<THREE.Mesh>(null);
  const threadRef    = useRef<THREE.Mesh>(null);
  const discRef      = useRef<THREE.Mesh>(null);
  const coinRingRef  = useRef<THREE.Mesh>(null);

  const phaseRef      = useRef<CollectPhase>(isSpawning ? 'spawning' : 'idle');
  const phaseStartRef = useRef<number | null>(null);
  const targetPosRef  = useRef(new THREE.Vector3());
  const flyStartRef   = useRef(new THREE.Vector3()); // world position when fly begins
  const doneCalledRef    = useRef(false);
  const threadGeoRef     = useRef<THREE.TubeGeometry | null>(null);
  const coinAnimStartRef = useRef<number | null>(null);
  const coinRotYRef      = useRef(0);

  // Clipping plane — kept permanently on materials; constant is set to
  // a huge value when not clipping so nothing is affected (no blink).
  // Normal (0,-1,0): clips fragments where -y + constant < 0 → y > constant
  // → keeps everything BELOW the threshold, removing from the top down.
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 9999));

  // Full bounding box computed once from the core geometry.
  const boundsRef = useRef({
    top: size, bottom: -size,
    halfW: size,
  });

  // Pre-built zigzag path (local space). Built once after bounds are known.
  const zigzagRef = useRef<THREE.Vector3[]>([]);

  const shouldCollectRef = useRef(shouldCollect);
  const isSpawningRef    = useRef(isSpawning);
  useEffect(() => { shouldCollectRef.current = shouldCollect; }, [shouldCollect]);
  useEffect(() => { isSpawningRef.current    = isSpawning;    }, [isSpawning]);

  const phaseOffset = useMemo(() => phaseOffsetFromId(layerId), [layerId]);

  // ── Ball geometry ─────────────────────────────────────────────────────────
  const ballGeo = useMemo(
    () => rocketPart
      ? createRocketPartGeometry(rocketPart)
      : castlePart
        ? createCastlePartGeometry(castlePart)
        : boatPart
          ? createBoatPartGeometry(boatPart)
          : treePart
            ? createTreePartGeometry(treePart)
            : housePart
              ? createHousePartGeometry(housePart)
              : createYarnBallGeometry({ size, shape, spiralCount: 6, spiralResolution: 80 }),
    [size, shape, housePart, treePart, boatPart, castlePart, rocketPart],
  );

  // Compute bounding box + unravel path (rebuilds when rowHeight changes via debug)
  const zigzagRowHeight = useDebugStore((s) => s.zigzagRowHeight);
  useEffect(() => {
    const geo = ballGeo.coreGeometry;
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      const b = geo.boundingBox;
      const top    = b.max.y;
      const bottom = b.min.y;
      const extX   = b.max.x - b.min.x;
      const extZ   = b.max.z - b.min.z;
      const halfW  = Math.max(extX, extZ) * 0.45;
      boundsRef.current = { top, bottom, halfW };

      const height   = top - bottom;
      const rowCount = Math.max(4, Math.round(height / zigzagRowHeight));

      // Spherical shapes: circular latitude rows from top to bottom
      const isSphere = !isCustomPart && (shape === 'sphere' || shape === 'torus');
      if (isSphere) {
        const radius = Math.max(height, extX, extZ) * 0.5;
        zigzagRef.current = buildSphereUnravelPath(radius, rowCount, 14);
      } else {
        // Flat zigzag — pick axis based on which extent is wider
        const axis = extZ > extX ? 'z' : 'x';
        zigzagRef.current = buildZigzagPath(top, bottom, halfW, rowCount, axis);
      }
    }
  }, [ballGeo, zigzagRowHeight, isCustomPart, shape]);

  // ── Materials ──────────────────────────────────────────────────────────────

  const tex = isCustomPart && textureYarn ? textureYarn : textureString;

  const coreMaterial = useMemo(
    () => {
      const mat = new THREE.MeshStandardMaterial({
        color:          new THREE.Color(color).multiplyScalar(0.48),
        roughness:      0.88,
        metalness:      0.02,
        side:           THREE.DoubleSide,
        clippingPlanes: [clipPlaneRef.current],
      });
      if (isCustomPart && textureYarn) {
        const t = textureYarn.clone();
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2);
        t.needsUpdate = true;
        mat.map = t;
      }
      return mat;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, isCustomPart, textureYarn],
  );

  const spiralMaterial = useMemo(() => {
    const t = tex.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(isCustomPart ? 4 : 16, 2);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map:               t,
      color:             new THREE.Color(color),
      emissive:          new THREE.Color(color),
      emissiveIntensity: 0.38,
      roughness:         isCustomPart ? 0.78 : 0.62,
      metalness:         0.02,
      side:              THREE.DoubleSide,
      clippingPlanes:    [clipPlaneRef.current],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, tex, isCustomPart]);

  const fresnelMaterial = useMemo(() => createFresnelGlowMaterial(color), [color]);

  const threadMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      map:               textureString,
      color:             new THREE.Color(color),
      emissive:          new THREE.Color(color),
      emissiveIntensity: 0.42,
      roughness:         0.55,
      metalness:         0.02,
      transparent:       true,
      depthWrite:        false,
      opacity:           1,
    }),
    [color, textureString],
  );

  // Disc — a small colored circle that flies to the collector / buffer
  const discMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color:             new THREE.Color(color),
      emissive:          new THREE.Color(color),
      emissiveIntensity: 0.5,
      roughness:         0.5,
      metalness:         0.05,
      transparent:       true,
      opacity:           1,
    }),
    [color],
  );

  // Coin — flat metallic disc material; opacity & emissive driven per-frame
  const coinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color:             new THREE.Color('#F5C518'),
      emissive:          new THREE.Color('#E8900A'),
      emissiveIntensity: 1.2,
      metalness:         0.95,
      roughness:         0.08,
      transparent:       true,
      depthWrite:        false,
      opacity:           0,
    }),
    [],
  );

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      ballGeo.dispose();
      coreMaterial.dispose();
      spiralMaterial.dispose();
      fresnelMaterial.dispose();
      discMaterial.dispose();
      threadMaterial.dispose();
      coinMaterial.dispose();
      threadGeoRef.current?.dispose();
    };
  }, [ballGeo, coreMaterial, spiralMaterial, fresnelMaterial, threadMaterial, coinMaterial]);

  // ── userData for raycaster ─────────────────────────────────────────────────
  useEffect(() => {
    if (groupRef.current) {
      (groupRef.current.userData as Record<string, string>).stackId = stackId;
      (groupRef.current.userData as Record<string, string>).layerId = layerId;
    }
  }, [stackId, layerId]);

  // ── Start collect animation ────────────────────────────────────────────────
  useEffect(() => {
    if (shouldCollect && phaseRef.current === 'idle') {
      phaseRef.current = 'unravel';
      phaseStartRef.current = null;
    }
  }, [shouldCollect]);

  // ── Start spawn animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (isSpawning && phaseRef.current === 'idle') {
      phaseRef.current = 'spawning';
      phaseStartRef.current = null;
    }
  }, [isSpawning]);

  // ── Per-frame animation ────────────────────────────────────────────────────
  useFrame(({ clock, camera }, delta) => {
    const group     = groupRef.current;
    const ballGroup = ballGroupRef.current;
    const thread    = threadRef.current;
    if (!group || !ballGroup || !thread) return;

    const t     = clock.getElapsedTime();
    const phase = phaseRef.current;

    // Capture phase-start time; compute world target on collect start.
    if (phase !== 'idle' && phase !== 'done' && phaseStartRef.current === null) {
      phaseStartRef.current = t;
      if (phase === 'unravel') {
        const ndcTarget = COLLECT_TARGETS[collectTarget];
        targetPosRef.current.copy(ndcTarget.clone().unproject(camera));
      }
    }

    // Read debug values once per frame (getState avoids re-render subscriptions)
    const dbg = useDebugStore.getState();

    // ── Live color update from debug panel ──────────────────────────────────
    // Map the original house hex to the debug-panel override so tweaking
    // colors in the GUI is reflected in real-time.
    const COLOR_MAP: Record<string, string> = {
      '#7EC8E3': dbg.houseBlue,
      '#A8D5A2': dbg.houseGreen,
      '#F4B183': dbg.houseOrange,
    };
    const liveColor = COLOR_MAP[color] ?? color;
    const liveC = new THREE.Color(liveColor);
    coreMaterial.color.copy(liveC).multiplyScalar(dbg.coreColorMultiplier);
    spiralMaterial.color.copy(liveC);
    spiralMaterial.emissive.copy(liveC);
    spiralMaterial.emissiveIntensity = dbg.emissiveIntensity;
    spiralMaterial.roughness = dbg.materialRoughness;
    spiralMaterial.metalness = dbg.materialMetalness;
    coreMaterial.roughness = dbg.materialRoughness + 0.1;
    coreMaterial.metalness = dbg.materialMetalness;

    // ── SPAWNING ─────────────────────────────────────────────────────────────
    if (phase === 'spawning') {
      const DURATION = dbg.spawnDuration;
      const elapsed  = t - (phaseStartRef.current ?? t);
      const progress = Math.min(elapsed / DURATION, 1);
      const sc       = bounceOut(progress);

      // Clip plane far away — no clipping
      clipPlaneRef.current.constant = 9999;

      group.visible     = true;
      ballGroup.visible = true;
      thread.visible    = false;
      if (fresnelRef.current) fresnelRef.current.visible = true;

      group.position.set(...position);
      group.scale.setScalar(sc);
      (fresnelMaterial.uniforms.opacity   as THREE.IUniform<number>).value = sc;
      (fresnelMaterial.uniforms.intensity as THREE.IUniform<number>).value = 1.0;

      if (progress >= 1) {
        group.scale.setScalar(1);
        phaseRef.current = 'idle';
        phaseStartRef.current = null;
      }
      return;
    }

    // ── IDLE ─────────────────────────────────────────────────────────────────
    if (phase === 'idle') {
      // Clip plane far away — no clipping
      clipPlaneRef.current.constant = 9999;

      group.visible     = true;
      ballGroup.visible = true;
      thread.visible    = false;
      if (fresnelRef.current) fresnelRef.current.visible = !isCustomPart;

      if (isCustomPart) {
        group.position.set(position[0], position[1], position[2]);
        group.rotation.set(0, 0, 0);
      } else {
        const bobY = Math.sin(t * 1.3 + phaseOffset) * 0.06;
        group.position.set(position[0], position[1] + bobY, position[2]);
        group.rotation.y = t * 0.4 + phaseOffset;
        group.rotation.z = 0;
        group.rotation.x = 0;
      }
      group.scale.setScalar(1);
      ballGroup.scale.setScalar(1);
      ballGroup.rotation.set(0, 0, 0);

      const fresnelPulse = 0.85 + Math.sin(t * 2.2 + phaseOffset) * 0.18;
      (fresnelMaterial.uniforms.intensity as THREE.IUniform<number>).value = fresnelPulse;
      (fresnelMaterial.uniforms.opacity   as THREE.IUniform<number>).value = 1;

      coreMaterial.transparent   = false;
      coreMaterial.depthWrite    = true;
      coreMaterial.opacity       = 1;
      spiralMaterial.transparent = false;
      spiralMaterial.depthWrite  = true;
      spiralMaterial.opacity     = 1;

      // Coin hidden before collection — only revealed on collect animation
      if (coinRingRef.current) coinRingRef.current.visible = false;
      return;
    }

    // ── Coin collection animation — appear above ball, spin, fade out ──────
    if (coinRingRef.current && hasCoin) {
      if (coinAnimStartRef.current === null) coinAnimStartRef.current = t;
      const cp = Math.min((t - coinAnimStartRef.current) / dbg.coinDuration, 1);

      if (cp < 1) {
        coinRingRef.current.visible = true;

        // Stay above the ball, drift upward slowly
        coinRingRef.current.position.set(0, size + 0.2 + cp * 0.15, 0);

        // Gentle spin
        coinRingRef.current.rotation.x = Math.PI * 0.5;
        coinRotYRef.current += dbg.coinSpinStart * delta;
        coinRingRef.current.rotation.y = coinRotYRef.current;

        // Fade out
        coinMaterial.opacity = 1 - cp;
      } else {
        coinRingRef.current.visible = false;
        coinAnimStartRef.current = null;
        coinRotYRef.current = 0;
      }
    } else if (coinRingRef.current) {
      coinRingRef.current.visible = false;
    }

    // ── UNRAVEL ──────────────────────────────────────────────────────────────
    //
    // A visible thread traces a zigzag path from the top to the bottom of the
    // piece (like a single string being pulled out row by row).  The clipping
    // plane follows the thread's Y position so the geometry dissolves exactly
    // where the thread has already passed.
    //
    if (phase === 'unravel') {
      const DURATION = dbg.unravelDuration;
      const elapsed  = t - (phaseStartRef.current ?? t);
      const progress = Math.min(elapsed / DURATION, 1);

      group.position.set(...position);
      group.scale.setScalar(1);
      group.rotation.set(0, 0, 0);

      ballGroup.visible = true;
      ballGroup.scale.setScalar(1);
      ballGroup.rotation.set(0, 0, 0);
      if (fresnelRef.current) fresnelRef.current.visible = false;

      // -- Build partial zigzag thread up to current progress --
      const zigzag = zigzagRef.current;
      if (zigzag.length >= 2) {
        thread.visible = true;

        // Total path length (sum of segment distances)
        let totalLen = 0;
        const segLens: number[] = [];
        for (let i = 1; i < zigzag.length; i++) {
          const d = zigzag[i].distanceTo(zigzag[i - 1]);
          segLens.push(d);
          totalLen += d;
        }

        // Find how far along the path we are
        const targetLen = progress * totalLen;
        let accum   = 0;
        const partialPts: THREE.Vector3[] = [zigzag[0].clone()];
        let currentY = zigzag[0].y;

        for (let i = 0; i < segLens.length; i++) {
          const segLen = segLens[i];
          if (accum + segLen <= targetLen) {
            partialPts.push(zigzag[i + 1].clone());
            currentY = zigzag[i + 1].y;
            accum += segLen;
          } else {
            // Interpolate within this segment
            const frac = (targetLen - accum) / segLen;
            const interp = zigzag[i].clone().lerp(zigzag[i + 1], frac);
            partialPts.push(interp);
            currentY = interp.y;
            break;
          }
        }

        // Build tube from the partial path
        if (partialPts.length >= 2) {
          const curve  = new THREE.CatmullRomCurve3(partialPts);
          const newGeo = new THREE.TubeGeometry(
            curve,
            Math.max(partialPts.length * 3, 8),
            size * dbg.threadRadius,
            5,
            false,
          );
          threadGeoRef.current?.dispose();
          threadGeoRef.current = newGeo;
          (thread as THREE.Mesh).geometry = newGeo;
        }

        // Clip plane follows the thread — everything above currentY is removed.
        // With normal (0,-1,0): keeps y < constant, so constant = worldClipY.
        const worldClipY = position[1] + currentY;
        clipPlaneRef.current.constant = worldClipY;

        threadMaterial.opacity = 1;
      }

      if (progress >= 1) {
        ballGroup.visible = false;
        // Push clip plane far down so nothing remains
        clipPlaneRef.current.constant = 9999;
        phaseRef.current = 'travel';
        phaseStartRef.current = null;
      }
      return;
    }

    // ── TRAVEL — gather the unraveled thread into a yarn ball ──────────────
    //
    // The zigzag thread morphs into a spherical winding: each point lerps
    // from its zigzag position toward a loxodrome (spiral on a sphere).
    // The ball spins while forming, then fades out once complete.
    //
    if (phase === 'travel') {
      const DURATION = dbg.travelDuration;
      const elapsed  = t - (phaseStartRef.current ?? t);
      const progress = Math.min(elapsed / DURATION, 1);

      clipPlaneRef.current.constant = 9999;

      group.position.set(...position);
      group.scale.setScalar(1);
      ballGroup.visible = false;
      thread.visible    = true;
      if (fresnelRef.current) fresnelRef.current.visible = false;

      // Spin the group while gathering
      group.rotation.set(0, progress * Math.PI * 2 * dbg.spindleTurns, 0);

      // Build the gathering geometry: lerp zigzag points → ball winding
      const zigzag = zigzagRef.current;
      if (zigzag.length >= 2) {
        const { top, bottom } = boundsRef.current;
        const height  = top - bottom;
        const ballR   = Math.min(height * 0.3, size * 0.8); // target ball radius
        const nPts    = zigzag.length;
        const gather  = progress < 0.7 ? progress / 0.7 : 1; // gather in first 70%
        const fade    = progress > 0.6 ? (progress - 0.6) / 0.4 : 0; // fade last 40%

        const gathered: THREE.Vector3[] = [];
        for (let i = 0; i < nPts; i++) {
          const frac = i / (nPts - 1);
          // Loxodrome (spiral on sphere) target position
          const theta = Math.PI * frac;                       // pole to pole
          const phi   = dbg.spindleTurns * 2 * Math.PI * frac; // winds around
          const tx = ballR * Math.sin(theta) * Math.cos(phi);
          const ty = ballR * Math.cos(theta);
          const tz = ballR * Math.sin(theta) * Math.sin(phi);
          const target = new THREE.Vector3(tx, ty, tz);

          // Lerp from zigzag position toward the ball winding
          gathered.push(zigzag[i].clone().lerp(target, gather));
        }

        const curve  = new THREE.CatmullRomCurve3(gathered);
        const newGeo = new THREE.TubeGeometry(
          curve, Math.max(nPts * 2, 16), size * dbg.threadRadius, 5, false,
        );
        threadGeoRef.current?.dispose();
        threadGeoRef.current = newGeo;
        (thread as THREE.Mesh).geometry = newGeo;

        threadMaterial.opacity = 1 - fade;
      }

      if (progress >= 1) {
        // Transition to fly — disc flies to collector / buffer
        thread.visible = false;
        flyStartRef.current.set(...position);
        // Re-compute world target for fly (camera may have moved since unravel)
        const ndcTarget = COLLECT_TARGETS[collectTarget];
        targetPosRef.current.copy(ndcTarget.clone().unproject(camera));
        phaseRef.current = 'fly';
        phaseStartRef.current = null;
      }
      return;
    }

    // ── FLY — colour disc arcs to collector or buffer ────────────────────────
    //
    // A small coloured disc (representing the gathered yarn) flies from the
    // ball position to the matching collector (left / right) or to the
    // buffer stack if the colour was wrong.
    //
    if (phase === 'fly') {
      const DURATION = dbg.flyDuration;
      const elapsed  = t - (phaseStartRef.current ?? t);
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out for a snappy arc that decelerates into the target
      const eased    = 1 - Math.pow(1 - progress, 3);

      clipPlaneRef.current.constant = 9999;
      ballGroup.visible = false;
      thread.visible    = false;
      if (fresnelRef.current) fresnelRef.current.visible = false;

      const disc = discRef.current;
      if (disc) {
        disc.visible = true;

        // Arc from ball position to unproject target (world space)
        const start  = flyStartRef.current;
        const end    = targetPosRef.current;
        const lerpPos = start.clone().lerp(end, eased);
        // Add an upward arc
        const arcPeak = start.clone().lerp(end, 0.5).y
          + start.distanceTo(end) * dbg.arcHeight;
        lerpPos.y += (arcPeak - lerpPos.y) * Math.sin(eased * Math.PI) * 0.5;

        // Position disc in world space — remove group offset
        disc.position.set(
          lerpPos.x - position[0],
          lerpPos.y - position[1],
          lerpPos.z - position[2],
        );

        // Spin the disc while flying
        disc.rotation.y = progress * Math.PI * 4;

        // Scale: start at 1, slight grow mid-flight, shrink at end
        const s = 1 + 0.2 * Math.sin(progress * Math.PI) - progress * 0.3;
        disc.scale.setScalar(Math.max(0.1, s));

        discMaterial.opacity = progress < 0.85 ? 1 : 1 - (progress - 0.85) / 0.15;
      }

      // Keep group at original position (disc handles its own offset)
      group.position.set(...position);
      group.scale.setScalar(1);
      group.rotation.set(0, 0, 0);

      if (progress >= 1) {
        phaseRef.current = 'done';
        group.visible = false;
        if (!doneCalledRef.current) {
          doneCalledRef.current = true;
          onCollected(stackId, layerId);
        }
      }
      return;
    }

    // ── DONE ──────────────────────────────────────────────────────────────────
    if (phase === 'done') {
      group.visible = false;
    }
  });

  const { coreGeometry, spiralGeometries } = ballGeo;
  const fresnelRadius = size * 1.08;

  return (
    <group ref={groupRef} position={position} renderOrder={1}>
      <group ref={ballGroupRef}>
        <mesh geometry={coreGeometry} material={coreMaterial} />
        {spiralGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo} material={spiralMaterial} />
        ))}
      </group>

      {!isCustomPart && (
        <mesh ref={fresnelRef} renderOrder={2}>
          <sphereGeometry args={[fresnelRadius, 20, 20]} />
          <primitive object={fresnelMaterial} attach="material" />
        </mesh>
      )}

      <mesh ref={threadRef} material={threadMaterial} visible={false} renderOrder={2} />

      {/* Colour disc — flies to collector / buffer after yarn gathers */}
      <mesh ref={discRef} material={discMaterial} visible={false} renderOrder={3}>
        <cylinderGeometry args={[size * 0.45, size * 0.45, size * 0.12, 24]} />
      </mesh>

      {/* Coin disc — hidden until collected, then animated fly to CoinDisplay */}
      {hasCoin && (
        <mesh ref={coinRingRef} renderOrder={4} visible={false}>
          <cylinderGeometry args={[size * 0.32, size * 0.32, size * 0.06, 24]} />
          <primitive object={coinMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
});
