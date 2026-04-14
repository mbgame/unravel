/**
 * MainMenu — game-style intro screen.
 *
 * Design:
 *   • Light warm gradient background (cream → lavender → alice-blue)
 *   • 8 decorative yarn-ball circles floating with CSS keyframe animations
 *   • Bold gradient title "Unravel"
 *   • Large "PLAY" button (direct to level 1), secondary navigation below
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

// Decorative ball definitions (position + animation)
const DECO_BALLS = [
  { color: '#E63946', size: 88,  style: { top:    '6%',  left:   '3%'  }, dur: 4.0, delay: 0.0 },
  { color: '#3A86FF', size: 62,  style: { top:    '14%', right:  '5%'  }, dur: 3.5, delay: 1.2 },
  { color: '#06D6A0', size: 108, style: { bottom: '20%', left:   '-3%' }, dur: 4.8, delay: 0.5 },
  { color: '#8338EC', size: 52,  style: { top:    '44%', right:  '2%'  }, dur: 3.2, delay: 0.8 },
  { color: '#F4A261', size: 74,  style: { bottom: '10%', right:  '7%'  }, dur: 5.0, delay: 1.5 },
  { color: '#FF006E', size: 46,  style: { top:    '30%', left:   '10%' }, dur: 3.7, delay: 2.0 },
  { color: '#FFBE0B', size: 36,  style: { top:    '4%',  left:   '48%' }, dur: 4.2, delay: 0.3 },
  { color: '#2A9D8F', size: 58,  style: { bottom: '34%', left:   '5%'  }, dur: 3.9, delay: 1.8 },
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
      const unlocked = n === 1 || done.has(n - 1);
      if (unlocked && !done.has(n)) return n;
    }
    return TOTAL_LEVELS; // all done — replay last
  }, [completedLevels]);
  const hasProgress = completedLevels.length > 0;
  // Progress within current level: earned since level start / total xp span of this level
  const xpSpan     = (totalXp - xpCurrent) + xpToNext;
  const xpProgress = xpSpan > 0 ? Math.min(1, (totalXp - xpCurrent) / xpSpan) : 1;

  return (
    <main
      style={{
        width:          '100dvw',
        height:         '100dvh',
        overflow:       'hidden',
        background:     'linear-gradient(145deg, #FFF9F0 0%, #F5F0FF 45%, #F0F8FF 100%)',
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem 1.5rem',
        touchAction:    'manipulation',
      }}
      aria-label="Main menu"
    >
      {/* ── CSS animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes yarn-float-a {
          0%,100% { transform: translateY(0px)   rotate(0deg)   scale(1);    }
          33%     { transform: translateY(-18px)  rotate(120deg) scale(1.06); }
          66%     { transform: translateY(-8px)   rotate(240deg) scale(0.96); }
        }
        @keyframes yarn-float-b {
          0%,100% { transform: translateY(0px)   rotate(0deg)    scale(1);    }
          50%     { transform: translateY(-22px)  rotate(-160deg) scale(1.08); }
        }
        .yarn-btn-play:active { transform: scale(0.95) !important; }
        .yarn-btn-sec:active  { transform: scale(0.96) !important; }
      `}</style>

      {/* ── Decorative floating balls ───────────────────────────────────── */}
      {DECO_BALLS.map((b, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position:     'absolute',
            width:         b.size,
            height:        b.size,
            borderRadius: '50%',
            background:   `radial-gradient(circle at 32% 32%, ${b.color}EE, ${b.color}88)`,
            boxShadow:    `0 6px 28px ${b.color}44, inset 0 -3px 10px rgba(0,0,0,0.12)`,
            animation:    `${i % 2 === 0 ? 'yarn-float-a' : 'yarn-float-b'} ${b.dur}s ${b.delay}s ease-in-out infinite`,
            opacity:       0.82,
            ...b.style,
          }}
        />
      ))}

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -28, scale: 0.88 }}
        animate={{ opacity: 1,  y: 0,   scale: 1    }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 190 }}
        style={{ textAlign: 'center', marginBottom: '2.8rem', position: 'relative', zIndex: 1 }}
      >
        <div
          style={{
            fontSize:   'clamp(3.2rem, 14vw, 5.5rem)',
            lineHeight: 1,
            marginBottom: '0.4rem',
            filter:     'drop-shadow(0 4px 14px rgba(0,0,0,0.14))',
          }}
          aria-hidden="true"
        >
          🧶
        </div>

        <h1
          style={{
            fontFamily:   'system-ui, -apple-system, sans-serif',
            fontSize:     'clamp(3rem, 13vw, 5.2rem)',
            fontWeight:   900,
            letterSpacing:'-0.04em',
            lineHeight:   1,
            margin:       0,
            background:   'linear-gradient(130deg, #8338EC 0%, #E63946 50%, #3A86FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip:       'text',
            filter:       'drop-shadow(0 2px 6px rgba(131,56,236,0.28))',
          }}
        >
          Unravel
        </h1>

        <p
          style={{
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(0.82rem, 3.2vw, 1rem)',
            color:         'rgba(0,0,0,0.38)',
            margin:        '0.55rem 0 0',
            letterSpacing: '0.03em',
          }}
        >
          Collect &amp; match yarn balls
        </p>
      </motion.div>

      {/* ── Login prompt (when not signed in) ────────────────────────── */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '0.6rem',
            background:    'rgba(255,255,255,0.78)',
            border:        '1px solid rgba(0,0,0,0.08)',
            borderRadius:  '1.25rem',
            padding:       '0.65rem 1rem',
            marginBottom:  '1rem',
            maxWidth:      '22rem',
            width:         '100%',
            boxShadow:     '0 2px 12px rgba(0,0,0,0.06)',
            position:      'relative',
            zIndex:        1,
          }}
        >
          <Link
            href="/auth/login"
            style={{
              fontFamily:    'system-ui, sans-serif',
              fontWeight:    700,
              fontSize:      '0.92rem',
              color:         '#8338EC',
              textDecoration:'none',
              padding:       '0.3rem 0.8rem',
              borderRadius:  '1rem',
              background:    'rgba(131,56,236,0.10)',
              transition:    'background 0.15s ease',
            }}
          >
            Log in
          </Link>
          <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: '0.85rem' }}>or</span>
          <Link
            href="/auth/register"
            style={{
              fontFamily:    'system-ui, sans-serif',
              fontWeight:    700,
              fontSize:      '0.92rem',
              color:         '#3A86FF',
              textDecoration:'none',
              padding:       '0.3rem 0.8rem',
              borderRadius:  '1rem',
              background:    'rgba(58,134,255,0.10)',
              transition:    'background 0.15s ease',
            }}
          >
            Sign up
          </Link>
        </motion.div>
      )}

      {/* ── Player profile card ────────────────────────────────────────── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '0.75rem',
            background:    'rgba(255,255,255,0.78)',
            border:        '1px solid rgba(0,0,0,0.08)',
            borderRadius:  '1.25rem',
            padding:       '0.65rem 1rem',
            marginBottom:  '1rem',
            maxWidth:      '22rem',
            width:         '100%',
            boxShadow:     '0 2px 12px rgba(0,0,0,0.06)',
            position:      'relative',
            zIndex:        1,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width:          '2.4rem',
              height:         '2.4rem',
              borderRadius:   '50%',
              background:     `hsl(${(user.username.charCodeAt(0) * 37) % 360}, 60%, 68%)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontWeight:     800,
              fontSize:       '1rem',
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
                fontSize:     '0.88rem',
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
                  marginLeft:  '0.4rem',
                  fontSize:    '0.72rem',
                  color:       '#8338EC',
                  fontWeight:  700,
                  background:  'rgba(131,56,236,0.10)',
                  padding:     '0.1rem 0.4rem',
                  borderRadius:'2rem',
                }}
              >
                Lv.{playerLevel}
              </span>
            </div>
            {/* XP bar */}
            <div
              style={{
                marginTop:    '0.3rem',
                height:       '5px',
                borderRadius: '3px',
                background:   'rgba(0,0,0,0.08)',
                overflow:     'hidden',
              }}
            >
              <div
                style={{
                  height:       '100%',
                  borderRadius: '3px',
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
              display:     'flex',
              alignItems:  'center',
              gap:         '0.25rem',
              fontWeight:  700,
              fontSize:    '0.85rem',
              color:       '#B8860B',
              fontFamily:  'system-ui, sans-serif',
              flexShrink:  0,
            }}
          >
            <CoinIcon size={16} />{coins}
          </div>
        </motion.div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.5, delay: 0.18 }}
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '0.85rem',
          width:         '100%',
          maxWidth:      '22rem',
          position:      'relative',
          zIndex:        1,
        }}
        aria-label="Main navigation"
      >
        {/* Play — resumes from first incomplete level */}
        <button
          className="yarn-btn-play"
          onClick={() => router.push(`/game?level=${nextLevel}`)}
          style={{
            width:         '100%',
            padding:       'clamp(1rem, 4vw, 1.3rem)',
            borderRadius:  '2rem',
            border:        'none',
            background:    'linear-gradient(130deg, #8338EC, #3A86FF)',
            color:         '#fff',
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(1.1rem, 4.5vw, 1.35rem)',
            fontWeight:    800,
            cursor:        'pointer',
            letterSpacing: '0.05em',
            boxShadow:     '0 8px 30px rgba(131,56,236,0.45), 0 2px 8px rgba(0,0,0,0.10)',
            touchAction:   'manipulation',
            transition:    'transform 0.12s ease, box-shadow 0.12s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ▶&nbsp;&nbsp;{hasProgress ? 'CONTINUE' : 'PLAY'}
        </button>

        {/* Levels */}
        <Link
          href="/levels"
          style={{
            width:         '100%',
            padding:       'clamp(0.85rem, 3.5vw, 1rem)',
            borderRadius:  '2rem',
            border:        '2px solid rgba(131,56,236,0.22)',
            background:    'rgba(255,255,255,0.72)',
            backdropFilter:'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color:         '#444',
            fontFamily:    'system-ui, sans-serif',
            fontSize:      'clamp(0.95rem, 3.8vw, 1.1rem)',
            fontWeight:    700,
            cursor:        'pointer',
            letterSpacing: '0.02em',
            textDecoration:'none',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '0.5rem',
            boxShadow:     '0 2px 12px rgba(0,0,0,0.06)',
            WebkitTapHighlightColor: 'transparent',
          }}
          className="yarn-btn-sec"
        >
          📋&nbsp; Levels
        </Link>

        {/* Bottom row: Leaderboard + Shop side-by-side */}
        <div style={{ display: 'flex', gap: '0.65rem', width: '100%' }}>
          <Link
            href="/leaderboard"
            style={{
              flex:          1,
              padding:       'clamp(0.85rem, 3.5vw, 1rem)',
              borderRadius:  '2rem',
              border:        '2px solid rgba(0,0,0,0.08)',
              background:    'rgba(255,255,255,0.55)',
              backdropFilter:'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color:         '#555',
              fontFamily:    'system-ui, sans-serif',
              fontSize:      'clamp(0.88rem, 3.5vw, 1rem)',
              fontWeight:    700,
              cursor:        'pointer',
              letterSpacing: '0.02em',
              textDecoration:'none',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '0.4rem',
              boxShadow:     '0 2px 8px rgba(0,0,0,0.04)',
              WebkitTapHighlightColor: 'transparent',
            }}
            className="yarn-btn-sec"
          >
            🏆 Leaderboard
          </Link>

          <Link
            href="/shop"
            style={{
              flex:          1,
              padding:       'clamp(0.85rem, 3.5vw, 1rem)',
              borderRadius:  '2rem',
              border:        '2px solid rgba(255,215,0,0.35)',
              background:    'rgba(255,253,240,0.75)',
              backdropFilter:'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color:         '#B8860B',
              fontFamily:    'system-ui, sans-serif',
              fontSize:      'clamp(0.88rem, 3.5vw, 1rem)',
              fontWeight:    700,
              cursor:        'pointer',
              letterSpacing: '0.02em',
              textDecoration:'none',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '0.4rem',
              boxShadow:     '0 2px 8px rgba(0,0,0,0.04)',
              WebkitTapHighlightColor: 'transparent',
            }}
            className="yarn-btn-sec"
          >
            🛍 Shop
          </Link>
        </div>
      </motion.nav>

      {/* ── Version stamp ───────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{
          position:      'absolute',
          bottom:        'max(1rem, env(safe-area-inset-bottom))',
          fontFamily:    'system-ui, sans-serif',
          fontSize:      '0.7rem',
          color:         'rgba(0,0,0,0.22)',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}
      >
        v0.1.0
      </motion.p>
    </main>
  );
});
