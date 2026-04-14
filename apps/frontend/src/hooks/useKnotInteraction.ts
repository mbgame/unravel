/**
 * Knot interaction hook — handles touch/pointer events for:
 * - Single touch: rotate the knot (quaternion-based with inertia)
 * - Two-finger pinch: zoom (scale clamped 0.5–2.0)
 * - Tap (< 150ms): raycast for node/string selection
 *
 * Must be used inside a component that is a descendant of the R3F Canvas.
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKnotStore } from '../stores/knotStore';
import { useGameStore } from '../stores/gameStore';
import {
  INERTIA_DECAY,
  ZOOM_MIN,
  ZOOM_MAX,
  TAP_DURATION_MS,
} from '../constants/game.constants';

/** Reference to the Group that wraps the knot mesh. */
export interface KnotInteractionRef {
  group: THREE.Group | null;
}

/** Internal state for a single active pointer. */
interface PointerState {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

/**
 * Attaches pointer/touch event listeners to the canvas and manages
 * knot rotation, zoom, selection, and inertia.
 *
 * @param knotGroupRef - Ref pointing to the Three.js Group for the knot mesh
 * @returns Object with current scale value for external use
 */
export function useKnotInteraction(knotGroupRef: React.RefObject<THREE.Group | null>) {
  const { gl, camera, raycaster, scene } = useThree();
  const selectNode = useKnotStore((s) => s.selectNode);
  const collectNode = useKnotStore((s) => s.collectNode);
  const phase = useGameStore((s) => s.phase);

  // Pointer tracking
  const pointersRef = useRef<Map<number, PointerState>>(new Map());

  // Rotation inertia
  const angularVelocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Zoom / scale
  const scaleRef = useRef<number>(1.0);
  const prevPinchDistRef = useRef<number | null>(null);

  /** Compute distance between two pointers. */
  const getPinchDistance = useCallback(
    (p1: PointerState, p2: PointerState): number => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    [],
  );

  /** Perform a raycast at normalized device coordinates and collect the hit node. */
  const performRaycast = useCallback(
    (clientX: number, clientY: number): void => {
      if (!knotGroupRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(knotGroupRef.current.children, true);

      if (hits.length > 0) {
        const hitObj = hits[0].object;
        // Nodes store their ID in userData.nodeId (cleared once collected)
        const nodeId: string | undefined = (hitObj.userData as { nodeId?: string }).nodeId;
        if (nodeId) {
          collectNode(nodeId);
        }
      } else {
        selectNode(null);
      }
    },
    [gl, camera, raycaster, knotGroupRef, collectNode, selectNode],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent): void => {
      if (phase !== 'PLAYING') return;
      e.preventDefault();

      pointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now(),
      });

      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
      angularVelocityRef.current.set(0, 0);
    },
    [phase],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent): void => {
      if (!isDraggingRef.current || phase !== 'PLAYING') return;
      e.preventDefault();

      const pointer = pointersRef.current.get(e.pointerId);
      if (!pointer) return;

      pointer.x = e.clientX;
      pointer.y = e.clientY;

      const pointerList = Array.from(pointersRef.current.values());

      if (pointerList.length === 2) {
        // Pinch-to-zoom
        const dist = getPinchDistance(pointerList[0], pointerList[1]);
        if (prevPinchDistRef.current !== null) {
          const ratio = dist / prevPinchDistRef.current;
          scaleRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scaleRef.current * ratio));
        }
        prevPinchDistRef.current = dist;
        prevPointerRef.current = null;
      } else if (pointerList.length === 1) {
        // Single-pointer rotation
        if (prevPointerRef.current && knotGroupRef.current) {
          const dx = e.clientX - prevPointerRef.current.x;
          const dy = e.clientY - prevPointerRef.current.y;
          const sensitivity = 0.005;

          angularVelocityRef.current.set(dx * sensitivity, dy * sensitivity);

          const euler = new THREE.Euler(
            dy * sensitivity,
            dx * sensitivity,
            0,
            'XYZ',
          );
          const qDelta = new THREE.Quaternion().setFromEuler(euler);
          knotGroupRef.current.quaternion.premultiply(qDelta);
        }
        prevPointerRef.current = { x: e.clientX, y: e.clientY };
        prevPinchDistRef.current = null;
      }
    },
    [phase, getPinchDistance, knotGroupRef],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent): void => {
      const pointer = pointersRef.current.get(e.pointerId);
      if (pointer) {
        const elapsed = performance.now() - pointer.startTime;
        if (elapsed < TAP_DURATION_MS && pointersRef.current.size === 1) {
          performRaycast(e.clientX, e.clientY);
        }
        pointersRef.current.delete(e.pointerId);
      }

      if (pointersRef.current.size === 0) {
        isDraggingRef.current = false;
        prevPointerRef.current = null;
        prevPinchDistRef.current = null;
      }
    },
    [performRaycast],
  );

  const onPointerCancel = useCallback((e: PointerEvent): void => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      isDraggingRef.current = false;
      prevPointerRef.current = null;
      prevPinchDistRef.current = null;
    }
  }, []);

  // Register pointer event listeners on the canvas
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    // Prevent default scrolling on canvas touch
    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp, onPointerCancel]);

  // Apply inertia decay and scale on each frame
  useFrame(() => {
    if (!knotGroupRef.current) return;

    // Apply scale
    knotGroupRef.current.scale.setScalar(scaleRef.current);

    // Apply rotational inertia when not dragging
    if (!isDraggingRef.current) {
      const vel = angularVelocityRef.current;
      if (vel.lengthSq() > 0.000001) {
        const euler = new THREE.Euler(vel.y, vel.x, 0, 'XYZ');
        const qDelta = new THREE.Quaternion().setFromEuler(euler);
        knotGroupRef.current.quaternion.premultiply(qDelta);
        vel.multiplyScalar(INERTIA_DECAY);
      }
    }
  });

  return { scale: scaleRef };
}
