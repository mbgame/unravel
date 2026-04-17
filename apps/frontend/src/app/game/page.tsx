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

import React, { Suspense, useState, useCallback, useEffect, useRef, memo } from 'react';
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
import { YARN_COLORS } from '../../lib/game/levelGenerator';

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

/** localStorage key — bump suffix to reset tutorial for all users. */
const TUTORIAL_KEY = 'unravel-tutorial-v1';

function colorName(hex: string | null): string {
  if (!hex) return '';
  return YARN_COLORS.find((c) => c.hex === hex)?.name ?? '';
}

// ── Tutorial steps ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: '🧶',
    title: 'Sort the Yarn!',
    body: 'Tap any yarn ball to launch it toward one of the color collectors at the bottom of the screen.',
    visual: null as 'collector' | 'buffer' | null,
  },
  {
    icon: null,
    title: 'Color Collectors',
    body: 'Each collector accepts one color at a time. Fill it with 3 matching balls and it refreshes with a new color!',
    visual: 'collector' as 'collector' | 'buffer' | null,
  },
  {
    icon: null,
    title: 'The Buffer Zone',
    body: 'Wrong color? It lands in the buffer (top right). Fill all 5 buffer slots and you lose!',
    visual: 'buffer' as 'collector' | 'buffer' | null,
  },
  {
    icon: '🪙',
    title: 'Grab Coins Too',
    body: 'Some yarn balls carry a golden coin. Collect them along the way for bonus points!',
    visual: null as 'collector' | 'buffer' | null,
  },
  {
    icon: '🏆',
    title: "You're All Set!",
    body: 'Clear every yarn ball before the buffer overflows. The faster you go, the better your score!',
    visual: null as 'collector' | 'buffer' | null,
  },
];

// ── Tutorial overlay ──────────────────────────────────────────────────────────

