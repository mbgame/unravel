/**
 * LeaderboardRow — renders a single leaderboard entry.
 * Highlights the current user's row with a distinct background.
 */

import React from 'react';
import type { LeaderboardEntry } from '../../lib/api/leaderboard.api';

/** Props for the LeaderboardRow component. */
interface LeaderboardRowProps {
  /** The leaderboard entry data to display. */
  entry: LeaderboardEntry;
  /** Whether this row belongs to the current authenticated user. */
  isCurrentUser?: boolean;
}

/** Medal colors for top-3 ranks. */
const MEDAL_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
};

/**
 * Formats a time in milliseconds as a human-readable string (e.g. "1m 23s").
 */
function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * A single row in the leaderboard table.
 * Minimum height of 48px satisfies the touch-target requirement.
 *
 * @param entry - Leaderboard entry data
 * @param isCurrentUser - Whether this row is the current user
 */
export const LeaderboardRow = React.memo(function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  const medalColor = MEDAL_COLORS[entry.rank] ?? 'text-white/50';

  return (
    <li
      className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 ${
        isCurrentUser ? 'bg-purple-600/30 ring-1 ring-purple-500' : 'bg-white/5'
      }`}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      {/* Rank */}
      <span
        className={`w-8 text-center text-sm font-bold ${medalColor}`}
        aria-label={`Rank ${entry.rank}`}
      >
        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
      </span>

      {/* Username */}
      <span className="flex-1 truncate text-sm font-medium text-white">
        {entry.username}
        {isCurrentUser && (
          <span className="ml-1 text-xs text-purple-300">(you)</span>
        )}
      </span>

      {/* Score */}
      <span className="text-sm font-bold text-white">{entry.score.toLocaleString()}</span>

      {/* Time */}
      <span className="hidden text-xs text-white/50 sm:block">{formatTime(entry.timeMs)}</span>
    </li>
  );
});
