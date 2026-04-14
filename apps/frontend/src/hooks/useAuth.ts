/**
 * useAuth hook — combines authStore state with login/register/logout mutations.
 * Provides a single interface for all auth operations in components.
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useKnotStore } from '../stores/knotStore';
import { useUiStore } from '../stores/uiStore';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  type LoginDto,
  type RegisterDto,
} from '../lib/api/auth.api';

/** Return type of the useAuth hook. */
export interface UseAuthReturn {
  /** Currently authenticated user, or null. */
  user: ReturnType<typeof useAuthStore.getState>['user'];
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Whether a login mutation is in flight. */
  isLoggingIn: boolean;
  /** Whether a register mutation is in flight. */
  isRegistering: boolean;
  /** Error from the last login attempt, if any. */
  loginError: Error | null;
  /** Error from the last register attempt, if any. */
  registerError: Error | null;
  /**
   * Initiates login with email/password credentials.
   * On success, updates authStore with user and access token.
   */
  loginMutate: (dto: LoginDto) => void;
  /**
   * Initiates user registration.
   * On success, updates authStore with user and access token.
   */
  registerMutate: (dto: RegisterDto) => void;
  /**
   * Logs out the authenticated user.
   * Calls the logout API, then clears authStore state.
   */
  logoutMutate: () => void;
}

/**
 * Hook providing auth state and mutation functions.
 *
 * @example
 * ```tsx
 * const { user, loginMutate, isLoggingIn } = useAuth();
 * loginMutate({ email, password });
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const resetGamification = useGamificationStore((s) => s.reset);
  const clearGraph = useKnotStore((s) => s.clearGraph);

  /** Resets all game-related stores so no stale data leaks between accounts. */
  const resetAllGameState = () => {
    resetGamification();
    clearGraph();
    useUiStore.getState().closeModal();
  };

  const loginMutation = useMutation({
    mutationFn: (dto: LoginDto) => loginApi(dto),
    onSuccess: (data) => {
      resetAllGameState();
      setAuth(data.user, data.accessToken);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (dto: RegisterDto) => registerApi(dto),
    onSuccess: (data) => {
      resetAllGameState();
      setAuth(data.user, data.accessToken);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(),
    onSettled: () => {
      resetAllGameState();
      clearAuth();
    },
  });

  return {
    user,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    loginMutate: loginMutation.mutate,
    registerMutate: registerMutation.mutate,
    logoutMutate: logoutMutation.mutate,
  };
}
