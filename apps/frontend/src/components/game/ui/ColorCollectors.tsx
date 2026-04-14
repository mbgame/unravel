'use client';

import React, { memo } from 'react';
import { useYarnGameStore, CollectorSlot } from '../../../stores/yarnGameStore';
import { YARN_COLORS } from '../../../lib/game/levelGenerator';

/**
 * ColorCollectors — bottom-left and bottom-right collector HUD panels.
 *
 * Each panel shows:
 *   • A coloured circle for the current accepted colour
 *   • The colour name
 *   • Three dot slots (filled as balls arrive)
 *
 * When 3 slots are filled the store automatically clears them and sets a new
 * colour — the transition is visible immediately via the reactive selector.
 */

function colorName(hex: string | null): string {
  if (!hex) return '';
  return YARN_COLORS.find((c) => c.hex === hex)?.name ?? '';
}

interface CollectorPanelProps {
  slot:  CollectorSlot;
  side:  'left' | 'right';
}

const CollectorPanel = memo(function CollectorPanel({ slot, side }: CollectorPanelProps) {
  const { color, count } = slot;
  const isLeft = side === 'left';

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  isLeft ? 'row' : 'row-reverse',
        alignItems:     'center',
        gap:            'clamp(0.4rem, 1.8vw, 0.65rem)',
        background:     'rgba(255,255,255,0.82)',
        border:         '1px solid rgba(0,0,0,0.10)',
        borderRadius:   '2rem',
        padding:        'clamp(0.35rem, 1.5vw, 0.55rem) clamp(0.65rem, 2.5vw, 1rem)',
        boxShadow:      '0 2px 10px rgba(0,0,0,0.09)',
        minWidth:       'clamp(5.5rem, 20vw, 8.5rem)',
        pointerEvents:  'none',
        userSelect:     'none',
      }}
      aria-label={`${side} collector: ${colorName(color)}, ${count} of 3`}
    >
      {/* Colour swatch circle — saturated + glowing to match 3D yarn emissive look */}
      <div
        style={{
          width:        'clamp(1.5rem, 5.5vw, 2.1rem)',
          height:       'clamp(1.5rem, 5.5vw, 2.1rem)',
          borderRadius: '50%',
          flexShrink:   0,
          background:   color
            ? `radial-gradient(circle at 35% 35%, ${color}ee, ${color})`
            : 'rgba(0,0,0,0.12)',
          boxShadow:    color ? `0 0 6px ${color}66, 0 0 0 3px ${color}44` : 'none',
          border:       '2px solid rgba(255,255,255,0.7)',
          filter:       color ? 'saturate(1.15) brightness(1.1)' : 'none',
          transition:   'background 0.35s ease, box-shadow 0.35s ease, filter 0.35s ease',
        }}
      />

      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    isLeft ? 'flex-start' : 'flex-end',
          gap:           '0.22rem',
        }}
      >
        {/* Colour label */}
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize:   'clamp(0.58rem, 2vw, 0.72rem)',
            fontWeight: 700,
            color:      color ?? 'rgba(0,0,0,0.3)',
            letterSpacing: '0.03em',
            transition: 'color 0.35s ease',
            lineHeight: 1,
          }}
        >
          {colorName(color) || '—'}
        </span>

        {/* Three dot slots */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: 3 }).map((_, i) => {
            const filled = i < count;
            return (
              <div
                key={i}
                style={{
                  width:        'clamp(0.55rem, 2vw, 0.72rem)',
                  height:       'clamp(0.55rem, 2vw, 0.72rem)',
                  borderRadius: '50%',
                  background:   filled
                    ? (color ?? 'rgba(0,0,0,0.45)')
                    : 'rgba(0,0,0,0.14)',
                  border:       filled
                    ? '1.5px solid rgba(255,255,255,0.55)'
                    : '1.5px solid rgba(0,0,0,0.18)',
                  transition:   'background 0.18s ease, filter 0.18s ease',
                  boxShadow:    filled && color
                    ? `0 0 5px ${color}88`
                    : 'none',
                  filter:       filled && color
                    ? 'saturate(1.15) brightness(1.1)'
                    : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const ColorCollectors = memo(function ColorCollectors() {
  const phase          = useYarnGameStore((s) => s.phase);
  const leftCollector  = useYarnGameStore((s) => s.leftCollector);
  const rightCollector = useYarnGameStore((s) => s.rightCollector);

  if (phase === 'idle' || phase === 'won' || phase === 'lost') return null;

  return (
    <div
      style={{
        position:       'absolute',
        bottom:         'clamp(0.8rem, 3vw, 1.4rem)',
        left:           0,
        right:          0,
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-end',
        padding:        '0 clamp(0.6rem, 2.5vw, 1.2rem)',
        zIndex:         10,
        pointerEvents:  'none',
      }}
    >
      <CollectorPanel slot={leftCollector}  side="left"  />
      <CollectorPanel slot={rightCollector} side="right" />
    </div>
  );
});
