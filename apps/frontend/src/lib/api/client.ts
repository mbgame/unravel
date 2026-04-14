/**
 * Axios HTTP client instance with auth interceptors.
 * Attaches Bearer tokens, handles 401 → token refresh → retry,
 * and clears auth state on unrecoverable auth failures.
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, HTTP_STATUS } from '../../constants/api.constants';

/** Augment Axios request config to track retry state. */
interface RetryableConfig extends InternalAxiosRequestConfig {
  _isRetry?: boolean;
}

/**
 * Lazy imports to avoid circular dependencies with stores.
 * These are resolved at call-time, not module load-time.
 */
async function getAuthStore() {
  const { useAuthStore } = await import('../../stores/authStore');
  return useAuthStore.getState();
}

/** Resets all game-related stores (gamification, knot, UI). */
async function resetAllGameState() {
  const { useGamificationStore } = await import('../../stores/gamificationStore');
  const { useKnotStore } = await import('../../stores/knotStore');
  const { useUiStore } = await import('../../stores/uiStore');
  useGamificationStore.getState().reset();
  useKnotStore.getState().clearGraph();
  useUiStore.getState().closeModal();
}

async function getRefreshApi() {
  const { refresh } = await import('./auth.api');
  return refresh;
}

/**
 * Pre-configured Axios instance pointing at the backend API.
 * Base URL is read from the `NEXT_PUBLIC_API_URL` environment variable.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach access token ──────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  const { accessToken } = await getAuthStore();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor: handle 401 with token refresh ──────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableConfig | undefined;

    const is401 = error.response?.status === HTTP_STATUS.UNAUTHORIZED;
    const isRetry = originalConfig?._isRetry === true;
    const hasConfig = Boolean(originalConfig);

    if (!is401 || isRetry || !hasConfig || !originalConfig) {
      return Promise.reject(error);
    }

    // Mark as retried to prevent infinite loops
    originalConfig._isRetry = true;

    try {
      // Attempt to get a new access token using the refresh token.
      // The refresh token is sent as a cookie by the browser automatically.
      const refreshFn = await getRefreshApi();
      const { accessToken: newToken } = await refreshFn('');

      const authStore = await getAuthStore();
      authStore.setAccessToken(newToken);

      // Retry original request with new token
      if (originalConfig.headers) {
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalConfig);
    } catch {
      // Refresh failed — log out and redirect
      await resetAllGameState();
      const authStore = await getAuthStore();
      authStore.clearAuth();

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }
  },
);
