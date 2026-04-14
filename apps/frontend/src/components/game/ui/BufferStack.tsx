'use client';

import React, { memo } from 'react';
import { useYarnGameStore } from '../../../stores/yarnGameStore';

/**
 * BufferStack — top-right HUD showing up to 5 held "wrong-colour" balls.
 *
 * Each slot displays the actual colour of the buffered ball so the player
 * knows what colours are waiting.  When a collector's colour later changes
 * to match a buffered ball the generator auto-releases it — the slot
 * disappears from the buffer automatically.
 *
 * At 5 balls → phase='lost'.
 * Warning pulse starts at 3 balls.
 */
export const BufferStack = memo(function BufferStack() {
  const phase       = useYarnGameStore((s) => s.phase);
  const bufferStack = useYarnGameStore((s) => s.bufferStack);

  if (phase === 'idle' || phase === 'won') return null;

  const count   = bufferStack.length;
  const isDanger = count >= 3;
  const isFull   = count >= 5;

  return (
    <div
      style={{
        position:      'absolute',
        top:           'clamp(0.6rem, 2.5vw, 1rem)',
        right:         'clamp(0.6rem, 2.5vw, 1rem)',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-end',
        gap:           '0.25rem',
        zIndex:        10,
        pointerEvents: 'none',
        userSelect:    'none',
      }}
      aria-label={`Buffer stack: ${count} of 5 balls held`}
    >
      {/* Label */}
      <span
        style={{
          fontFamily:    'sans-serif',
          fontSize:      'clamp(0.55rem, 1.8vw, 0.68rem)',
          fontWeight:    700,
          color:         isDanger ? '#E63946' : 'rgba(0,0,0,0.38)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          animation:     isDanger && !isFull ? 'buffer-pulse 1.1s ease-in-out infinite' : 'none',
        }}
      >
        Buffer
      </span>

      {/* 5 slots — each shows the buffered ball's actual colour */}
      <div style={{ display: 'flex', gap: '0.28rem' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const ball   = bufferStack[i];
          const filled = !!ball;
          return (
            <div
              key={i}
              style={{
                width:         'clamp(1.1rem, 4vw, 1.4rem)',
                height:        'clamp(1.1rem, 4vw, 1.4rem)',
                borderRadius:  '50%',
                border:        `2px solid ${filled ? ball.color : 'rgba(0,0,0,0.18)'}`,
                background:    filled
                  ? ball.color
                  : 'rgba(255,255,255,0.55)',
                display:       'flex',
                alignItems:    'center',
                justifyContent: 'center',
                transition:    'all 0.22s ease',
                boxShadow:     filled && isDanger
                  ? `0 0 8px ${ball.color}88`
                  : 'none',
              }}
            >
              {/* Inner highlight dot to give a sphere-like look */}
              {filled && (
                <div
                  style={{
                    width:        '40%',
                    height:       '40%',
                    borderRadius: '50%',
                    background:   'rgba(255,255,255,0.40)',
                    transform:    'translate(-15%, -15%)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Warning text */}
      {isDanger && !isFull && (
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize:   'clamp(0.5rem, 1.6vw, 0.6rem)',
            color:      '#E63946',
            fontWeight: 600,
            animation:  'buffer-pulse 1.1s ease-in-out infinite',
          }}
        >
          {5 - count} left!
        </span>
      )}

      <style>{`
        @keyframes buffer-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
});
