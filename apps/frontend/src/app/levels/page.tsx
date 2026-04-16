'use client';

/**
 * Level select — winding roadmap of 5 levels.
 *
 * Layout:
 *   • Deep-space gradient sky background with twinkling star dots.
 *   • An SVG cubic-bezier path zig-zags between 5 circular level nodes.
 *   • Completed segments glow in the level colour; locked segments are dashed.
 *   • Each node shows emoji+PLAY (unlocked), ✓+DONE (completed), or 🔒 (locked).
 *   • Difficulty stars and 3-star completion badge below each node.
 *   • Sticky header with back button and "N / 5 levels" progress.
 */

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLevelProgressStore, TOTAL_LEVELS } from '../../stores/levelProgressStore';

// ─── Static level metadata ────────────────────────────────────────────────────

const LEVEL_DATA = [
  { n: 1, name: 'First Tangle',  emoji: '🧶', difficulty: 2,  color: '#06D6A0', glow: '#06D6A044' },
  { n: 2, name: 'Double Twist',  emoji: '🌀', difficulty: 4,  color: '#3A86FF', glow: '#3A86FF44' },
  { n: 3, name: 'Knotted Mind',  emoji: '🧩', difficulty: 6,  color: '#8338EC', glow: '#8338EC44' },
  { n: 4, name: "Snake's Coil",  emoji: '🐍', difficulty: 8,  color: '#FF6B6B', glow: '#FF6B6B44' },
  { n: 5, name: 'Grand Unravel', emoji: '🌟', difficulty: 10, color: '#FFD700', glow: '#FFD70044' },
] as const;

// ─── Roadmap layout ───────────────────────────────────────────────────────────
// NODE_POS: node-centre coordinates in SVG space.
// SVG viewBox is "0 0 100 <CONTAINER_H>" with preserveAspectRatio="none",
// so x=50 == 50% of container width and y maps 1:1 to pixels (viewBox h == container h).

const CONTAINER_H = 720; // px — height of the roadmap section
const NODE_R      = 38;  // px — node radius (diameter = 76 px)

const NODE_POS = [
  { x: 50, y:  85 }, // Level 1 — centre
  { x: 76, y: 215 }, // Level 2 — right
  { x: 24, y: 350 }, // Level 3 — left
  { x: 76, y: 485 }, // Level 4 — right
  { x: 50, y: 610 }, // Level 5 — centre
] as const;

// One cubic-bezier segment per gap between consecutive nodes
const SEGMENTS = [
  `M 50 85  C 50 150,  76 150,  76 215`,
  `M 76 215 C 76 282,  24 282,  24 350`,
  `M 24 350 C 24 418,  76 418,  76 485`,
  `M 76 485 C 76 547,  50 547,  50 610`,
] as const;

// ─── Decorative stars ─────────────────────────────────────────────────────────

