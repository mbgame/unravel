/**
 * YarnBallGenerator — spawns yarn-ball stacks and implements the game mechanics.
 *
 * Mechanics:
 *   • Each formation position is a STACK of 1–3 balls (depth scales with level).
 *   • Only the outermost ball (layers[0]) is visible and tappable.
 *   • Two colour collectors (left + right) each accept 3 balls of their colour.
 *   • Tapping a ball whose colour matches a collector → ball flies to that collector.
 *   • Tapping a ball whose colour matches neither collector → ball goes to the
 *     BUFFER STACK (top-right HUD, up to 5 slots).
 *   • When a collector's colour changes, any buffered balls of the new colour are
 *     automatically released to that collector (auto-collect).
 *   • 5 buffer balls → lost; all balls cleared → won.
 *
 * Touch accuracy fix:
 *   Centralised raycasting via pointerdown/pointerup on the canvas element.
 *   Only the geometrically nearest intersected ball group is processed.
 *   A tap is distinguished from a drag by elapsed time (< 220 ms) and
 *   distance moved (< 14 px).
 */

'use client';

import React, {
  useState, useCallback, useEffect, useMemo, useRef, memo,
} from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { YarnBall } from './YarnBall';
import { generateLevel, countRemainingColors, pickNextColor } from '../../../lib/game/levelGenerator';
import { STRING_TEXTURE_URL, KNIT_TEXTURE_URLS } from '../../../lib/three/yarnTexture';
import { YarnShape } from '../../../lib/three/yarnBallGeometry';
import type { HousePartType } from '../../../lib/three/yarnHouseGeometry';
import type { TreePartType } from '../../../lib/three/yarnTreeGeometry';
import type { BoatPartType } from '../../../lib/three/yarnBoatGeometry';
import type { CastlePartType } from '../../../lib/three/yarnCastleGeometry';
import type { RocketPartType } from '../../../lib/three/yarnRocketGeometry';
import { useYarnGameStore } from '../../../stores/yarnGameStore';

/** Simple hash from string to unsigned int. */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return hash >>> 0;
}

/** Deterministically map a stackId to one of the 5 yarn shapes. */
const SHAPES: YarnShape[] = ['sphere', 'cone', 'cylinder', 'box', 'torus'];
function shapeFromStackId(id: string): YarnShape {
  return SHAPES[hashId(id) % SHAPES.length];
}

/** Deterministically pick a knit texture index for a stack. */
function knitIndexFromStackId(id: string): number {
  return hashId(id) % KNIT_TEXTURE_URLS.length;
}

export interface YarnBallGeneratorProps {
  levelNumber?: number;
}

// ── Internal state types ───────────────────────────────────────────────────

interface ActiveLayer {
  layerId:       string;
  color:         string;
  size:          number;
  hasCoin:       boolean;
  shouldCollect: boolean;
  collectTarget: 'left' | 'right' | 'buffer';
  isSpawning:    boolean;
}

interface ActiveStack {
  stackId:    string;
  position:   [number, number, number];
  shape?:     YarnShape;
  housePart?: HousePartType;
  treePart?:  TreePartType;
  boatPart?:    BoatPartType;
  castlePart?:  CastlePartType;
  rocketPart?:  RocketPartType;
  layers:       ActiveLayer[];
}

// ── Component ──────────────────────────────────────────────────────────────

