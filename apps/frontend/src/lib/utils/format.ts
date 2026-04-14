/**
 * Formatting utilities for time, scores, and other display values.
 */

/**
 * Formats a duration in milliseconds as a MM:SS string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string, e.g. "01:23"
 *
 * @example
 * formatTime(83000) // => "01:23"
 * formatTime(5500)  // => "00:05"
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats a score number with thousands separators.
 *
 * @param score - Numeric score value
 * @returns Formatted string, e.g. "1,234"
 *
 * @example
 * formatScore(1234) // => "1,234"
 */
export function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

/**
 * Calculates the star rating (1–3) for a given score out of 1000.
 *
 * @param score - Final score (0–1000)
 * @returns Star count: 1, 2, or 3
 */
export function getStarRating(score: number): 1 | 2 | 3 {
  if (score >= 800) return 3;
  if (score >= 500) return 2;
  return 1;
}

/**
 * Formats a count of moves as a plural-aware string.
 *
 * @param moves - Number of moves
 * @returns E.g. "1 move" or "5 moves"
 */
export function formatMoves(moves: number): string {
  return `${moves} ${moves === 1 ? 'move' : 'moves'}`;
}

/**
 * Formats a relative timestamp to a human-readable string.
 * For simple use without external date libraries.
 *
 * @param isoString - ISO 8601 date string
 * @returns Relative string like "2 days ago"
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}