const STARS = [
  { t: '3%',  l: '7%',  s: 4, o: 0.7, d: 0.0 },
  { t: '7%',  l: '68%', s: 3, o: 0.5, d: 0.8 },
  { t: '14%', l: '44%', s: 5, o: 0.6, d: 1.4 },
  { t: '20%', l: '88%', s: 3, o: 0.4, d: 0.3 },
  { t: '29%', l: '4%',  s: 5, o: 0.6, d: 1.9 },
  { t: '36%', l: '55%', s: 3, o: 0.5, d: 0.9 },
  { t: '44%', l: '91%', s: 4, o: 0.7, d: 2.2 },
  { t: '52%', l: '11%', s: 3, o: 0.5, d: 0.4 },
  { t: '61%', l: '62%', s: 5, o: 0.6, d: 1.6 },
  { t: '69%', l: '34%', s: 3, o: 0.4, d: 0.6 },
  { t: '77%', l: '81%', s: 4, o: 0.6, d: 2.4 },
  { t: '85%', l: '17%', s: 3, o: 0.5, d: 1.1 },
  { t: '91%', l: '48%', s: 4, o: 0.4, d: 1.7 },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LevelsPage() {
  const router          = useRouter();
  const completedLevels = useLevelProgressStore((s) => s.completedLevels);
  const isCompleted     = useLevelProgressStore((s) => s.isCompleted);
  const isUnlocked      = useLevelProgressStore((s) => s.isUnlocked);

  const completedCount = useMemo(() => completedLevels.length, [completedLevels]);
  const allDone        = completedCount === TOTAL_LEVELS;

  return (
    <main
      style={{
        width:         '100%',
        minHeight:     '100dvh',
        background:    'linear-gradient(180deg, #080c1a 0%, #0f1b35 20%, #142550 45%, #1a3566 65%, #1e4575 80%, #244880 100%)',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        fontFamily:    'system-ui, -apple-system, sans-serif',
        overflowX:     'hidden',
        paddingBottom: '4rem',
        position:      'relative',
      }}
    >
      {/* ── CSS keyframes ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity:0.2; transform:scale(0.6); }
          50%      { opacity:1;   transform:scale(1.4); }
        }
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:0.7; }
          100% { transform:scale(1.7); opacity:0;   }
        }
        @keyframes bob {
          0%,100% { transform:translateY(0);   }
          50%     { transform:translateY(-7px); }
        }
        @keyframes shine {
          0%       { transform:translateX(-120%) rotate(-45deg); }
          30%,100% { transform:translateX(220%)  rotate(-45deg); }
        }
        @keyframes glow-text {
          0%,100% { text-shadow: 0 0 6px currentColor; }
          50%     { text-shadow: 0 0 14px currentColor, 0 0 30px currentColor; }
        }
      `}</style>

      {/* ── Decorative twinkling stars ─────────────────────────────────────── */}
      {STARS.map((star, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position:      'fixed',
            top:            star.t,
            left:           star.l,
            width:          star.s,
            height:         star.s,
            borderRadius:   '50%',
            background:     '#fff',
            opacity:         star.o,
            animation:      `twinkle ${1.8 + star.d}s ${star.d}s ease-in-out infinite`,
            pointerEvents:  'none',
            zIndex:          0,
          }}
        />
      ))}

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div
        style={{
          position:   'sticky',
          top:         0,
          zIndex:      20,
          width:       '100%',
          maxWidth:    '28rem',
          padding:     'clamp(0.9rem,4vw,1.4rem)',
          paddingBottom: '0.6rem',
          display:     'flex',
          alignItems:  'center',
          gap:         '0.6rem',
          background:  'linear-gradient(180deg, rgba(8,12,26,0.97) 70%, transparent 100%)',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background:   'rgba(255,255,255,0.10)',
            border:       '1px solid rgba(255,255,255,0.18)',
            borderRadius: '2rem',
            padding:      '0.38rem 0.85rem',
            color:         '#fff',
            fontWeight:    600,
            fontSize:      '0.88rem',
            cursor:        'pointer',
            display:       'flex',
            alignItems:    'center',
            gap:           '0.3rem',
            touchAction:   'manipulation',
            flexShrink:    0,
          }}
        >
          ‹ Back
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontWeight:    900,
              fontSize:      'clamp(1.15rem,5vw,1.5rem)',
              color:          '#fff',
              letterSpacing: '-0.02em',
              lineHeight:     1.1,
            }}
          >
            🗺️ Adventure Map
          </div>
          <div
            style={{
              fontSize:  '0.72rem',
              color:     'rgba(255,255,255,0.50)',
              marginTop: '0.15rem',
            }}
          >
            {completedCount} / {TOTAL_LEVELS} complete
          </div>
        </div>

        {/* Progress ring — visual summary */}
        <div
          style={{
            flexShrink: 0,
            width:      '2.6rem',
            height:     '2.6rem',
            borderRadius: '50%',
            background: `conic-gradient(#FFD700 ${completedCount / TOTAL_LEVELS * 360}deg, rgba(255,255,255,0.12) 0)`,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   '0.68rem',
            fontWeight: 800,
            color:      '#fff',
            boxShadow:  '0 0 8px rgba(255,215,0,0.3)',
          }}
        >
          <div
            style={{
              width:      '1.85rem',
              height:     '1.85rem',
              borderRadius: '50%',
              background: 'rgba(8,12,26,0.95)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize:   '0.68rem',
              fontWeight: 800,
              color:      completedCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.4)',
            }}
          >
            {completedCount}/{TOTAL_LEVELS}
          </div>
        </div>
      </div>

      {/* ── All-done banner ────────────────────────────────────────────────── */}
      {allDone && (
        <div
          style={{
            width:         '100%',
            maxWidth:      '26rem',
            margin:        '0 auto 1.25rem',
            padding:       '0.7rem 1.2rem',
            background:    'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius:  '1.25rem',
            fontWeight:     900,
            fontSize:      'clamp(0.9rem,3.5vw,1.1rem)',
            color:          '#fff',
            textAlign:      'center',
            textShadow:    '0 1px 4px rgba(0,0,0,0.3)',
            boxShadow:     '0 0 28px rgba(255,215,0,0.4)',
            letterSpacing: '0.02em',
            zIndex:         2,
          }}
        >
          🏆 Master Unraveler! All 5 levels cleared!
        </div>
      )}

      {/* ── Roadmap canvas ─────────────────────────────────────────────────── */}
      <div
        style={{
          position:   'relative',
          width:      '100%',
          maxWidth:   '28rem',
          height:     `${CONTAINER_H}px`,
          zIndex:      1,
        }}
      >
        {/* SVG winding path */}
        <svg
          viewBox={`0 0 100 ${CONTAINER_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top:       0,
            left:      0,
            width:    '100%',
            height:   '100%',
            overflow: 'visible',
          }}
        >
          {/* Shadow layer */}
          {SEGMENTS.map((d, i) => (
            <path
              key={`sh${i}`}
              d={d}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* Coloured / dashed segments */}
          {SEGMENTS.map((d, i) => {
            const lit = isCompleted(i + 1);
            const col = LEVEL_DATA[i].color;
            return (
              <path
                key={`seg${i}`}
                d={d}
                stroke={lit ? col : 'rgba(255,255,255,0.15)'}
                strokeWidth={lit ? 4.5 : 3}
                strokeDasharray={lit ? '' : '7 5'}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Glow duplicate on completed segments */}
          {SEGMENTS.map((d, i) =>
            isCompleted(i + 1) ? (
              <path
                key={`gl${i}`}
                d={d}
                stroke={LEVEL_DATA[i].color}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                opacity={0.18}
              />
            ) : null,
          )}
        </svg>

        {/* Level nodes */}
        {LEVEL_DATA.map((lvl, idx) => {
          const pos       = NODE_POS[idx];
          const completed = isCompleted(lvl.n);
          const unlocked  = isUnlocked(lvl.n);
          const isCurrent = unlocked && !completed;

          const nodeLeft = `calc(${pos.x}% - ${NODE_R}px)`;
          const nodeTop  = pos.y - NODE_R;

          return (
            <div key={lvl.n} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

              {/* Pulsing rings around the current (active) node */}
              {isCurrent && (
                <>
                  {[0, 0.8].map((delay) => (
                    <div
                      key={delay}
                      style={{
                        position:     'absolute',
                        left:         `calc(${pos.x}% - ${NODE_R + 14}px)`,
                        top:           pos.y - NODE_R - 14,
                        width:         (NODE_R + 14) * 2,
                        height:        (NODE_R + 14) * 2,
                        borderRadius: '50%',
                        border:       `2.5px solid ${lvl.color}`,
                        animation:    `pulse-ring 2s ${delay}s ease-out infinite`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              )}

              {/* Node button */}
              <button
                disabled={!unlocked}
                onClick={() => unlocked && router.push(`/game?level=${lvl.n}`)}
                aria-label={`Level ${lvl.n}: ${lvl.name}${!unlocked ? ' — locked' : completed ? ' — completed' : ' — tap to play'}`}
                style={{
                  position:      'absolute',
                  left:           nodeLeft,
                  top:            nodeTop,
                  width:          NODE_R * 2,
                  height:         NODE_R * 2,
                  borderRadius:  '50%',
                  border:         completed
                    ? `3px solid ${lvl.color}`
                    : isCurrent
                    ? `2.5px solid ${lvl.color}bb`
                    : '2px solid rgba(255,255,255,0.14)',
                  cursor:         unlocked ? 'pointer' : 'default',
                  background:     completed
                    ? `radial-gradient(circle at 35% 30%, ${lvl.color}f0, ${lvl.color}90)`
                    : isCurrent
                    ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(255,255,255,0.06))`
                    : 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  boxShadow:      completed
                    ? `0 0 30px ${lvl.glow}, 0 5px 22px rgba(0,0,0,0.5), inset 0 1px 4px rgba(255,255,255,0.35)`
                    : isCurrent
                    ? `0 0 24px ${lvl.glow}, 0 4px 18px rgba(0,0,0,0.4)`
                    : '0 4px 14px rgba(0,0,0,0.35)',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:             2,
                  animation:       isCurrent ? 'bob 3s ease-in-out infinite' : 'none',
                  opacity:         !unlocked ? 0.45 : 1,
                  touchAction:    'manipulation',
                  overflow:       'hidden',
                  pointerEvents:  'auto',
                  transition:     'transform 0.14s ease, box-shadow 0.14s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Shine sweep on completed nodes */}
                {completed && (
                  <div
                    aria-hidden="true"
                    style={{
                      position:      'absolute',
                      inset:          0,
                      borderRadius:  '50%',
                      overflow:      'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position:   'absolute',
                        top:        '-60%',
                        left:       '-60%',
                        width:      '35%',
                        height:     '220%',
                        background: 'rgba(255,255,255,0.22)',
                        transform:  'rotate(-45deg)',
                        animation:  'shine 4s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}

                {completed ? (
                  <>
                    <div style={{ fontSize: '1.7rem', lineHeight: 1, color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>✓</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.08em' }}>DONE</div>
                  </>
                ) : isCurrent ? (
                  <>
                    <div style={{ fontSize: '1.75rem', lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))' }}>{lvl.emoji}</div>
                    <div
                      style={{
                        fontSize:    '0.55rem',
                        fontWeight:   900,
                        color:         lvl.color,
                        letterSpacing: '0.07em',
                        animation:    'glow-text 2s ease-in-out infinite',
                      }}
                    >
                      PLAY
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.55rem', lineHeight: 1 }}>🔒</div>
                    <div style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>LVL {lvl.n}</div>
                  </>
                )}
              </button>

              {/* Label block */}
              <div
                aria-hidden="true"
                style={{
                  position:   'absolute',
                  left:       `${pos.x}%`,
                  top:        pos.y + NODE_R + 10,
                  transform:  'translateX(-50%)',
                  textAlign:  'center',
                  pointerEvents: 'none',
                  zIndex:      2,
                  minWidth:   '90px',
                }}
              >
                {/* Level badge pill */}
                <div
                  style={{
                    display:      'inline-block',
                    padding:      '0.08rem 0.45rem',
                    borderRadius: '2rem',
                    fontSize:     '0.58rem',
                    fontWeight:    800,
                    letterSpacing: '0.07em',
                    marginBottom:  '0.22rem',
                    background:    unlocked
                      ? `linear-gradient(135deg, ${lvl.color}cc, ${lvl.color}80)`
                      : 'rgba(255,255,255,0.10)',
                    color:         unlocked ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  LEVEL {lvl.n}
                </div>

                {/* Level name */}
                <div
                  style={{
                    fontWeight:    700,
                    fontSize:      '0.78rem',
                    color:          unlocked ? '#fff' : 'rgba(255,255,255,0.35)',
                    textShadow:    unlocked ? '0 1px 6px rgba(0,0,0,0.7)' : 'none',
                    whiteSpace:    'nowrap',
                    letterSpacing: '0.01em',
                    lineHeight:     1.2,
                  }}
                >
                  {lvl.name}
                </div>

                {/* Difficulty stars */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px' }}>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const filled = s <= Math.ceil(lvl.difficulty / 2);
                    return (
                      <span
                        key={s}
                        style={{
                          fontSize:   '0.62rem',
                          color:       filled
                            ? (unlocked ? '#FFD700' : 'rgba(255,200,0,0.28)')
                            : 'rgba(255,255,255,0.14)',
                          textShadow:  filled && unlocked ? '0 0 5px #FFD70088' : 'none',
                        }}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>

                {/* 3-star completion badge */}
                {completed && (
                  <div
                    style={{
                      display:    'flex',
                      justifyContent: 'center',
                      gap:        '1px',
                      marginTop:  '4px',
                    }}
                  >
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize:   '0.75rem',
                          color:      '#FFD700',
                          textShadow: '0 0 6px #FFD70066',
                          animation:  `twinkle ${2.2 + s * 0.4}s ${s * 0.25}s ease-in-out infinite`,
                        }}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
