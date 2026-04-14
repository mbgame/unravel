/**
 * Gamification store — coins, XP, player level, and equipped cosmetics.
 * Persisted to localStorage so values survive page refreshes.
 * Synced from backend on login.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LevelCompletionResult, GamificationProfile } from '../lib/api/gamification.api';
import type { EquippedCosmetics } from '../lib/api/shop.api';

interface GamificationState {
  /** Total lifetime coins owned by the user. */
  coins: number;
  /** Coins earned in the current level session (not yet committed to backend). */
  pendingCoins: number;
  playerLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;

  /** Equipped cosmetic keys. */
  equippedYarnColor: string;
  equippedBackground: string;
  equippedCelebration: string;

  /** Whether a sync from backend has happened this session. */
  synced: boolean;
}

interface GamificationActions {
  /** Increment pendingCoins by n (called on each coin ball collected). */
  addPendingCoins: (n: number) => void;
  /** Apply backend level-completion result and reset pendingCoins. */
  commitLevelResult: (result: LevelCompletionResult) => void;
  /** Sync full profile from backend (on login / profile fetch). */
  syncFromBackend: (profile: GamificationProfile) => void;
  /** Sync equipped cosmetics from backend. */
  syncEquipped: (equipped: EquippedCosmetics) => void;
  /** Update a single equipped cosmetic type after equipping in shop. */
  setEquipped: (type: 'yarn_color' | 'background' | 'celebration', key: string) => void;
  /** Update coin balance after a shop purchase. */
  setCoins: (coins: number) => void;
  /** Reset pendingCoins to 0 (called on retry / quit). */
  resetPending: () => void;
  /** Reset all gamification state to defaults (called on logout / account switch). */
  reset: () => void;
}

const INITIAL_STATE: GamificationState = {
  coins: 0,
  pendingCoins: 0,
  playerLevel: 1,
  totalXp: 0,
  xpToNextLevel: 100,
  xpForCurrentLevel: 0,
  equippedYarnColor: 'default',
  equippedBackground: 'sky',
  equippedCelebration: 'confetti',
  synced: false,
};

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        addPendingCoins: (n) =>
          set((s) => ({ pendingCoins: s.pendingCoins + n }), false, 'gamification/addPendingCoins'),

        commitLevelResult: (result) =>
          set(
            {
              coins: result.newCoins,
              totalXp: result.newTotalXp,
              playerLevel: result.newPlayerLevel,
              xpToNextLevel: result.xpToNextLevel,
              pendingCoins: 0,
            },
            false,
            'gamification/commitLevelResult',
          ),

        syncFromBackend: (profile) =>
          set(
            {
              coins: profile.coins,
              totalXp: profile.totalXp,
              playerLevel: profile.playerLevel,
              xpToNextLevel: profile.xpToNextLevel,
              xpForCurrentLevel: profile.xpForCurrentLevel,
              synced: true,
            },
            false,
            'gamification/syncFromBackend',
          ),

        syncEquipped: (equipped) =>
          set(
            {
              equippedYarnColor: equipped.yarnColor,
              equippedBackground: equipped.background,
              equippedCelebration: equipped.celebration,
            },
            false,
            'gamification/syncEquipped',
          ),

        setEquipped: (type, key) =>
          set(
            (s) => ({
              equippedYarnColor:   type === 'yarn_color'   ? key : s.equippedYarnColor,
              equippedBackground:  type === 'background'   ? key : s.equippedBackground,
              equippedCelebration: type === 'celebration'  ? key : s.equippedCelebration,
            }),
            false,
            'gamification/setEquipped',
          ),

        setCoins: (coins) =>
          set({ coins }, false, 'gamification/setCoins'),

        resetPending: () =>
          set({ pendingCoins: 0 }, false, 'gamification/resetPending'),

        reset: () =>
          set(INITIAL_STATE, false, 'gamification/reset'),
      }),
      {
        name: 'unravel-gamification',
        partialize: (s): Partial<GamificationState> => ({
          coins: s.coins,
          playerLevel: s.playerLevel,
          totalXp: s.totalXp,
          xpToNextLevel: s.xpToNextLevel,
          xpForCurrentLevel: s.xpForCurrentLevel,
          equippedYarnColor: s.equippedYarnColor,
          equippedBackground: s.equippedBackground,
          equippedCelebration: s.equippedCelebration,
        }),
      },
    ),
    { name: 'GamificationStore' },
  ),
);
