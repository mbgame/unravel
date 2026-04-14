/**
 * API-related constants for the frontend application.
 */

/** API base URL from environment, defaults to localhost in development. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** React Query stale time: 60 seconds. */
export const QUERY_STALE_TIME_MS = 60_000;

/** React Query retry count on failure. */
export const QUERY_RETRY_COUNT = 1;

/** Default page size for paginated requests. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum leaderboard entries to fetch. */
export const LEADERBOARD_LIMIT = 100;

/** Access token storage key in memory (Zustand). */
export const ACCESS_TOKEN_KEY = 'accessToken';

/** Rate limit: max score submissions per minute. */
export const SCORE_SUBMISSION_RATE_LIMIT = 10;

/** HTTP status codes used in response handling. */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** API endpoint paths (relative to base URL). */
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
    PROFILE: (id: string) => `/users/${id}/profile`,
  },
  LEVELS: {
    LIST: '/levels',
    BY_ID: (id: string) => `/levels/${id}`,
    DAILY: '/levels/daily/today',
  },
  SCORES: {
    SUBMIT: '/scores',
    MY_SCORES: '/scores/me',
  },
  LEADERBOARD: {
    GLOBAL: '/leaderboard/global',
    BY_LEVEL: (id: string) => `/leaderboard/level/${id}`,
  },
  ACHIEVEMENTS: {
    MY_ACHIEVEMENTS: '/achievements/me',
  },
} as const;
