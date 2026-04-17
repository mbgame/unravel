/**
 * MainMenu — game-style intro screen.
 *
 * Layout contract:
 *   • All content fits within 100vw on any phone (no horizontal scroll)
 *   • Decorative balls are clipped inside their own overflow:hidden layer
 *   • Main container uses overflow:hidden + 2rem (32px) horizontal padding
 *     so button box-shadows (blur ≤ 20px) never reach the viewport edge
 */

'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CoinIcon } from '../ui/CoinIcon';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useLevelProgressStore, TOTAL_LEVELS } from '../../stores/levelProgressStore';

// Decorative ball definitions – all positioned inside their own clipped layer
const DECO_BALLS = [
  { color: '#E63946', size: 72,  style: { top:    '5%',  left:   '2%'  }, dur: 4.0, delay: 0.0 },
  { color: '#3A86FF', size: 52,  style: { top:    '13%', right:  '3%'  }, dur: 3.5, delay: 1.2 },
  { color: '#06D6A0', size: 90,  style: { bottom: '20%', left:   '-2%' }, dur: 4.8, delay: 0.5 },
  { color: '#8338EC', size: 44,  style: { top:    '44%', right:  '1%'  }, dur: 3.2, delay: 0.8 },
  { color: '#F4A261', size: 62,  style: { bottom: '10%', right:  '4%'  }, dur: 5.0, delay: 1.5 },
  { color: '#FF006E', size: 38,  style: { top:    '30%', left:   '8%'  }, dur: 3.7, delay: 2.0 },
  { color: '#FFBE0B', size: 30,  style: { top:    '3%',  left:   '46%' }, dur: 4.2, delay: 0.3 },
  { color: '#2A9D8F', size: 48,  style: { bottom: '33%', left:   '3%'  }, dur: 3.9, delay: 1.8 },
] as const;

