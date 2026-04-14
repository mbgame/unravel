/**
 * ZoomSlider — vertical draggable slider on the left edge of the screen.
 * Dragging up zooms in, dragging down zooms out.
 * Writes to uiStore.zoom (range -1 to +1, 0 = default).
 */

'use client';

import React, { useRef, useCallback, useEffect, memo } from 'react';
import { useUiStore } from '../../../stores/uiStore';
import { useYarnGameStore } from '../../../stores/yarnGameStore';

const TRACK_HEIGHT = 140;
const THUMB_SIZE = 28;

export const ZoomSlider = memo(function ZoomSlider() {
  const phase = useYarnGameStore((s) => s.phase);
  const zoom = useUiStore((s) => s.zoom);
  const setZoom = useUiStore((s) => s.setZoom);

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateZoomFromY = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // top of track = zoom in (+1), bottom = zoom out (-1)
      const ratio = (clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ratio));
      const value = 1 - clamped * 2; // 0 → +1, 0.5 → 0, 1 → -1
      setZoom(value);
    },
    [setZoom],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      updateZoomFromY(e.clientY);
    },
    [updateZoomFromY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      updateZoomFromY(e.clientY);
    },
    [updateZoomFromY],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Reset zoom when level resets
  useEffect(() => {
    if (phase === 'idle') setZoom(0);
  }, [phase, setZoom]);

  if (phase !== 'playing' && phase !== 'lost') return null;

  // Thumb position: zoom +1 → top (0%), zoom -1 → bottom (100%)
  const thumbPct = ((1 - zoom) / 2) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: 'clamp(0.4rem, 1.5vw, 0.75rem)',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        zIndex: 10,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* + label */}
      <div
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: '#555',
          fontFamily: 'sans-serif',
          background: 'rgba(255,255,255,0.75)',
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.10)',
          cursor: 'pointer',
        }}
        onClick={() => setZoom(Math.min(1, zoom + 0.2))}
        role="button"
        aria-label="Zoom in"
      >
        +
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          width: 6,
          height: TRACK_HEIGHT,
          background: 'rgba(255,255,255,0.65)',
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.10)',
          cursor: 'pointer',
          touchAction: 'none',
        }}
        role="slider"
        aria-label="Zoom"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={Math.round(zoom * 100) / 100}
        aria-orientation="vertical"
      >
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${thumbPct}%`,
            transform: 'translate(-50%, -50%)',
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: '2px solid rgba(0,0,0,0.18)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'grab',
            touchAction: 'none',
          }}
        />
      </div>

      {/* - label */}
      <div
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          fontWeight: 800,
          color: '#555',
          fontFamily: 'sans-serif',
          background: 'rgba(255,255,255,0.75)',
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.10)',
          cursor: 'pointer',
        }}
        onClick={() => setZoom(Math.max(-1, zoom - 0.2))}
        role="button"
        aria-label="Zoom out"
      >
        -
      </div>
    </div>
  );
});
