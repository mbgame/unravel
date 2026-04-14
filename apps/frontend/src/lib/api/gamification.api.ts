/**
 * Gamification API — coins, XP, and player level endpoints.
 */

import { apiClient } from './client';

export interface LevelCompletionResult {
  coinsAwarded: number;
  xpAwarded: number;
  newCoins: number;
  newTotalXp: number;
  newPlayerLevel: number;
  didLevelUp: boolean;
  xpToNextLevel: number;
}

export interface GamificationProfile {
  coins: number;
  totalXp: number;
  playerLevel: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
}

/**
 * Notifies the backend that a level was completed and claims coins + XP.
 * coinsEarned: coins picked up from yarn balls during play.
 * penaltyCount: how many balls are in the buffer stack at level end (0 = perfect).
 */
export async function completeLevel(
  levelNumber: number,
  coinsEarned: number,
  penaltyCount: number,
): Promise<LevelCompletionResult> {
  const { data } = await apiClient.post<{ data: LevelCompletionResult }>(
    '/gamification/complete',
    { levelNumber, coinsEarned, penaltyCount },
  );
  return data.data;
}

/** Fetches the current user's gamification profile. */
export async function getGamificationProfile(): Promise<GamificationProfile> {
  const { data } = await apiClient.get<{ data: GamificationProfile }>('/gamification/profile');
  return data.data;
}
