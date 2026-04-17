/**
 * Loading component for the game route segment.
 * Shown by Next.js App Router while the game page chunk loads.
 */

import React from 'react';

/**
 * Full-screen loading indicator for the game route.
 * Uses a simple CSS spinner — no JS animation library dependency.
 */
export default function GameLoading() {
  return (
    <div
      style={{
        width: '100dvw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0D1A',
        flexDirection: 'column',
        gap: '1rem',
      }}
      aria-label="Loading game"
      role="status"
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid #252540',
          borderTop: '3px solid #6C63FF',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p
        style={{
          color: '#b5b5d3ff',
          fontSize: '0.875rem',
          fontFamily: 'sans-serif',
          margin: 0,
        }}
      >
        Loading level…
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
