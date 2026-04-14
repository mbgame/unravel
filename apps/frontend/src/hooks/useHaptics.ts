/**
 * useHaptics — wraps the Vibration API with feature detection.
 * All methods are no-ops if vibration is unsupported or haptics are disabled.
 */

'use client';

import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/** Vibration pattern for an error (invalid move). */
const ERROR_PATTERN: VibratePattern = [20, 50, 20];

/** Return type of the useHaptics hook. */
export interface UseHapticsReturn {
  /** Short pulse (20ms) — valid move feedback. */
  vibrateShort: () => void;
  /** Long pulse (100ms) — level complete feedback. */
  vibrateLong: () => void;
  /** Error pattern [20, 50, 20] — invalid move feedback. */
  vibrateError: () => void;
}

/**
 * Checks whether the Vibration API is available in the current environment.
 */
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Hook providing haptic feedback methods.
 * Respects the `hapticEnabled` setting from settingsStore.
 *
 * @returns Object with vibration methods
 *
 * @example
 * ```tsx
 * const { vibrateShort } = useHaptics();
 * // Call after a valid move:
 * vibrateShort();
 * ```
 */
export function useHaptics(): UseHapticsReturn {
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  const vibrate = useCallback(
    (pattern: VibratePattern) => {
      if (!hapticEnabled || !isVibrationSupported()) return;
      navigator.vibrate(pattern);
    },
    [hapticEnabled],
  );

  const vibrateShort = useCallback(() => vibrate(20), [vibrate]);
  const vibrateLong = useCallback(() => vibrate(100), [vibrate]);
  const vibrateError = useCallback(() => vibrate(ERROR_PATTERN), [vibrate]);

  return { vibrateShort, vibrateLong, vibrateError };
}
