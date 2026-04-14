/**
 * Game page — the yarn-ball match collecting game.
 *
 * - Reads `?level=N` from the URL (default 1)
 * - Computes a deterministic pastel background colour per level
 * - Manages retryKey so Retry / Retry-after-loss remounts the level
 * - Back button (top-left) with quit-confirmation dialog
 */

'use client';

import React, { Suspense, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { YarnBallGenerator } from '../../components/game/yarn/YarnBallGenerator';
import { TargetColorDisplay } from '../../components/game/ui/TargetColorDisplay';
import { ColorCollectors } from '../../components/game/ui/ColorCollectors';
import { BufferStack } from '../../components/game/ui/BufferStack';
import { GameResultOverlay } from '../../components/game/ui/GameResultOverlay';
import { ZoomSlider } from '../../components/game/ui/ZoomSlider';
import { DebugPanel } from '../../components/game/debug/DebugPanel';
import { CoinDisplay } from '../../components/game/ui/CoinDisplay';
import { useYarnGameStore } from '../../stores/yarnGameStore';

const GameCanvas = dynamic(
  () =>
    import('../../components/game/canvas/GameCanvas').then((m) => ({ default: m.GameCanvas })),
  { ssr: false },
);

/** CSS gradient applied to the game background (canvas is transparent on top). */
const GAME_BG = 'linear-gradient(160deg, #D6EEFF 0%, #A8D8F8 40%, #C5E8FF 70%, #EAF6FF 100%)';

// ── Quit confirmation dialog ────────────────────────────────────────────────

function QuitConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position:          'absolute',
        inset:             0,
        display:           'flex',
        alignItems:        'center',
        justifyContent:    'center',
        background:        'rgba(0,0,0,0.40)',
        backdropFilter:    'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex:            30,
        padding:           '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Quit confirmation"
    >
      <div
        style={{
          background:    '#fff',
          border:        '1px solid rgba(0,0,0,0.10)',
          borderRadius:  '1.25rem',
          padding:       'clamp(1.25rem, 5vw, 2rem)',
          maxWidth:      '20rem',
          width:         '100%',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '0.75rem',
          boxShadow:     '0 8px 40px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            fontSize:   'clamp(1.1rem, 4.5vw, 1.4rem)',
            fontWeight: 800,
            color:      '#222',
            fontFamily: 'sans-serif',
            textAlign:  'center',
          }}
        >
          Quit Level?
        </div>
        <div
          style={{
            fontSize:   'clamp(0.8rem, 3vw, 0.9rem)',
            color:      'rgba(0,0,0,0.5)',
            fontFamily: 'sans-serif',
            textAlign:  'center',
          }}
        >
          Your progress will be lost.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
          <button
            onClick={onCancel}
            style={{
              flex:         1,
              padding:      '0.65rem 0',
              borderRadius: '2rem',
              border:       '2px solid rgba(0,0,0,0.15)',
              background:   'transparent',
              color:        '#333',
              fontFamily:   'sans-serif',
              fontSize:     'clamp(0.85rem, 3.5vw, 0.95rem)',
              fontWeight:   700,
              cursor:       'pointer',
              touchAction:  'manipulation',
            }}
          >
            Keep Playing
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex:         1,
              padding:      '0.65rem 0',
              borderRadius: '2rem',
              border:       'none',
              background:   '#E63946',
              color:        '#fff',
              fontFamily:   'sans-serif',
              fontSize:     'clamp(0.85rem, 3.5vw, 0.95rem)',
              fontWeight:   700,
              cursor:       'pointer',
              boxShadow:    '0 0 12px #E6394633',
              touchAction:  'manipulation',
            }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Back button ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      aria-label="Back to home"
      style={{
        position:      'absolute',
        top:           'clamp(0.6rem, 2.5vw, 1rem)',
        left:          'clamp(0.6rem, 2.5vw, 1rem)',
        display:       'flex',
        alignItems:    'center',
        gap:           '0.35rem',
        background:    'rgba(255,255,255,0.80)',
        border:        '1px solid rgba(0,0,0,0.12)',
        borderRadius:  '2rem',
        padding:       'clamp(0.35rem, 1.8vw, 0.5rem) clamp(0.7rem, 3vw, 1rem)',
        color:         '#333',
        fontFamily:    'sans-serif',
        fontSize:      'clamp(0.8rem, 3.2vw, 0.9rem)',
        fontWeight:    600,
        cursor:        'pointer',
        zIndex:        10,
        touchAction:   'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow:     '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '1.1em', lineHeight: 1 }}>‹</span>
      Back
    </button>
  );
}

// ── Inner game component ────────────────────────────────────────────────────

function GameInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const levelParam   = searchParams.get('level');
  const levelNumber  = levelParam ? Math.max(1, parseInt(levelParam, 10)) : 1;

  const [retryKey, setRetryKey] = useState(0);
  const [showQuit, setShowQuit] = useState(false);

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const handleBackPress = useCallback(() => {
    const phase = useYarnGameStore.getState().phase;
    if (phase === 'idle' || phase === 'won' || phase === 'lost') {
      router.push('/');
    } else {
      setShowQuit(true);
    }
  }, [router]);

  const handleQuitConfirm = useCallback(() => {
    useYarnGameStore.getState().resetYarnGame();
    router.push('/');
  }, [router]);

  const handleQuitCancel = useCallback(() => setShowQuit(false), []);

  return (
    <main
      style={{
        width:       '100dvw',
        height:      '100dvh',
        overflow:    'hidden',
        background:  GAME_BG,
        position:    'relative',
        touchAction: 'none',
      }}
      aria-label="Game canvas"
    >
      {/* 3-D scene */}
      <GameCanvas>
        <YarnBallGenerator key={`${levelNumber}-${retryKey}`} levelNumber={levelNumber} />
      </GameCanvas>

      {/* HTML overlays */}
      <BackButton onPress={handleBackPress} />
      <TargetColorDisplay />
      <CoinDisplay />
      <ZoomSlider />
      <BufferStack />
      <ColorCollectors />
      <GameResultOverlay onRetry={handleRetry} />

      {showQuit && (
        <QuitConfirmDialog onConfirm={handleQuitConfirm} onCancel={handleQuitCancel} />
      )}
      <DebugPanel />
    </main>
  );
}

// ── Page wrapper ────────────────────────────────────────────────────────────

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main
          style={{ width: '100dvw', height: '100dvh', background: '#FAFAF8' }}
          className="flex items-center justify-center"
          aria-label="Loading game"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
        </main>
      }
    >
      <GameInner />
    </Suspense>
  );
}
