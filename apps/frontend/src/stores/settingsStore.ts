/**
 * Settings store — persists user preferences across sessions.
 * Uses Zustand persist middleware to write to localStorage.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/** Quality tier for render settings. */
export type QualityTier = 'auto' | 'low' | 'medium' | 'high';

/** Shape of the settings state slice. */
interface SettingsState {
  /** Render quality tier. 'auto' lets usePerformance detect the right level. */
  quality: QualityTier;
  /** Whether sound effects are enabled. */
  soundEnabled: boolean;
  /** Whether background music is enabled. */
  musicEnabled: boolean;
  /** Whether haptic feedback (vibration) is enabled. */
  hapticEnabled: boolean;
}

/** Actions available on the settings store. */
interface SettingsActions {
  /**
   * Sets the quality tier.
   * @param quality - New quality value
   */
  setQuality: (quality: QualityTier) => void;
  /** Toggles sound effects on/off. */
  toggleSound: () => void;
  /** Toggles background music on/off. */
  toggleMusic: () => void;
  /** Toggles haptic feedback on/off. */
  toggleHaptic: () => void;
}

const INITIAL_STATE: SettingsState = {
  quality: 'auto',
  soundEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
};

/**
 * Zustand store for user settings, persisted to localStorage.
 * DevTools enabled in development mode only.
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        setQuality: (quality) =>
          set({ quality }, false, 'settings/setQuality'),

        toggleSound: () =>
          set((state) => ({ soundEnabled: !state.soundEnabled }), false, 'settings/toggleSound'),

        toggleMusic: () =>
          set((state) => ({ musicEnabled: !state.musicEnabled }), false, 'settings/toggleMusic'),

        toggleHaptic: () =>
          set(
            (state) => ({ hapticEnabled: !state.hapticEnabled }),
            false,
            'settings/toggleHaptic',
          ),
      }),
      { name: 'unravel-settings' },
    ),
    { name: 'SettingsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
