/**
 * API contract types shared between frontend and backend.
 * Defines request/response shapes for all API endpoints.
 */

/** Generic successful API response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/** API error response shape. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}

/** Common pagination query parameters. */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Request body for user registration. */
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

/** Request body for user login. */
export interface LoginDto {
  email: string;
  password: string;
}

/** JWT token pair returned on successful auth. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Request body for submitting a level score. */
export interface SubmitScoreDto {
  levelId: string;
  timeMs: number;
  moves: number;
  hintsUsed: number;
}
