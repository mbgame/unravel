/**
 * Level API service — fetches level data from the backend.
 */

import { apiClient } from './client';
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE } from '../../constants/api.constants';
import type { Level } from '@unravel/shared-types';

/** Paginated list response from the levels endpoint. */
export interface PaginatedLevels {
  levels: Level[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetches a paginated list of levels, optionally filtered by difficulty.
 *
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @param difficulty - Optional difficulty filter (1–10)
 * @returns Paginated list of levels
 */
export async function getLevels(
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  difficulty?: number,
): Promise<PaginatedLevels> {
  const params: Record<string, string | number> = { page, limit };
  if (difficulty !== undefined) {
    params.difficulty = difficulty;
  }

  const { data } = await apiClient.get<{ data: { data: Level[]; meta: { page: number; limit: number; total: number } } }>(
    API_ENDPOINTS.LEVELS.LIST,
    { params },
  );
  return {
    levels: data.data.data,
    total: data.data.meta.total,
    page: data.data.meta.page,
    limit: data.data.meta.limit,
  };
}

/**
 * Fetches a single level by its UUID.
 *
 * @param id - Level UUID
 * @returns Full level data including knot graph
 */
export async function getLevel(id: string): Promise<Level> {
  const { data } = await apiClient.get<{ data: Level }>(API_ENDPOINTS.LEVELS.BY_ID(id));
  return data.data;
}

/**
 * Fetches today's daily challenge level.
 *
 * @returns Daily challenge level
 */
export async function getDailyLevel(): Promise<Level> {
  const { data } = await apiClient.get<{ data: Level }>(API_ENDPOINTS.LEVELS.DAILY);
  return data.data;
}
