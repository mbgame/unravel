'use client';

import React, { memo } from 'react';
import { useYarnGameStore } from '../../../stores/yarnGameStore';

/**
 * TargetColorDisplay — top-center HUD showing overall level progress.
 *
 * Shows: cleared / total balls as a pill + thin progress bar.
 * Kept minimal so it doesn't distract from the 3-D scene.
 */
export const TargetColorDisplay = memo(function TargetColorDisplay() {
  const phase = useYarnGameStore((s) => s.phase);
  const clearedBalls = useYarnGameStore((s) => s.clearedBalls);
  const totalBalls = useYarnGameStore((s) => s.totalBalls);
  const formationName = useYarnGameStore((s) => s.formationName);
  const levelNumber = useYarnGameStore((s) => s.levelNumber);

  if (phase === 'idle' || phase === 'won') return null;

  const pct = totalBalls > 0 ? clearedBalls / totalBalls : 0;
  const pctDisplay = Math.round(pct * 100);

  return (
    <div
      style={{
        position: 'absolute',
        top: 'clamp(0.6rem, 2.5vw, 1rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 10,
        maxWidth: 'calc(100vw - 9rem)',
        minWidth: 'clamp(8rem, 30vw, 14rem)',
      }}
      aria-label={`Level ${levelNumber}: ${clearedBalls} of ${totalBalls} balls cleared`}
    >
      {/* Progress pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255,255,255,0.80)',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: '2rem',
          padding: 'clamp(0.25rem, 1.2vw, 0.38rem) clamp(0.65rem, 3vw, 1rem)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize: 'clamp(0.68rem, 2.6vw, 0.82rem)',
            fontWeight: 700,
            color: '#333',
          }}
        >
          Level {levelNumber}
        </span>
        <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.7em' }}>·</span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 'clamp(0.68rem, 2.6vw, 0.82rem)',
            fontWeight: 700,
            color: '#555',
          }}
        >
          {clearedBalls}/{totalBalls}
        </span>
        {formationName && (
          <>
            <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.7em' }}>·</span>
            <span
              style={{
                fontFamily: 'sans-serif',
                fontSize: 'clamp(0.6rem, 2.2vw, 0.74rem)',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              {formationName}
            </span>
          </>
        )}
      </div>

      {/* Thin progress bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'rgba(0,0,0,0.10)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          style={{
            height: '100%',
            width: `${pctDisplay}%`,
            background: 'linear-gradient(90deg, #06D6A0, #3A86FF)',
            borderRadius: '2px',
            transition: 'width 0.35s ease',
          }}
        />
      </div>
    </div>
  );
});
