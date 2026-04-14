/**
 * Game API service — score submission and retrieval.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api.constants';

/** Payload for submitting a completed level attempt. */
export interface SubmitScoreDto {
  /** UUID of the completed level. */
  levelId: string;
  /** Time taken to complete the level in milliseconds. */
  timeMs: number;
  /** Total number of moves made. */
  moves: number;
  /** Number of hints consumed. */
  hintsUsed: number;
}

/** A single score record returned from the API. */
export interface ScoreRecord {
  id: string;
  levelId: string;
  score: number;
  timeMs: number;
  moves: number;
  hintsUsed: number;
  createdAt: string;
  rank?: number;
}

/** Response returned after a successful score submission. */
export interface SubmitScoreResponse {
  score: number;
  rank: number;
  isNewBest: boolean;
}

/**
 * Submits a completed level attempt to the backend for server-side scoring.
 *
 * @param dto - Score submission payload
 * @returns Calculated score, rank, and whether it's a new personal best
 */
export async function submitScore(dto: SubmitScoreDto): Promise<SubmitScoreResponse> {
  const { data } = await apiClient.post<{ data: SubmitScoreResponse }>(
    API_ENDPOINTS.SCORES.SUBMIT,
    dto,
  );
  return data.data;
}

/**
 * Retrieves the authenticated user's best scores across all levels.
 *
 * @returns Array of score records
 */
export async function getMyScores(): Promise<ScoreRecord[]> {
  const { data } = await apiClient.get<{ data: ScoreRecord[] }>(API_ENDPOINTS.SCORES.MY_SCORES);
  return data.data;
}
