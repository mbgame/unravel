'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';

const DECO_BALLS = [
  { color: '#8338EC', size: 80,  pos: { top: '4%',    left:  '2%'  }, dur: 4.2, delay: 0.0 },
  { color: '#E63946', size: 46,  pos: { top: '8%',    right: '5%'  }, dur: 3.6, delay: 1.0 },
  { color: '#3A86FF', size: 96,  pos: { bottom: '14%', left: '-4%' }, dur: 5.0, delay: 0.4 },
  { color: '#F4A261', size: 38,  pos: { top: '40%',   right: '2%'  }, dur: 3.3, delay: 1.8 },
  { color: '#06D6A0', size: 58,  pos: { bottom: '6%', right: '4%'  }, dur: 4.5, delay: 0.7 },
  { color: '#FF006E', size: 32,  pos: { top: '2%',    left: '44%'  }, dur: 3.8, delay: 2.1 },
] as const;

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.85rem 1rem',
  borderRadius: '0.875rem',
  border: '1.5px solid rgba(0,0,0,0.12)',
  background: 'rgba(255,255,255,0.75)',
  fontSize: '1rem',
  color: '#222',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
  WebkitTapHighlightColor: 'transparent',
};

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, registerMutate, isRegistering, registerError } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form     = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    registerMutate({ username, email, password });
  }

  return (
    <main
      style={{
        width:          '100%',
        minHeight:      '100dvh',
        overflowX:      'hidden',
        background:     'linear-gradient(145deg, #FFF9F0 0%, #F5F0FF 45%, #F0F8FF 100%)',
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '1.5rem',
        fontFamily:     'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── CSS animations ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes yarn-float-a {
          0%,100% { transform: translateY(0px)  rotate(0deg)   scale(1);    }
          33%     { transform: translateY(-18px) rotate(120deg) scale(1.06); }
          66%     { transform: translateY(-8px)  rotate(240deg) scale(0.96); }
        }
        @keyframes yarn-float-b {
          0%,100% { transform: translateY(0px)  rotate(0deg)    scale(1);    }
          50%     { transform: translateY(-22px) rotate(-160deg) scale(1.08); }
        }
        .auth-input:focus {
          border-color: rgba(131,56,236,0.60) !important;
          box-shadow:   0 0 0 3px rgba(131,56,236,0.13) !important;
          background:   rgba(255,255,255,0.98) !important;
        }
        .auth-btn-play:active      { transform: scale(0.96) !important; }
        .auth-btn-secondary:active { transform: scale(0.97) !important; }
      `}</style>

      {/* ── Decorative floating yarn balls ──────────────────────────────────── */}
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
            opacity:       0.78,
            pointerEvents: 'none',
            ...b.pos,
          }}
        />
      ))}

      {/* ── Card ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
        style={{
          width:               '100%',
          maxWidth:            '22rem',
          background:          'rgba(255,255,255,0.88)',
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          border:              '1px solid rgba(255,255,255,0.95)',
          borderRadius:        '1.75rem',
          boxShadow:           '0 8px 40px rgba(131,56,236,0.14), 0 2px 16px rgba(0,0,0,0.07)',
          padding:             '2rem',
          position:            'relative',
          zIndex:               1,
        }}
      >
        {/* ── Logo + title ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <div
            aria-hidden="true"
            style={{ fontSize: 'clamp(2.5rem,10vw,3rem)', lineHeight: 1, marginBottom: '0.45rem',
                     filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))' }}
          >
            🧶
          </div>
          <h1
            style={{
              fontFamily:           'system-ui, -apple-system, sans-serif',
              fontSize:             'clamp(1.9rem,7vw,2.4rem)',
              fontWeight:            900,
              letterSpacing:        '-0.03em',
              lineHeight:            1,
              margin:               '0 0 0.3rem',
              background:           'linear-gradient(130deg, #8338EC 0%, #E63946 50%, #3A86FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip:       'text',
              filter:               'drop-shadow(0 2px 6px rgba(131,56,236,0.22))',
            }}
          >
            Unravel
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(0,0,0,0.38)', margin: 0, letterSpacing: '0.01em' }}>
            Join the adventure
          </p>
        </div>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {registerError && (
          <div
            role="alert"
            style={{
              marginBottom: '1rem',
              padding:      '0.7rem 1rem',
              borderRadius: '0.75rem',
              background:   'rgba(230,57,70,0.09)',
              border:       '1px solid rgba(230,57,70,0.28)',
              color:        '#b52b36',
              fontSize:     '0.85rem',
            }}
          >
            {registerError.message ?? 'Registration failed. Please try again.'}
          </div>
        )}

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={{ marginBottom: '0.9rem' }}>
            <label
              htmlFor="username"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600,
                       color: '#555', marginBottom: '0.35rem', letterSpacing: '0.01em' }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
              disabled={isRegistering}
              placeholder="your_name"
              aria-label="Username"
              className="auth-input"
              style={{ ...baseInputStyle, opacity: isRegistering ? 0.6 : 1 }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '0.9rem' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600,
                       color: '#555', marginBottom: '0.35rem', letterSpacing: '0.01em' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isRegistering}
              placeholder="you@example.com"
              aria-label="Email address"
              className="auth-input"
              style={{ ...baseInputStyle, opacity: isRegistering ? 0.6 : 1 }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600,
                       color: '#555', marginBottom: '0.35rem', letterSpacing: '0.01em' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isRegistering}
              placeholder="min 8 chars"
              aria-label="Password"
              className="auth-input"
              style={{ ...baseInputStyle, opacity: isRegistering ? 0.6 : 1 }}
            />
          </div>

          {/* Create Account button */}
          <button
            type="submit"
            disabled={isRegistering}
            className="auth-btn-play"
            aria-label="Create account"
            style={{
              width:         '100%',
              padding:       'clamp(0.9rem,3.5vw,1rem)',
              borderRadius:  '1.5rem',
              border:        'none',
              background:    'linear-gradient(130deg, #8338EC, #3A86FF)',
              color:         '#fff',
              fontFamily:    'system-ui, -apple-system, sans-serif',
              fontSize:      '1rem',
              fontWeight:    800,
              letterSpacing: '0.04em',
              cursor:        isRegistering ? 'not-allowed' : 'pointer',
              opacity:       isRegistering ? 0.65 : 1,
              boxShadow:     '0 8px 28px rgba(131,56,236,0.42), 0 2px 8px rgba(0,0,0,0.08)',
              transition:    'transform 0.12s ease, box-shadow 0.12s ease, opacity 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
              touchAction:   'manipulation',
            }}
          >
            {isRegistering ? 'Creating account…' : '✦  CREATE ACCOUNT'}
          </button>
        </form>

        {/* ── Login link ────────────────────────────────────────────────────── */}
        <p style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(0,0,0,0.38)' }}>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            style={{ color: '#8338EC', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign in →
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
