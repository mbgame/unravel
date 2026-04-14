/**
 * Leaderboard API service — global and per-level leaderboard data.
 */

import { apiClient } from './client';
import { API_ENDPOINTS, LEADERBOARD_LIMIT } from '../../constants/api.constants';

/** A single row in the leaderboard. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  timeMs: number;
  moves: number;
}

/** Leaderboard response envelope. */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  /** Current user's personal rank (may be outside top N). */
  myRank: number | null;
}

/**
 * Fetches the global leaderboard (highest scores across all levels).
 *
 * @param limit - Maximum number of entries to return (default 100)
 * @returns Leaderboard entries sorted by score descending
 */
export async function getGlobalLeaderboard(
  limit = LEADERBOARD_LIMIT,
): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get<{ data: LeaderboardEntry[] }>(
    API_ENDPOINTS.LEADERBOARD.GLOBAL,
    { params: { limit } },
  );
  const entries = Array.isArray(data.data) ? data.data : [];
  return { entries, total: entries.length, myRank: null };
}

/**
 * Fetches the leaderboard for a specific level.
 *
 * @param levelId - UUID of the level
 * @param limit - Maximum number of entries to return (default 100)
 * @returns Level-specific leaderboard entries
 */
export async function getLevelLeaderboard(
  levelId: string,
  limit = LEADERBOARD_LIMIT,
): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get<{ data: LeaderboardEntry[] }>(
    API_ENDPOINTS.LEADERBOARD.BY_LEVEL(levelId),
    { params: { limit } },
  );
  const entries = Array.isArray(data.data) ? data.data : [];
  return { entries, total: entries.length, myRank: null };
}