export const MainMenu = memo(function MainMenu() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const coins       = useGamificationStore((s) => s.coins);
  const playerLevel = useGamificationStore((s) => s.playerLevel);
  const totalXp     = useGamificationStore((s) => s.totalXp);
  const xpToNext    = useGamificationStore((s) => s.xpToNextLevel);
  const xpCurrent   = useGamificationStore((s) => s.xpForCurrentLevel);

  const completedLevels = useLevelProgressStore((s) => s.completedLevels);
  const nextLevel = useMemo(() => {
    const done = new Set(completedLevels);
    for (let n = 1; n <= TOTAL_LEVELS; n++) {
      if ((n === 1 || done.has(n - 1)) && !done.has(n)) return n;
    }
    return TOTAL_LEVELS;
  }, [completedLevels]);
  const hasProgress = completedLevels.length > 0;
  const xpSpan      = (totalXp - xpCurrent) + xpToNext;
  const xpProgress  = xpSpan > 0 ? Math.min(1, (totalXp - xpCurrent) / xpSpan) : 1;

  return (
    <main
      style={{
        width:          '100%',
        minHeight:      '100dvh',
        /* overflow:hidden clips anything that would otherwise escape.
           Combined with 2rem horizontal padding the 20px shadow blur
           on buttons stays comfortably inside on every phone ≥ 320px. */
        overflow:       'hidden',
        background:     'linear-gradient(145deg, #FFF9F0 0%, #F5F0FF 45%, #F0F8FF 100%)',
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        /* 2rem (32px) sides guarantee shadows never hit the edge */
        padding:        'clamp(0.75rem, 3vh, 1.5rem) 2rem',
        touchAction:    'manipulation',
        boxSizing:      'border-box',
      }}
      aria-label="Main menu"
    >
      {/* ── Animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes yarn-float-a {
          0%,100% { transform: translateY(0)    rotate(0deg)   scale(1);    }
          33%     { transform: translateY(-14px) rotate(120deg) scale(1.05); }
          66%     { transform: translateY(-6px)  rotate(240deg) scale(0.96); }
        }
        @keyframes yarn-float-b {
          0%,100% { transform: translateY(0)    rotate(0deg)    scale(1);    }
          50%     { transform: translateY(-18px) rotate(-150deg) scale(1.06); }
        }
        .mm-play:active  { transform: scale(0.96) !important; }
        .mm-sec:active   { transform: scale(0.97) !important; }
      `}</style>

      {/* ── Decorative balls — clipped to their own layer ─────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          overflow:      'hidden',
          pointerEvents: 'none',
          zIndex:        0,
        }}
      >
        {DECO_BALLS.map((b, i) => (
          <div
            key={i}
            style={{
              position:     'absolute',
              width:        b.size,
              height:       b.size,
              borderRadius: '50%',
              background:   `radial-gradient(circle at 32% 32%, ${b.color}EE, ${b.color}88)`,
              boxShadow:    `0 4px 18px ${b.color}44, inset 0 -2px 8px rgba(0,0,0,0.10)`,
              animation:    `${i % 2 === 0 ? 'yarn-float-a' : 'yarn-float-b'} ${b.dur}s ${b.delay}s ease-in-out infinite`,
              opacity:      0.78,
              ...b.style,
            }}
          />
        ))}
      </div>

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -22, scale: 0.9 }}
        animate={{ opacity: 1, y: 0,   scale: 1   }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
        style={{
          textAlign:    'center',
          marginBottom: 'clamp(0.75rem, 3vh, 2rem)',
          position:     'relative',
          zIndex:       1,
          width:        '100%',
        }}
      >
        <div
          style={{
            fontSize:     'clamp(2.4rem, 10vw, 4rem)',
            lineHeight:   1,
            marginBottom: '0.3rem',
            filter:       'drop-shadow(0 3px 10px rgba(0,0,0,0.12))',
          }}
          aria-hidden="true"
        >
          🧶
        </div>

        <h1
          style={{
            fontFamily:    'system-ui, -apple-system, sans-serif',
            fontSize:      'clamp(2.2rem, 10vw, 4.5rem)',
            fontWeight:    900,
            letterSpacing: '-0.04em',
            lineHeight:    1,
            margin:        0,
            background:    'linear-gradient(130deg, #8338EC 0%, #E63946 50%, #3A86FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip:       'text',
          }}
        >
          Unravel
        </h1>

        <p
          style={{
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(0.72rem, 2.8vw, 0.9rem)',
            color:         'rgba(0,0,0,0.36)',
            margin:        '0.4rem 0 0',
            letterSpacing: '0.03em',
          }}
        >
          Collect &amp; match yarn balls
        </p>
      </motion.div>

      {/* ── Login prompt ─────────────────────────────────────────────────── */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '0.5rem',
            background:     'rgba(255,255,255,0.78)',
            border:         '1px solid rgba(0,0,0,0.08)',
            borderRadius:   '1rem',
            padding:        '0.55rem 0.85rem',
            marginBottom:   '0.75rem',
            width:          '100%',
            boxShadow:      '0 2px 10px rgba(0,0,0,0.05)',
            position:       'relative',
            zIndex:         1,
            boxSizing:      'border-box',
          }}
        >
          <Link
            href="/auth/login"
            style={{
              fontFamily:    'system-ui, sans-serif',
              fontWeight:    700,
              fontSize:      '0.85rem',
              color:         '#8338EC',
              textDecoration:'none',
              padding:       '0.28rem 0.7rem',
              borderRadius:  '1rem',
              background:    'rgba(131,56,236,0.10)',
            }}
          >
            Log in
          </Link>
          <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: '0.8rem' }}>or</span>
          <Link
            href="/auth/register"
            style={{
              fontFamily:    'system-ui, sans-serif',
              fontWeight:    700,
              fontSize:      '0.85rem',
              color:         '#3A86FF',
              textDecoration:'none',
              padding:       '0.28rem 0.7rem',
              borderRadius:  '1rem',
              background:    'rgba(58,134,255,0.10)',
            }}
          >
            Sign up
          </Link>
        </motion.div>
      )}

      {/* ── Player profile card ─────────────────────────────────────────── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.6rem',
            background: 'rgba(255,255,255,0.78)',
            border:     '1px solid rgba(0,0,0,0.08)',
            borderRadius:'1rem',
            padding:    '0.5rem 0.85rem',
            marginBottom:'0.75rem',
            width:      '100%',
            boxShadow:  '0 2px 10px rgba(0,0,0,0.05)',
            position:   'relative',
            zIndex:     1,
            boxSizing:  'border-box',
            minWidth:   0,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width:          '2rem',
              height:         '2rem',
              borderRadius:   '50%',
              background:     `hsl(${(user.username.charCodeAt(0) * 37) % 360}, 60%, 65%)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontWeight:     800,
              fontSize:       '0.85rem',
              color:          '#fff',
              flexShrink:     0,
              textTransform:  'uppercase',
            }}
          >
            {user.username.charAt(0)}
          </div>

          {/* Name + XP bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight:   700,
                fontSize:     '0.82rem',
                color:        '#222',
                fontFamily:   'system-ui, sans-serif',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}
            >
              {user.username}
              <span
                style={{
                  marginLeft:  '0.35rem',
                  fontSize:    '0.65rem',
                  color:       '#8338EC',
                  fontWeight:  700,
                  background:  'rgba(131,56,236,0.10)',
                  padding:     '0.08rem 0.35rem',
                  borderRadius:'2rem',
                }}
              >
                Lv.{playerLevel}
              </span>
            </div>
            <div
              style={{
                marginTop:    '0.25rem',
                height:       '4px',
                borderRadius: '2px',
                background:   'rgba(0,0,0,0.08)',
                overflow:     'hidden',
              }}
            >
              <div
                style={{
                  height:       '100%',
                  borderRadius: '2px',
                  background:   'linear-gradient(90deg, #8338EC, #3A86FF)',
                  width:        `${Math.round(xpProgress * 100)}%`,
                  transition:   'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* Coin balance */}
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '0.22rem',
              fontWeight: 700,
              fontSize:   '0.8rem',
              color:      '#B8860B',
              fontFamily: 'system-ui, sans-serif',
              flexShrink: 0,
            }}
          >
            <CoinIcon size={14} />{coins}
          </div>
        </motion.div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.45, delay: 0.18 }}
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           'clamp(0.4rem, 1.2vh, 0.65rem)',
          width:         '100%',
          position:      'relative',
          zIndex:        1,
        }}
        aria-label="Main navigation"
      >
        {/* PLAY / CONTINUE */}
        <button
          className="mm-play"
          onClick={() => router.push(`/game?level=${nextLevel}`)}
          style={{
            width:         '100%',
            padding:       'clamp(0.8rem, 3vw, 1rem)',
            borderRadius:  '1.5rem',
            border:        'none',
            background:    'linear-gradient(130deg, #8338EC, #3A86FF)',
            color:         '#fff',
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(0.95rem, 4vw, 1.15rem)',
            fontWeight:    800,
            cursor:        'pointer',
            letterSpacing: '0.04em',
            /* shadow blur ≤ 20px so it stays inside the 2rem padding zone */
            boxShadow:     '0 6px 20px rgba(131,56,236,0.40), 0 2px 6px rgba(0,0,0,0.08)',
            touchAction:   'manipulation',
            transition:    'transform 0.12s ease',
            WebkitTapHighlightColor: 'transparent',
            boxSizing:     'border-box',
          }}
        >
          ▶&nbsp;&nbsp;{hasProgress ? 'CONTINUE' : 'PLAY'}
        </button>

        {/* Levels */}
        <Link
          href="/levels"
          className="mm-sec"
          style={{
            width:         '100%',
            padding:       'clamp(0.68rem, 2.5vw, 0.85rem)',
            borderRadius:  '1.5rem',
            border:        '1.5px solid rgba(131,56,236,0.20)',
            background:    'rgba(255,255,255,0.72)',
            backdropFilter:'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color:         '#444',
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(0.85rem, 3.5vw, 1rem)',
            fontWeight:    700,
            cursor:        'pointer',
            letterSpacing: '0.02em',
            textDecoration:'none',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '0.4rem',
            boxShadow:     '0 2px 10px rgba(0,0,0,0.05)',
            WebkitTapHighlightColor: 'transparent',
            boxSizing:     'border-box',
          }}
        >
          📋 Levels
        </Link>

        {/* Leaderboard + Shop */}
        <div
          style={{
            display:  'flex',
            gap:      '0.5rem',
            width:    '100%',
            minWidth: 0,
            boxSizing:'border-box',
          }}
        >
          <Link
            href="/leaderboard"
            className="mm-sec"
            style={{
              flex:          1,
              minWidth:      0,
              padding:       'clamp(0.65rem, 2.5vw, 0.85rem)',
              borderRadius:  '1.5rem',
              border:        '1.5px solid rgba(0,0,0,0.08)',
              background:    'rgba(255,255,255,0.55)',
              backdropFilter:'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color:         '#555',
              fontFamily:    'system-ui, sans-serif',
              fontSize:      'clamp(0.75rem, 3vw, 0.9rem)',
              fontWeight:    700,
              cursor:        'pointer',
              textDecoration:'none',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '0.25rem',
              boxShadow:     '0 2px 8px rgba(0,0,0,0.04)',
              WebkitTapHighlightColor: 'transparent',
              overflow:      'hidden',
              whiteSpace:    'nowrap',
              boxSizing:     'border-box',
            }}
          >
            🏆 Leaderboard
          </Link>

          <Link
            href="/shop"
            className="mm-sec"
            style={{
              flex:          1,
              minWidth:      0,
              padding:       'clamp(0.65rem, 2.5vw, 0.85rem)',
              borderRadius:  '1.5rem',
              border:        '1.5px solid rgba(255,215,0,0.32)',
              background:    'rgba(255,253,240,0.75)',
              backdropFilter:'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color:         '#B8860B',
              fontFamily:    'system-ui, sans-serif',
              fontSize:      'clamp(0.75rem, 3vw, 0.9rem)',
              fontWeight:    700,
              cursor:        'pointer',
              textDecoration:'none',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '0.25rem',
              boxShadow:     '0 2px 8px rgba(0,0,0,0.04)',
              WebkitTapHighlightColor: 'transparent',
              overflow:      'hidden',
              whiteSpace:    'nowrap',
              boxSizing:     'border-box',
            }}
          >
            🛍 Shop
          </Link>
        </div>
      </motion.nav>

      {/* ── Version stamp ─────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{
          position:      'absolute',
          bottom:        'max(0.75rem, env(safe-area-inset-bottom))',
          fontFamily:    'system-ui, sans-serif',
          fontSize:      '0.65rem',
          color:         'rgba(0,0,0,0.20)',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          zIndex:        1,
        }}
      >
        v0.1.0
      </motion.p>
    </main>
  );
});