function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const ACCENT  = '#8338EC';
  const PILL_BG = 'rgba(255,255,255,0.94)';

  function CollectorVisual() {
    const COLORS = ['#E63946', '#3A86FF'];
    return (
      <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center', marginBottom: '0.2rem' }}>
        {COLORS.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            background: PILL_BG, border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: '2rem', padding: '0.45rem 0.9rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              width: '1.5rem', height: '1.5rem', borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${c}ee, ${c})`,
              boxShadow: `0 0 6px ${c}66`,
              border: '2px solid rgba(255,255,255,0.7)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ height: '0.5rem', width: '3rem', background: 'rgba(0,0,0,0.08)', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '0.22rem' }}>
                {[0,1,2].map((j) => (
                  <div key={j} style={{
                    width: '0.55rem', height: '0.55rem', borderRadius: '50%',
                    background: j < (i === 0 ? 2 : 1) ? c : 'rgba(0,0,0,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.55)',
                  }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function BufferVisual() {
    const BALL_COLORS = ['#F4A261', '#8338EC', '#06D6A0', null, null];
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'rgba(255,255,255,0.88)', borderRadius: '1rem',
        padding: '0.55rem 0.9rem', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
      }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#E63946', letterSpacing: '0.07em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Buffer
        </span>
        <div style={{ display: 'flex', gap: '0.28rem', alignItems: 'center' }}>
          {BALL_COLORS.map((c, i) => (
            <div key={i} style={{
              width: '1.05rem', height: '1.05rem', borderRadius: '50%',
              background: c ? `radial-gradient(circle at 35% 35%, ${c}ee, ${c})` : 'rgba(255,255,255,0.3)',
              border: `1.5px solid ${c ?? 'rgba(0,0,0,0.12)'}`,
              boxShadow: c ? `0 0 5px ${c}88` : 'none',
            }} />
          ))}
        </div>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#E63946', fontFamily: 'sans-serif' }}>
          2 left!
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="How to play tutorial"
    >
      <style>{`
        @keyframes tut-in { from { opacity:0; transform:translateY(18px) scale(0.96); } to { opacity:1; transform:none; } }
        .tut-card { animation: tut-in 0.28s ease both; }
      `}</style>

      <div
        className="tut-card"
        style={{
          background:    'rgba(255,255,255,0.97)',
          borderRadius:  '1.75rem',
          padding:       'clamp(1.4rem, 5vw, 2rem)',
          maxWidth:      '22rem',
          width:         '100%',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '0.85rem',
          boxShadow:     '0 16px 60px rgba(0,0,0,0.22)',
          position:      'relative',
        }}
      >
        {/* Skip */}
        <button
          onClick={onDone}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(0,0,0,0.07)', border: 'none',
            borderRadius: '2rem', padding: '0.28rem 0.7rem',
            fontFamily: 'sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: 'rgba(0,0,0,0.38)', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          aria-label="Skip tutorial"
        >
          Skip
        </button>

        {/* Step counter */}
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(0,0,0,0.28)', fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {step + 1} of {STEPS.length}
        </div>

        {/* Visual or emoji */}
        {current.visual === 'collector' ? (
          <CollectorVisual />
        ) : current.visual === 'buffer' ? (
          <BufferVisual />
        ) : (
          <div style={{ fontSize: 'clamp(3rem, 14vw, 4rem)', lineHeight: 1 }}>
            {current.icon}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: 'sans-serif', fontWeight: 900,
          fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
          color: '#1a1a2e', textAlign: 'center', letterSpacing: '-0.02em',
        }}>
          {current.title}
        </div>

        {/* Body */}
        <div style={{
          fontFamily: 'sans-serif', fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)',
          color: 'rgba(0,0,0,0.52)', textAlign: 'center', lineHeight: 1.5,
          maxWidth: '18rem',
        }}>
          {current.body}
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '0.38rem', marginTop: '0.1rem' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width:        i === step ? '1.4rem' : '0.45rem',
                height:       '0.45rem',
                borderRadius: '0.3rem',
                background:   i === step ? ACCENT : 'rgba(0,0,0,0.15)',
                cursor:       'pointer',
                transition:   'all 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Next / Done */}
        <button
          onClick={isLast ? onDone : () => setStep((s) => s + 1)}
          style={{
            width:         '100%',
            padding:       'clamp(0.75rem, 3vw, 0.9rem)',
            borderRadius:  '1.5rem',
            border:        'none',
            background:    isLast
              ? 'linear-gradient(130deg, #06D6A0, #3A86FF)'
              : `linear-gradient(130deg, ${ACCENT}, #3A86FF)`,
            color:         '#fff',
            fontFamily:    'sans-serif',
            fontSize:      'clamp(0.9rem, 3.8vw, 1rem)',
            fontWeight:    800,
            letterSpacing: '0.03em',
            cursor:        'pointer',
            boxShadow:     '0 6px 24px rgba(131,56,236,0.38)',
            touchAction:   'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition:    'transform 0.1s ease',
            marginTop:     '0.2rem',
          }}
        >
          {isLast ? "Let's Play! 🧶" : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ── Hint popup ────────────────────────────────────────────────────────────────

function HintPopup({ onDismiss }: { onDismiss: () => void }) {
  const leftCollector  = useYarnGameStore((s) => s.leftCollector);
  const rightCollector = useYarnGameStore((s) => s.rightCollector);
  const bufferStack    = useYarnGameStore((s) => s.bufferStack);

  // Auto-dismiss after 4 s
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  function CollectorHint({ color, count, side }: { color: string | null; count: number; side: string }) {
    if (!color) return null;
    const need = 3 - count;
    const name = colorName(color);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <div style={{
          width: '1.1rem', height: '1.1rem', borderRadius: '50%', flexShrink: 0,
          background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color})`,
          boxShadow: `0 0 5px ${color}66`,
          border: '2px solid rgba(255,255,255,0.7)',
        }} />
        <span style={{ fontFamily: 'sans-serif', fontSize: '0.82rem', color: '#333', fontWeight: 600 }}>
          {side} needs <strong>{need}</strong> more <strong style={{ color }}>{name}</strong>
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute', top: 'clamp(4.5rem, 18vw, 6rem)', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25, pointerEvents: 'auto',
      }}
      onClick={onDismiss}
    >
      <style>{`@keyframes hint-in { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <div style={{
        animation: 'hint-in 0.22s ease both',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(131,56,236,0.22)',
        borderRadius: '1.1rem',
        padding: '0.85rem 1.1rem',
        boxShadow: '0 8px 32px rgba(131,56,236,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        minWidth: 'clamp(14rem, 60vw, 20rem)',
        display: 'flex', flexDirection: 'column', gap: '0.55rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💡</span>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '0.88rem', color: '#333', letterSpacing: '-0.01em' }}>
            Hint
          </span>
          {bufferStack.length > 0 && (
            <span style={{ marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '0.72rem', color: bufferStack.length >= 3 ? '#E63946' : 'rgba(0,0,0,0.38)', fontWeight: 700 }}>
              Buffer: {bufferStack.length}/5
            </span>
          )}
        </div>
        <CollectorHint color={leftCollector.color}  count={leftCollector.count}  side="Left" />
        <CollectorHint color={rightCollector.color} count={rightCollector.count} side="Right" />
        {bufferStack.length >= 3 && (
          <div style={{ fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#E63946', fontWeight: 600, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '0.45rem', marginTop: '0.1rem' }}>
            Buffer nearly full! Prioritize the colors shown above.
          </div>
        )}
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.68rem', color: 'rgba(0,0,0,0.28)', textAlign: 'center', marginTop: '0.1rem' }}>
          Tap to dismiss
        </div>
      </div>
    </div>
  );
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

  const [retryKey,      setRetryKey]      = useState(0);
  const [showQuit,      setShowQuit]      = useState(false);
  const [showTutorial,  setShowTutorial]  = useState(false);
  const [showHintPopup, setShowHintPopup] = useState(false);
  const prevPhaseRef = useRef<string>('idle');

  const phase        = useYarnGameStore((s) => s.phase);
  const hintsUsed    = useGameStore((s) => s.hintsUsed);
  const useHintFn    = useGameStore((s) => s.useHint);
  const pauseGame    = useGameStore((s) => s.pauseGame);
  const openModal    = useUiStore((s) => s.openModal);
  const setIsPaused  = useUiStore((s) => s.setIsPaused);

  const hintsRemaining = MAX_HINTS - hintsUsed;

  // Show tutorial the first time the game transitions from idle → playing
  useEffect(() => {
    if (prevPhaseRef.current === 'idle' && phase === 'playing') {
      if (typeof window !== 'undefined' && !localStorage.getItem(TUTORIAL_KEY)) {
        setShowTutorial(true);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const handleTutorialDone = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(TUTORIAL_KEY, '1');
    setShowTutorial(false);
  }, []);

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
    if (hintsRemaining > 0) {
      useHintFn();
      setShowHintPopup(true);
    }
  }, [hintsRemaining, useHintFn]);

  const handleHintDismiss = useCallback(() => setShowHintPopup(false), []);

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

      {/* Hint popup — appears below top bar, auto-dismisses after 4 s */}
      {showHintPopup && <HintPopup onDismiss={handleHintDismiss} />}

      {/* Quit confirmation */}
      {showQuit && (
        <QuitConfirmDialog onConfirm={handleQuitConfirm} onCancel={handleQuitCancel} />
      )}

      {/* First-time tutorial — shown once per browser */}
      {showTutorial && <TutorialOverlay onDone={handleTutorialDone} />}

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
