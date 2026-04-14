/**
 * Auth API service — wraps all authentication endpoints.
 * All functions use the shared apiClient instance.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api.constants';
import type { User } from '@unravel/shared-types';

/** Payload for the register endpoint. */
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

/** Payload for the login endpoint. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Response shape returned by register and login. */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** Response shape returned by the refresh endpoint. */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * Registers a new user account.
 *
 * @param dto - Registration payload
 * @returns Auth tokens and user data
 */
export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ data: AuthResponse }>(
    API_ENDPOINTS.AUTH.REGISTER,
    dto,
  );
  return data.data;
}

/**
 * Authenticates an existing user with email + password.
 *
 * @param dto - Login credentials
 * @returns Auth tokens and user data
 */
export async function login(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ data: AuthResponse }>(
    API_ENDPOINTS.AUTH.LOGIN,
    dto,
  );
  return data.data;
}

/**
 * Exchanges a refresh token for a new access token.
 * The refresh token is expected to be sent as an httpOnly cookie,
 * but can also be passed explicitly for non-cookie flows.
 *
 * @param refreshToken - Refresh token string (pass empty string for cookie-based flow)
 * @returns New access token
 */
export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const payload = refreshToken ? { refreshToken } : {};
  const { data } = await apiClient.post<{ data: RefreshResponse }>(
    API_ENDPOINTS.AUTH.REFRESH,
    payload,
  );
  return data.data;
}

/**
 * Logs out the authenticated user and revokes the refresh token.
 */
export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
}
