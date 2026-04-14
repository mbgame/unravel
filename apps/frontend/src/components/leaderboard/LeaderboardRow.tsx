'use client';

import React, { memo } from 'react';
import type { LeaderboardEntry } from '../../lib/api/leaderboard.api';

interface LeaderboardRowProps {
  entry:     LeaderboardEntry;
  isMe:      boolean;
  /** Player level from gamification profile (optional — not in base entry). */
  playerLevel?: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const RANK_LABELS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

/**
 * LeaderboardRow — one row in the leaderboard table.
 * Highlighted with a gold border when `isMe` is true.
 */
export const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  isMe,
  playerLevel,
}: LeaderboardRowProps) {
  const rankLabel = RANK_LABELS[entry.rank];
  const rankColor = RANK_COLORS[entry.rank] ?? 'transparent';

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '0.6rem',
        padding:      '0.65rem 1rem',
        borderRadius: '0.75rem',
        background:   isMe ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.55)',
        border:       isMe ? '1.5px solid rgba(255,215,0,0.5)' : '1px solid rgba(0,0,0,0.06)',
        marginBottom: '0.35rem',
        fontFamily:   'sans-serif',
        transition:   'background 0.2s',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width:         '2rem',
          textAlign:     'center',
          fontWeight:    800,
          fontSize:      'clamp(0.8rem, 3vw, 0.95rem)',
          color:         rankColor !== 'transparent' ? rankColor : '#888',
          flexShrink:    0,
        }}
      >
        {rankLabel ?? `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div
        style={{
          width:          '2rem',
          height:         '2rem',
          borderRadius:   '50%',
          background:     `hsl(${(entry.username.charCodeAt(0) * 37) % 360}, 60%, 70%)`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontWeight:     700,
          fontSize:       '0.75rem',
          color:          '#fff',
          flexShrink:     0,
          textTransform:  'uppercase',
        }}
      >
        {entry.username.charAt(0)}
      </div>

      {/* Username + level badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight:   700,
            fontSize:     'clamp(0.82rem, 3.2vw, 0.95rem)',
            color:        isMe ? '#B8860B' : '#222',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}
        >
          {entry.username}
          {isMe && (
            <span
              style={{
                marginLeft:  '0.4rem',
                fontSize:    '0.7rem',
                fontWeight:  600,
                color:       '#B8860B',
                opacity:     0.8,
              }}
            >
              (you)
            </span>
          )}
        </div>
        {playerLevel != null && (
          <div
            style={{
              fontSize:    '0.7rem',
              color:       '#8338EC',
              fontWeight:  600,
              marginTop:   '0.05rem',
            }}
          >
            Lv.{playerLevel}
          </div>
        )}
      </div>

      {/* Score */}
      <div
        style={{
          fontWeight:  700,
          fontSize:    'clamp(0.82rem, 3.2vw, 0.95rem)',
          color:       '#333',
          flexShrink:  0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {entry.score.toLocaleString()}
      </div>
    </div>
  );
});
