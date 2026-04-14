'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardRow } from '../../components/leaderboard/LeaderboardRow';
import { getGlobalLeaderboard, type LeaderboardResponse } from '../../lib/api/leaderboard.api';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';

/**
 * LeaderboardPage — shows the global top-100 scoreboard.
 * Highlights the current user's row and shows player level badges.
 */
export default function LeaderboardPage() {
  const router      = useRouter();
  const userId      = useAuthStore((s) => s.user?.id);
  const playerLevel = useGamificationStore((s) => s.playerLevel);

  const [data, setData]       = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGlobalLeaderboard(100);
      setData(result);
    } catch {
      setError('Could not load leaderboard. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const myRank  = data?.myRank;
  const isInTop = data?.entries.some((e) => e.userId === userId) ?? false;

  return (
    <main
      style={{
        width:         '100dvw',
        minHeight:     '100dvh',
        background:    'linear-gradient(160deg, #D6EEFF 0%, #A8D8F8 40%, #C5E8FF 70%, #EAF6FF 100%)',
        fontFamily:    'sans-serif',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        padding:       'clamp(1rem, 4vw, 2rem)',
      }}
    >
      {/* Header */}
      <div
        style={{
          width:        '100%',
          maxWidth:     '36rem',
          display:      'flex',
          alignItems:   'center',
          marginBottom: '1.5rem',
          gap:          '0.75rem',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background:   'rgba(255,255,255,0.80)',
            border:       '1px solid rgba(0,0,0,0.12)',
            borderRadius: '2rem',
            padding:      '0.4rem 0.9rem',
            fontWeight:   600,
            fontSize:     '0.9rem',
            color:        '#333',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          '0.3rem',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.08)',
            touchAction:  'manipulation',
          }}
        >
          ‹ Back
        </button>

        <div
          style={{
            flex:          1,
            textAlign:     'center',
            fontWeight:    900,
            fontSize:      'clamp(1.2rem, 5vw, 1.6rem)',
            color:         '#222',
            letterSpacing: '-0.02em',
          }}
        >
          🏆 Leaderboard
        </div>

        {/* spacer to centre the title */}
        <div style={{ width: '5rem' }} />
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: '36rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>
            <div
              style={{
                width:  '2rem',
                height: '2rem',
                border: '3px solid #3A86FF',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto',
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign:    'center',
              color:        '#E63946',
              padding:      '1.5rem',
              background:   'rgba(255,255,255,0.7)',
              borderRadius: '1rem',
            }}
          >
            {error}
            <br />
            <button
              onClick={load}
              style={{
                marginTop:    '0.75rem',
                padding:      '0.4rem 1.2rem',
                borderRadius: '2rem',
                border:       'none',
                background:   '#3A86FF',
                color:        '#fff',
                fontWeight:   700,
                cursor:       'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.entries.length === 0 && (
              <div
                style={{
                  textAlign:    'center',
                  color:        '#888',
                  padding:      '2rem',
                  background:   'rgba(255,255,255,0.6)',
                  borderRadius: '1rem',
                }}
              >
                No scores yet — be the first to complete a level!
              </div>
            )}

            {data.entries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === userId}
                playerLevel={entry.userId === userId ? playerLevel : undefined}
              />
            ))}

            {/* Show rank if user is outside the top 100 */}
            {userId && !isInTop && myRank != null && (
              <div
                style={{
                  textAlign:    'center',
                  color:        '#888',
                  fontSize:     '0.85rem',
                  padding:      '0.75rem',
                  marginTop:    '0.5rem',
                  background:   'rgba(255,255,255,0.5)',
                  borderRadius: '0.75rem',
                  border:       '1px dashed rgba(0,0,0,0.12)',
                }}
              >
                You are ranked <strong>#{myRank}</strong> globally — keep playing to climb up!
              </div>
            )}

            {!userId && (
              <div
                style={{
                  textAlign:  'center',
                  color:      '#888',
                  fontSize:   '0.85rem',
                  padding:    '0.75rem',
                  marginTop:  '0.5rem',
                }}
              >
                <a
                  href="/auth/login"
                  style={{ color: '#3A86FF', fontWeight: 700, textDecoration: 'none' }}
                >
                  Log in
                </a>{' '}
                to appear on the leaderboard.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