export const YarnBallGenerator = memo(function YarnBallGenerator({
  levelNumber = 1,
}: YarnBallGeneratorProps) {
  const levelData = useMemo(() => generateLevel(levelNumber), [levelNumber]);

  // Textures shared by all balls (cached by URL in drei)
  const stringTexture = useTexture(STRING_TEXTURE_URL) as THREE.Texture;
  const knitTextures = useTexture(KNIT_TEXTURE_URLS as unknown as string[]) as THREE.Texture[];

  // ── Initialise store on mount ─────────────────────────────────────────────
  useEffect(() => {
    const outerCounts = new Map<string, number>();
    for (const stack of levelData.stacks) {
      const c = stack.layers[0]?.color;
      if (c) outerCounts.set(c, (outerCounts.get(c) ?? 0) + 1);
    }
    const sorted = [...outerCounts.entries()].sort((a, b) => b[1] - a[1]);
    const color1 = sorted[0]?.[0] ?? '#E63946';
    const color2 = sorted[1]?.[0] ?? sorted[0]?.[0] ?? '#3A86FF';

    useYarnGameStore.getState().initLevel(
      levelData.levelNumber,
      levelData.formationName,
      levelData.totalBalls,
      color1,
      color2,
    );
  }, [levelData]);

  // ── Active stacks list ────────────────────────────────────────────────────
  const [activeStacks, setActiveStacks] = useState<ActiveStack[]>(() =>
    levelData.stacks.map((s) => ({
      stackId:   s.stackId,
      position:  s.position,
      shape:     s.shape,
      housePart: s.housePart,
      treePart:  s.treePart,
      boatPart:    s.boatPart,
      castlePart:  s.castlePart,
      rocketPart:  s.rocketPart,
      layers:      s.layers.map((l) => ({
        layerId:       l.id,
        color:         l.color,
        size:          l.size,
        hasCoin:       l.hasCoin ?? false,
        shouldCollect: false,
        collectTarget: 'left' as const,
        isSpawning:    false,
      })),
    })),
  );

  // Stable ref so callbacks always see the latest stacks without stale closures
  const activeStacksRef = useRef(activeStacks);
  useEffect(() => { activeStacksRef.current = activeStacks; }, [activeStacks]);

  // ── Three.js context for manual raycasting ────────────────────────────────
  const { camera, raycaster, gl } = useThree();
  const groupRef       = useRef<THREE.Group>(null);
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(null);

  // ── Auto-release buffer balls when a collector colour changes ─────────────
  //
  // Called after clearCollector(side, newColor).  Removes all buffered balls
  // of `newColor` and feeds them into the collector one-by-one.  If the
  // collector fills (count reaches 3) mid-release, picks the next colour,
  // clears the collector, then continues releasing any newly-matching buffer
  // balls (handles the cascade naturally via the `released` counter).
  const autoReleaseBuffer = useCallback((
    newColor: string | null,
    side: 'left' | 'right',
  ) => {
    if (!newColor) return;

    let released = useYarnGameStore.getState().releaseFromBuffer(newColor);
    if (released === 0) return;

    while (released > 0) {
      const { phase } = useYarnGameStore.getState();
      if (phase !== 'playing') break;

      const filled = useYarnGameStore.getState().addToCollector(side);
      useYarnGameStore.getState().clearBalls(1);
      released--;

      if (filled) {
        // Collector just filled from buffer — pick the next colour.
        const stacks    = activeStacksRef.current;
        const remaining = countRemainingColors(stacks);

        // Include still-buffered balls so the next colour accounts for them.
        const { bufferStack } = useYarnGameStore.getState();
        for (const b of bufferStack) {
          remaining.set(b.color, (remaining.get(b.color) ?? 0) + 1);
        }

        const otherSide   = side === 'left' ? 'right' : 'left';
        const otherColor  = useYarnGameStore.getState()[
          otherSide === 'left' ? 'leftCollector' : 'rightCollector'
        ].color;
        const nextColor = pickNextColor(remaining, otherColor);
        useYarnGameStore.getState().clearCollector(side, nextColor);

        // Cascade: release buffer balls of the newly assigned colour.
        if (nextColor) {
          const more = useYarnGameStore.getState().releaseFromBuffer(nextColor);
          released += more;
        }
      }
    }
  }, []); // uses only refs + getState()

  // ── Handle a confirmed tap on a stack ─────────────────────────────────────
  const handleStackTap = useCallback((stackId: string) => {
    const { phase, leftCollector, rightCollector } = useYarnGameStore.getState();
    if (phase !== 'playing') return;

    setActiveStacks((prev) => {
      const stack = prev.find((s) => s.stackId === stackId);
      if (!stack || stack.layers.length === 0) return prev;

      const top = stack.layers[0];
      if (top.shouldCollect) return prev;

      let target: 'left' | 'right' | 'buffer';
      if (top.color === leftCollector.color)       target = 'left';
      else if (top.color === rightCollector.color) target = 'right';
      else                                         target = 'buffer';

      return prev.map((s) =>
        s.stackId !== stackId
          ? s
          : {
              ...s,
              layers: s.layers.map((l, i) =>
                i === 0 ? { ...l, shouldCollect: true, collectTarget: target } : l,
              ),
            },
      );
    });
  }, []);

  // ── Handle animation completion for a collected layer ─────────────────────
  const handleLayerCollected = useCallback((stackId: string, layerId: string) => {
    const store = useYarnGameStore.getState();
    if (store.phase !== 'playing' && store.phase !== 'won') return;

    // Capture target BEFORE removing the layer from active stacks
    const stack = activeStacksRef.current.find((s) => s.stackId === stackId);
    const layer = stack?.layers.find((l) => l.layerId === layerId);
    if (!layer) return;

    const { collectTarget, color, hasCoin } = layer;

    // Award coin if this ball carried one
    if (hasCoin) {
      useYarnGameStore.getState().addCoin();
    }

    // Remove the collected layer; reveal next inner ball with spawn animation
    setActiveStacks((prev) =>
      prev.map((s) => {
        if (s.stackId !== stackId) return s;
        const newLayers = s.layers.slice(1).map((l, i) =>
          i === 0 ? { ...l, isSpawning: true, shouldCollect: false } : l,
        );
        return { ...s, layers: newLayers };
      }),
    );
    // Drop stacks that are now empty
    setActiveStacks((prev) => prev.filter((s) => s.layers.length > 0));

    if (collectTarget === 'buffer') {
      // Wrong colour — send to buffer stack
      store.addToBuffer(layerId, color);
    } else {
      // Correct colour — send to the matching collector
      const filled = store.addToCollector(collectTarget);
      store.clearBalls(1);

      if (filled) {
        // Use setTimeout(0) so the activeStacksRef reflects the updated stacks
        // from the two setActiveStacks calls above before we scan for colours.
        setTimeout(() => {
          const stacks    = activeStacksRef.current;
          const remaining = countRemainingColors(stacks);

          // Include buffered balls in colour priority
          const { bufferStack } = useYarnGameStore.getState();
          for (const b of bufferStack) {
            remaining.set(b.color, (remaining.get(b.color) ?? 0) + 1);
          }

          const otherSide  = collectTarget === 'left' ? 'right' : 'left';
          const otherColor = useYarnGameStore.getState()[
            otherSide === 'left' ? 'leftCollector' : 'rightCollector'
          ].color;
          const nextColor = pickNextColor(remaining, otherColor);
          useYarnGameStore.getState().clearCollector(collectTarget, nextColor);

          // Auto-release buffered balls that match the new collector colour
          autoReleaseBuffer(nextColor, collectTarget);
        }, 0);
      }
    }
  }, [autoReleaseBuffer]);

  // ── Centralised pointer handling ──────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e: PointerEvent) => {
      pointerDownRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };

    const onUp = (e: PointerEvent) => {
      const down = pointerDownRef.current;
      if (!down) return;
      const elapsed = performance.now() - down.t;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const moved = Math.sqrt(dx * dx + dy * dy);
      if (elapsed < 220 && moved < 14) {
        processTap(down.x, down.y, canvas);
      }
      pointerDownRef.current = null;
    };

    canvas.addEventListener('pointerdown', onDown, { passive: true });
    canvas.addEventListener('pointerup',   onUp,   { passive: true });
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup',   onUp);
    };
  }, [gl.domElement]); // eslint-disable-line react-hooks/exhaustive-deps

  function processTap(clientX: number, clientY: number, canvas: HTMLElement) {
    const rect = canvas.getBoundingClientRect();
    const ndc  = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  *  2 - 1,
      ((clientY - rect.top)  / rect.height) * -2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);

    const group = groupRef.current;
    if (!group) return;

    const hits = raycaster.intersectObjects(group.children, true);
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const sid = (obj.userData as Record<string, unknown>).stackId as string | undefined;
        if (sid) {
          handleStackTap(sid);
          return;
        }
        obj = obj.parent;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <group ref={groupRef}>
      {activeStacks.map((stack) => {
        const topLayer = stack.layers[0];
        if (!topLayer) return null;
        return (
          <YarnBall
            key={`${stack.stackId}-${topLayer.layerId}`}
            stackId={stack.stackId}
            layerId={topLayer.layerId}
            position={stack.position}
            size={topLayer.size}
            color={topLayer.color}
            shape={stack.shape ?? shapeFromStackId(stack.stackId)}
            shouldCollect={topLayer.shouldCollect}
            collectTarget={topLayer.collectTarget}
            isSpawning={topLayer.isSpawning}
            hasCoin={topLayer.hasCoin}
            textureString={stringTexture}
            onCollected={handleLayerCollected}
            housePart={stack.housePart}
            treePart={stack.treePart}
            boatPart={stack.boatPart}
            castlePart={stack.castlePart}
            rocketPart={stack.rocketPart}
            textureYarn={knitTextures[knitIndexFromStackId(stack.stackId)]}
          />
        );
      })}
    </group>
  );
});
