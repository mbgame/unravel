'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useYarnGameStore } from '../../../stores/yarnGameStore';
import { useAuthStore } from '../../../stores/authStore';
import { useGamificationStore } from '../../../stores/gamificationStore';
import { useLevelProgressStore, TOTAL_LEVELS } from '../../../stores/levelProgressStore';
import { completeLevel, type LevelCompletionResult } from '../../../lib/api/gamification.api';
import { CoinIcon } from '../../ui/CoinIcon';

interface GameResultOverlayProps {
  onRetry: () => void;
}

/** Animated count-up from 0 to `target` over `durationMs`. */
function useCountUp(target: number, durationMs = 800, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setValue(0); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / durationMs, 1);
      setValue(Math.round(pct * target));
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, active]);
  return value;
}

/**
 * GameResultOverlay — full-screen overlay shown when the player wins or loses.
 *
 * On win: calls backend to award coins + XP, shows animated count-up of
 * coins earned, XP awarded, and a level-up banner if the player ranked up.
 */
export const GameResultOverlay = memo(function GameResultOverlay({
  onRetry,
}: GameResultOverlayProps) {
  const phase        = useYarnGameStore((s) => s.phase);
  const levelNumber  = useYarnGameStore((s) => s.levelNumber);
  const totalBalls   = useYarnGameStore((s) => s.totalBalls);
  const coinsEarned  = useYarnGameStore((s) => s.coinsEarned);
  const bufferStack  = useYarnGameStore((s) => s.bufferStack);
  const router       = useRouter();

  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const commitLevelResult = useGamificationStore((s) => s.commitLevelResult);
  const markComplete      = useLevelProgressStore((s) => s.markComplete);

  const [apiResult, setApiResult]   = useState<LevelCompletionResult | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const calledRef = useRef(false);

  const isWon = phase === 'won';

  // Call backend on win (once per result)
  useEffect(() => {
    if (phase !== 'won' || calledRef.current) return;
    calledRef.current = true;

    // Unlock next level regardless of auth state
    markComplete(levelNumber);

    if (!isAuthenticated) return;

    setApiLoading(true);
    completeLevel(levelNumber, coinsEarned, bufferStack.length)
      .then((result) => {
        setApiResult(result);
        commitLevelResult(result);
      })
      .catch(() => { /* silently ignore network errors */ })
      .finally(() => setApiLoading(false));
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset call guard when overlay is dismissed
  useEffect(() => {
    if (phase === 'idle') calledRef.current = false;
  }, [phase]);

  const displayCoins = apiResult?.coinsAwarded ?? coinsEarned;
  const displayXp    = apiResult?.xpAwarded ?? 0;
  const didLevelUp   = apiResult?.didLevelUp ?? false;
  const newLevel     = apiResult?.newPlayerLevel ?? 1;

  const animCoins = useCountUp(displayCoins, 700, isWon && !apiLoading);
  const animXp    = useCountUp(displayXp,    900, isWon && !apiLoading && displayXp > 0);

  if (phase !== 'won' && phase !== 'lost') return null;

  const handleRetry = () => {
    useYarnGameStore.getState().resetYarnGame();
    setApiResult(null);
    calledRef.current = false;
    onRetry();
  };

  const isLastLevel = levelNumber >= TOTAL_LEVELS;

  const handleNext = () => {
    useYarnGameStore.getState().resetYarnGame();
    setApiResult(null);
    calledRef.current = false;
    if (isLastLevel) {
      router.replace('/levels');
    } else {
      router.replace(`/game?level=${levelNumber + 1}`);
    }
  };

  const handleQuit = () => {
    useYarnGameStore.getState().resetYarnGame();
    setApiResult(null);
    calledRef.current = false;
    router.push('/');
  };

  return (
    <div
      style={{
        position:             'absolute',
        inset:                0,
        display:              'flex',
        flexDirection:        'column',
        alignItems:           'center',
        justifyContent:       'center',
        background:           isWon
          ? 'rgba(6, 214, 160, 0.10)'
          : 'rgba(230, 57, 70, 0.12)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex:               20,
        padding:              '1.5rem',
        gap:                  '0rem',
      }}
      aria-live="assertive"
    >
      {/* Title */}
      <div
        style={{
          fontSize:      'clamp(2rem, 10vw, 4.2rem)',
          fontWeight:    900,
          fontFamily:    'sans-serif',
          color:         isWon ? '#06D6A0' : '#E63946',
          textShadow:    isWon
            ? '0 0 32px #06D6A066'
            : '0 0 32px #E6394666',
          marginBottom:  '0.25rem',
          letterSpacing: '-0.02em',
          textAlign:     'center',
        }}
      >
        {isWon ? '🎉 You Win!' : '💥 Level Failed!'}
      </div>

      {/* Sub-title */}
      <div
        style={{
          fontSize:     'clamp(0.82rem, 3.5vw, 1rem)',
          fontFamily:   'sans-serif',
          color:        'rgba(0,0,0,0.52)',
          marginBottom: isWon ? '1rem' : '2rem',
          textAlign:    'center',
          maxWidth:     '22rem',
        }}
      >
        {isWon
          ? `All ${totalBalls} yarn balls matched — Level ${levelNumber} cleared!`
          : 'Your penalty stack overflowed. Give it another try!'}
      </div>

      {/* ── Win rewards panel ── */}
      {isWon && (
        <div
          style={{
            display:        'flex',
            gap:            '0.75rem',
            marginBottom:   '1.25rem',
            flexWrap:       'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Coins */}
          <div
            style={{
              background:   'rgba(255,255,255,0.88)',
              border:       '1.5px solid rgba(184,134,11,0.25)',
              borderRadius: '1rem',
              padding:      '0.5rem 1rem',
              display:      'flex',
              alignItems:   'center',
              gap:          '0.4rem',
              fontFamily:   'sans-serif',
              fontWeight:   700,
              fontSize:     'clamp(0.9rem, 3.8vw, 1.05rem)',
              color:        '#B8860B',
              minWidth:     '6rem',
              justifyContent: 'center',
            }}
          >
            <CoinIcon size={20} />
            {apiLoading ? (
              <span style={{ opacity: 0.5, fontWeight: 400 }}>…</span>
            ) : (
              <span>+{animCoins}</span>
            )}
          </div>

          {/* XP */}
          {(displayXp > 0 || apiLoading) && isAuthenticated && (
            <div
              style={{
                background:   'rgba(255,255,255,0.88)',
                border:       '1.5px solid rgba(131,56,236,0.25)',
                borderRadius: '1rem',
                padding:      '0.5rem 1rem',
                display:      'flex',
                alignItems:   'center',
                gap:          '0.4rem',
                fontFamily:   'sans-serif',
                fontWeight:   700,
                fontSize:     'clamp(0.9rem, 3.8vw, 1.05rem)',
                color:        '#8338EC',
                minWidth:     '6rem',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.15em' }}>⭐</span>
              {apiLoading ? (
                <span style={{ opacity: 0.5, fontWeight: 400 }}>…</span>
              ) : (
                <span>+{animXp} XP</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Level-up banner ── */}
      {isWon && didLevelUp && (
        <div
          style={{
            background:   'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: '1rem',
            padding:      '0.6rem 1.4rem',
            marginBottom: '1rem',
            fontFamily:   'sans-serif',
            fontWeight:   900,
            fontSize:     'clamp(1rem, 4.5vw, 1.3rem)',
            color:        '#fff',
            textShadow:   '0 1px 4px rgba(0,0,0,0.3)',
            boxShadow:    '0 0 24px #FFD70066',
            letterSpacing: '0.03em',
            textAlign:    'center',
          }}
        >
          🏆 LEVEL UP! → Level {newLevel}
        </div>
      )}

      {/* Buttons */}
      <div
        style={{
          display:        'flex',
          gap:            '0.8rem',
          flexWrap:       'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={handleRetry}
          style={{
            padding:      'clamp(0.6rem, 2.5vw, 0.75rem) clamp(1.2rem, 5vw, 2rem)',
            borderRadius: '2rem',
            border:       '2px solid rgba(0,0,0,0.15)',
            background:   'rgba(255,255,255,0.80)',
            color:        '#333',
            fontFamily:   'sans-serif',
            fontSize:     'clamp(0.9rem, 3.5vw, 1rem)',
            fontWeight:   700,
            cursor:       'pointer',
            letterSpacing: '0.03em',
            minWidth:     '7rem',
            touchAction:  'manipulation',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {isWon ? 'Replay' : 'Retry'}
        </button>

        {isWon ? (
          <button
            onClick={handleNext}
            style={{
              padding:      'clamp(0.6rem, 2.5vw, 0.75rem) clamp(1.2rem, 5vw, 2rem)',
              borderRadius: '2rem',
              border:       'none',
              background:   '#06D6A0',
              color:        '#fff',
              fontFamily:   'sans-serif',
              fontSize:     'clamp(0.9rem, 3.5vw, 1rem)',
              fontWeight:   700,
              cursor:       'pointer',
              letterSpacing: '0.03em',
              boxShadow:    '0 0 20px #06D6A055',
              minWidth:     '7rem',
              touchAction:  'manipulation',
            }}
          >
            {isLastLevel ? '🗺 Back to Map' : 'Next Level →'}
          </button>
        ) : (
          <button
            onClick={handleQuit}
            style={{
              padding:      'clamp(0.6rem, 2.5vw, 0.75rem) clamp(1.2rem, 5vw, 2rem)',
              borderRadius: '2rem',
              border:       'none',
              background:   '#E63946',
              color:        '#fff',
              fontFamily:   'sans-serif',
              fontSize:     'clamp(0.9rem, 3.5vw, 1rem)',
              fontWeight:   700,
              cursor:       'pointer',
              letterSpacing: '0.03em',
              boxShadow:    '0 0 20px #E6394655',
              minWidth:     '7rem',
              touchAction:  'manipulation',
            }}
          >
            Quit
          </button>
        )}
      </div>
    </div>
  );
});
