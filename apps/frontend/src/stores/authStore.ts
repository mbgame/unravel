/**
 * Auth store — persists authentication state across sessions.
 * Access token and user data are persisted to localStorage so the
 * session survives page reloads and full-page navigations.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@unravel/shared-types';

/** Shape of the auth state slice. */
interface AuthState {
  /** Authenticated user data, null if not logged in. */
  user: User | null;
  /** JWT access token, persisted to localStorage. */
  accessToken: string | null;
  /** Whether the user is currently authenticated. */
  isAuthenticated: boolean;
}

/** Actions available on the auth store. */
interface AuthActions {
  /**
   * Sets authenticated state with user and token.
   * Called after successful login or token refresh.
   *
   * @param user - Authenticated user data
   * @param accessToken - JWT access token
   */
  setAuth: (user: User, accessToken: string) => void;
  /**
   * Clears all authentication state.
   * Called on logout or token expiry.
   */
  clearAuth: () => void;
  /**
   * Updates just the access token (e.g. after silent refresh).
   * @param accessToken - New JWT access token
   */
  setAccessToken: (accessToken: string) => void;
}

const INITIAL_STATE: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

/**
 * Zustand store for authentication state.
 * Persisted to localStorage so the session survives page reloads.
 * DevTools enabled in development mode only.
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        setAuth: (user, accessToken) =>
          set({ user, accessToken, isAuthenticated: true }, false, 'auth/setAuth'),

        clearAuth: () =>
          set(INITIAL_STATE, false, 'auth/clearAuth'),

        setAccessToken: (accessToken) =>
          set({ accessToken }, false, 'auth/setAccessToken'),
      }),
      {
        name: 'unravel-auth',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
