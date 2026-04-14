'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { useYarnGameStore } from '../../../stores/yarnGameStore';
import { CoinIcon } from '../../ui/CoinIcon';

/**
 * CoinDisplay — top-right HUD showing coins collected in the current level.
 * Animates with a brief scale-pop when the count increases.
 */
export const CoinDisplay = memo(function CoinDisplay() {
  const coinsEarned = useYarnGameStore((s) => s.coinsEarned);
  const phase       = useYarnGameStore((s) => s.phase);

  const [pop, setPop]     = useState(false);
  const prevCoins         = useRef(coinsEarned);

  useEffect(() => {
    if (coinsEarned > prevCoins.current) {
      setPop(true);
      const id = setTimeout(() => setPop(false), 300);
      prevCoins.current = coinsEarned;
      return () => clearTimeout(id);
    }
    prevCoins.current = coinsEarned;
  }, [coinsEarned]);

  if (phase === 'idle') return null;

  return (
    <div
      style={{
        position:      'absolute',
        top:           '50%',
        right:         'clamp(0.6rem, 2.5vw, 1rem)',
        display:       'flex',
        alignItems:    'center',
        gap:           '0.3rem',
        background:    'rgba(255,255,255,0.85)',
        border:        '1px solid rgba(0,0,0,0.10)',
        borderRadius:  '2rem',
        padding:       'clamp(0.3rem, 1.5vw, 0.45rem) clamp(0.6rem, 2.5vw, 0.85rem)',
        boxShadow:     '0 2px 8px rgba(0,0,0,0.08)',
        zIndex:        10,
        transform:     pop ? 'translateY(-50%) scale(1.25)' : 'translateY(-50%) scale(1)',
        transition:    pop ? 'transform 0.1s ease-out' : 'transform 0.2s ease-in',
        fontFamily:    'sans-serif',
        userSelect:    'none',
        pointerEvents: 'none',
      }}
      aria-label={`${coinsEarned} coins collected`}
    >
      <CoinIcon size={18} />
      <span
        style={{
          fontSize:   'clamp(0.8rem, 3.2vw, 0.95rem)',
          fontWeight: 700,
          color:      '#B8860B',
          minWidth:   '1ch',
          textAlign:  'right',
        }}
      >
        {coinsEarned}
      </span>
    </div>
  );
});
