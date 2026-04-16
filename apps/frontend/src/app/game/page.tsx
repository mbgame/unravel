/**
 * Game page — the yarn-ball match collecting game.
 *
 * - Reads `?level=N` from the URL (default 1)
 * - Shows a LevelLoadingScreen while phase === 'idle' (assets loading)
 * - GameTopBar consolidates Back / Timer / Level-info / Coins / Hint / Pause / Buffer
 *   into a single non-overlapping header row
 * - DebugPanel (Leva) is only mounted in development
 */

'use client';

import React, { Suspense, useState, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { YarnBallGenerator } from '../../components/game/yarn/YarnBallGenerator';
import { ColorCollectors } from '../../components/game/ui/ColorCollectors';
import { GameResultOverlay } from '../../components/game/ui/GameResultOverlay';
import { ZoomSlider } from '../../components/game/ui/ZoomSlider';
import { CoinIcon } from '../../components/ui/CoinIcon';
import { useYarnGameStore } from '../../stores/yarnGameStore';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import { useGameTimer } from '../../hooks/useGameTimer';

const GameCanvas = dynamic(
  () =>
    import('../../components/game/canvas/GameCanvas').then((m) => ({ default: m.GameCanvas })),
  { ssr: false },
);

const DebugPanel = dynamic(
  () =>
    import('../../components/game/debug/DebugPanel').then((m) => ({ default: m.DebugPanel })),
  { ssr: false },
);

/** CSS gradient applied to the game background. */
const GAME_BG = 'linear-gradient(160deg, #D6EEFF 0%, #A8D8F8 40%, #C5E8FF 70%, #EAF6FF 100%)';

const MAX_HINTS = 3;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ── Level loading screen ───────────────────────────────────────────────────────

function LevelLoadingScreen({ levelNumber }: { levelNumber: number }) {
  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     GAME_BG,
        zIndex:         40,
        gap:            '0.85rem',
        fontFamily:     'sans-serif',
      }}
      aria-label="Loading level"
      aria-live="polite"
    >
      <style>{`
        @keyframes ls-spin    { to { transform: rotate(360deg); } }
        @keyframes ls-bob     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div style={{ fontSize: 'clamp(2.8rem, 14vw, 4.5rem)', animation: 'ls-bob 1.8s ease-in-out infinite' }}>
        🧶
      </div>

      <div style={{
        fontWeight:    900,
        fontSize:      'clamp(1.1rem, 5.5vw, 1.55rem)',
        color:         '#333',
        letterSpacing: '-0.02em',
      }}>
        Level {levelNumber}
      </div>

      <div style={{ fontSize: 'clamp(0.72rem, 3vw, 0.88rem)', color: 'rgba(0,0,0,0.38)' }}>
        Loading assets…
      </div>

      <div style={{
        width:        '1.8rem',
        height:       '1.8rem',
        border:       '3px solid rgba(131,56,236,0.18)',
        borderTop:    '3px solid #8338EC',
        borderRadius: '50%',
        animation:    'ls-spin 0.75s linear infinite',
      }} />
    </div>
  );
}

// ── Quit confirmation dialog ───────────────────────────────────────────────────

function QuitConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <div
      style={{
        position:             'absolute',
        inset:                0,
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'center',
        background:           'rgba(0,0,0,0.40)',
        backdropFilter:       'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex:               30,
        padding:              '1.5rem',
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
        <div style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)', fontWeight: 800, color: '#222', fontFamily: 'sans-serif', textAlign: 'center' }}>
          Quit Level?
        </div>
        <div style={{ fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', color: 'rgba(0,0,0,0.5)', fontFamily: 'sans-serif', textAlign: 'center' }}>
          Your progress will be lost.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.65rem 0', borderRadius: '2rem',
              border: '2px solid rgba(0,0,0,0.15)', background: 'transparent',
              color: '#333', fontFamily: 'sans-serif', fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)',
              fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            Keep Playing
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.65rem 0', borderRadius: '2rem',
              border: 'none', background: '#E63946', color: '#fff',
              fontFamily: 'sans-serif', fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)',
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 12px #E6394633', touchAction: 'manipulation',
            }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unified game top bar ───────────────────────────────────────────────────────
// Replaces: BackButton + GameHUD + TargetColorDisplay + CoinDisplay + BufferStack
// Layout:
//   Row 1  [‹Back] [⏱ timer · moves]  [Lv·cleared/total·formation]  [💰] [💡] [⏸]
//   Row 2  Progress bar (full width, 3px)
//   Row 3  Buffer dots (right-aligned, only when buffer.length > 0)

interface GameTopBarProps {
  onBack:          () => void;
  onPause:         () => void;
  onHint:          () => void;
  hintsRemaining:  number;
}

const GameTopBar = memo(function GameTopBar({ onBack, onPause, onHint, hintsRemaining }: GameTopBarProps) {
  useGameTimer(); // drives the RAF-based timer

  const timerMs      = useGameStore((s) => s.timerMs);
  const moves        = useGameStore((s) => s.moves);

  const phase        = useYarnGameStore((s) => s.phase);
  const clearedBalls = useYarnGameStore((s) => s.clearedBalls);
  const totalBalls   = useYarnGameStore((s) => s.totalBalls);
  const levelNumber  = useYarnGameStore((s) => s.levelNumber);
  const formationName= useYarnGameStore((s) => s.formationName);
  const coinsEarned  = useYarnGameStore((s) => s.coinsEarned);
  const bufferStack  = useYarnGameStore((s) => s.bufferStack);

  if (phase === 'idle') return null;

  const pct         = totalBalls > 0 ? clearedBalls / totalBalls : 0;
  const bufCount    = bufferStack.length;
  const isDanger    = bufCount >= 3;
  const isFull      = bufCount >= 5;

  const iconBtnBase: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          'clamp(2rem, 8.5vw, 2.6rem)',
    height:         'clamp(2rem, 8.5vw, 2.6rem)',
    borderRadius:   '0.7rem',
    border:         'none',
    background:     'rgba(255,255,255,0.82)',
    fontSize:       'clamp(0.9rem, 3.8vw, 1.1rem)',
    cursor:         'pointer',
    flexShrink:     0,
    boxShadow:      '0 1px 6px rgba(0,0,0,0.12)',
    touchAction:    'manipulation',
    WebkitTapHighlightColor: 'transparent',
    position:       'relative',
    pointerEvents:  'auto',
    transition:     'transform 0.1s ease, opacity 0.15s ease',
  };

  return (
    <div
      style={{
        position:  'absolute',
        top:       0,
        left:      0,
        right:     0,
        zIndex:    20,
        pointerEvents: 'none',
        paddingTop: 'max(env(safe-area-inset-top), 0.55rem)',
      }}
      aria-label="Game controls"
    >
      <style>{`
        @keyframes buf-pulse { 0%,100%{opacity:1}50%{opacity:0.38} }
        .gtb-icon:active { transform: scale(0.9); }
        .gtb-back:active { transform: scale(0.96); }
      `}</style>

      {/* ── Row 1: controls ─────────────────────────────────────────── */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         'clamp(0.28rem, 1.3vw, 0.5rem)',
          padding:     '0 clamp(0.5rem, 2.2vw, 0.85rem)',
        }}
      >
        {/* Back */}
        <button
          className="gtb-back"
          onClick={onBack}
          aria-label="Back to home"
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '0.18rem',
            background:  'rgba(255,255,255,0.82)',
            border:      '1px solid rgba(0,0,0,0.10)',
            borderRadius:'2rem',
            padding:     'clamp(0.28rem, 1.2vw, 0.42rem) clamp(0.5rem, 2vw, 0.75rem)',
            color:       '#333',
            fontFamily:  'sans-serif',
            fontSize:    'clamp(0.68rem, 2.8vw, 0.82rem)',
            fontWeight:  700,
            cursor:      'pointer',
            flexShrink:  0,
            boxShadow:   '0 1px 6px rgba(0,0,0,0.10)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            pointerEvents: 'auto',
            transition:  'transform 0.1s ease',
          }}
        >
          <span style={{ fontSize: '1.1em', lineHeight: 1 }}>‹</span>
          Back
        </button>

        {/* Timer + Moves */}
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            background:    'rgba(0,0,0,0.42)',
            borderRadius:  '0.6rem',
            padding:       'clamp(0.18rem, 0.8vw, 0.28rem) clamp(0.38rem, 1.5vw, 0.58rem)',
            gap:           '1px',
            flexShrink:    0,
          }}
          aria-label={`Time: ${formatTime(timerMs)}, moves: ${moves}`}
        >
          <span style={{
            fontFamily: 'monospace',
            fontSize:   'clamp(0.75rem, 3vw, 0.92rem)',
            fontWeight: 800,
            color:      '#fff',
            lineHeight: 1,
          }}>
            {formatTime(timerMs)}
          </span>
          <span style={{
            fontSize:  'clamp(0.5rem, 1.9vw, 0.62rem)',
            color:     'rgba(255,255,255,0.62)',
            lineHeight: 1,
          }}>
            {moves}&nbsp;mv
          </span>
        </div>

        {/* Level info pill — grows to fill available space */}
        <div
          style={{
            flex:       1,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow:   'hidden',
          }}
          aria-label={`Level ${levelNumber}: ${clearedBalls} of ${totalBalls} cleared`}
        >
          <div
            style={{
              background:  'rgba(255,255,255,0.88)',
              border:      '1px solid rgba(0,0,0,0.07)',
              borderRadius:'2rem',
              padding:     'clamp(0.18rem, 0.8vw, 0.28rem) clamp(0.42rem, 1.8vw, 0.7rem)',
              display:     'flex',
              alignItems:  'center',
              gap:         '0.3rem',
              boxShadow:   '0 1px 5px rgba(0,0,0,0.07)',
              overflow:    'hidden',
              maxWidth:    '100%',
            }}
          >
            <span style={{ fontFamily: 'sans-serif', fontSize: 'clamp(0.6rem, 2.4vw, 0.74rem)', fontWeight: 800, color: '#333', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Lv{levelNumber}
            </span>
            <span style={{ fontSize: '0.65em', color: 'rgba(0,0,0,0.22)', flexShrink: 0 }}>·</span>
            <span style={{ fontFamily: 'monospace', fontSize: 'clamp(0.6rem, 2.4vw, 0.74rem)', fontWeight: 700, color: '#555', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {clearedBalls}/{totalBalls}
            </span>
            {formationName && (
              <>
                <span style={{ fontSize: '0.65em', color: 'rgba(0,0,0,0.22)', flexShrink: 0 }}>·</span>
                <span style={{
                  fontFamily:   'sans-serif',
                  fontSize:     'clamp(0.55rem, 2vw, 0.66rem)',
                  color:        'rgba(0,0,0,0.38)',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  minWidth:     0,
                }}>
                  {formationName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Coins */}
        <div
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '0.18rem',
            background:  'rgba(255,255,255,0.82)',
            borderRadius:'0.6rem',
            padding:     'clamp(0.18rem, 0.8vw, 0.28rem) clamp(0.32rem, 1.3vw, 0.5rem)',
            flexShrink:  0,
            boxShadow:   '0 1px 6px rgba(0,0,0,0.08)',
          }}
          aria-label={`${coinsEarned} coins`}
        >
          <CoinIcon size={12} />
          <span style={{ fontFamily: 'sans-serif', fontSize: 'clamp(0.62rem, 2.4vw, 0.78rem)', fontWeight: 700, color: '#B8860B' }}>
            {coinsEarned}
          </span>
        </div>

        {/* Hint button */}
        <button
          className="gtb-icon"
          onClick={onHint}
          disabled={hintsRemaining === 0}
          aria-label={`Hint — ${hintsRemaining} remaining`}
          style={{ ...iconBtnBase, opacity: hintsRemaining === 0 ? 0.35 : 1 }}
        >
          💡
          {hintsRemaining > 0 && (
            <span style={{
              position:       'absolute',
              top:            '-4px',
              right:          '-4px',
              width:          '1rem',
              height:         '1rem',
              borderRadius:   '50%',
              background:     '#F4D03F',
              color:          '#555',
              fontSize:       '0.52rem',
              fontWeight:     800,
              fontFamily:     'sans-serif',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              boxShadow:      '0 1px 4px rgba(0,0,0,0.18)',
            }}>
              {hintsRemaining}
            </span>
          )}
        </button>

        {/* Pause button */}
        <button
          className="gtb-icon"
          onClick={onPause}
          aria-label="Pause game"
          style={iconBtnBase}
        >
          ⏸
        </button>
      </div>

      {/* ── Row 2: progress bar ──────────────────────────────────────── */}
      <div
        style={{
          margin:       'clamp(0.25rem, 1vw, 0.4rem) clamp(0.5rem, 2.2vw, 0.85rem) 0',
          height:       '3px',
          background:   'rgba(255,255,255,0.28)',
          borderRadius: '2px',
          overflow:     'hidden',
        }}
        aria-hidden
      >
        <div style={{
          height:       '100%',
          width:        `${pct * 100}%`,
          background:   'linear-gradient(90deg, #06D6A0, #3A86FF)',
          borderRadius: '2px',
          transition:   'width 0.35s ease',
        }} />
      </div>

      {/* ── Row 3: buffer slots (right-aligned, only when non-empty) ─── */}
      {bufCount > 0 && (
        <div
          style={{
            display:        'flex',
            justifyContent: 'flex-end',
            alignItems:     'center',
            padding:        'clamp(0.18rem, 0.75vw, 0.28rem) clamp(0.5rem, 2.2vw, 0.85rem) 0',
            gap:            '0.2rem',
          }}
          aria-label={`Buffer: ${bufCount} of 5`}
        >
          <span style={{
            fontFamily:    'sans-serif',
            fontSize:      'clamp(0.48rem, 1.7vw, 0.6rem)',
            fontWeight:    700,
            color:         isDanger ? '#E63946' : 'rgba(0,0,0,0.32)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginRight:   '0.15rem',
            animation:     isDanger && !isFull ? 'buf-pulse 1.1s ease infinite' : 'none',
          }}>
            Buffer
          </span>
          {Array.from({ length: 5 }).map((_, i) => {
            const ball = bufferStack[i];
            return (
              <div
                key={i}
                style={{
                  width:        'clamp(0.85rem, 3vw, 1.05rem)',
                  height:       'clamp(0.85rem, 3vw, 1.05rem)',
                  borderRadius: '50%',
                  background:   ball ? ball.color : 'rgba(255,255,255,0.22)',
                  border:       `1.5px solid ${ball ? ball.color : 'rgba(0,0,0,0.12)'}`,
                  boxShadow:    ball && isDanger ? `0 0 5px ${ball.color}88` : 'none',
                  transition:   'all 0.2s ease',
                  flexShrink:   0,
                }}
              />
            );
          })}
          {isDanger && !isFull && (
            <span style={{
              fontFamily:  'sans-serif',
              fontSize:    'clamp(0.48rem, 1.7vw, 0.6rem)',
              fontWeight:  700,
              color:       '#E63946',
              animation:   'buf-pulse 1.1s ease infinite',
              marginLeft:  '0.1rem',
              whiteSpace:  'nowrap',
            }}>
              {5 - bufCount} left!
            </span>
          )}
        </div>
      )}
    </div>
  );
});

// ── Inner game component ───────────────────────────────────────────────────────

function GameInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const levelParam   = searchParams.get('level');
  const levelNumber  = levelParam ? Math.max(1, parseInt(levelParam, 10)) : 1;

  const [retryKey,  setRetryKey]  = useState(0);
  const [showQuit,  setShowQuit]  = useState(false);

  const phase        = useYarnGameStore((s) => s.phase);
  const hintsUsed    = useGameStore((s) => s.hintsUsed);
  const useHint      = useGameStore((s) => s.useHint);
  const pauseGame    = useGameStore((s) => s.pauseGame);
  const openModal    = useUiStore((s) => s.openModal);
  const setIsPaused  = useUiStore((s) => s.setIsPaused);

  const hintsRemaining = MAX_HINTS - hintsUsed;

  const handleRetry = useCallback(() => setRetryKey((k) => k + 1), []);

  const handleBack = useCallback(() => {
    const p = useYarnGameStore.getState().phase;
    if (p === 'idle' || p === 'won' || p === 'lost') {
      router.push('/');
    } else {
      setShowQuit(true);
    }
  }, [router]);

  const handlePause = useCallback(() => {
    pauseGame();
    setIsPaused(true);
    openModal('pause');
  }, [pauseGame, setIsPaused, openModal]);

  const handleHint = useCallback(() => {
    if (hintsRemaining > 0) useHint();
  }, [hintsRemaining, useHint]);

  const handleQuitConfirm = useCallback(() => {
    useYarnGameStore.getState().resetYarnGame();
    router.push('/');
  }, [router]);

  const handleQuitCancel = useCallback(() => setShowQuit(false), []);

  return (
    <main
      style={{
        width:       '100%',
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

      {/* Loading overlay — visible while assets initialise */}
      {phase === 'idle' && <LevelLoadingScreen levelNumber={levelNumber} />}

      {/* Unified top bar (Back + Timer + Level info + Coins + Hint + Pause + Buffer) */}
      <GameTopBar
        onBack={handleBack}
        onPause={handlePause}
        onHint={handleHint}
        hintsRemaining={hintsRemaining}
      />

      {/* Left-edge zoom slider */}
      <ZoomSlider />

      {/* Bottom collectors */}
      <ColorCollectors />

      {/* Win / lose overlay */}
      <GameResultOverlay onRetry={handleRetry} />

      {/* Quit confirmation */}
      {showQuit && (
        <QuitConfirmDialog onConfirm={handleQuitConfirm} onCancel={handleQuitCancel} />
      )}

      {/* Debug GUI — only in local development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </main>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────────────

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main
          style={{ width: '100%', height: '100dvh', background: GAME_BG }}
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
