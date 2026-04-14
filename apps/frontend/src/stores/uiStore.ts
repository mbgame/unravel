/**
 * UI state store — manages modals, toasts, and global UI flags.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Supported modal identifiers. */
export type ModalId = 'pause' | 'levelComplete' | 'settings' | 'hint' | null;

/** A single toast notification. */
export interface Toast {
  /** Unique identifier for the toast. */
  id: string;
  /** Text to display. */
  message: string;
  /** Visual style of the toast. */
  type: 'success' | 'error' | 'info' | 'warning';
  /** Auto-dismiss duration in milliseconds. */
  durationMs?: number;
}

/** Shape of the UI state slice. */
interface UiState {
  /** Currently open modal, or null if none. */
  activeModal: ModalId;
  /** Active toast notifications. */
  toasts: Toast[];
  /** Whether the game is visually paused (affects overlay rendering). */
  isPaused: boolean;
  /** Camera zoom level: 0 = default, -1 = max zoom out, +1 = max zoom in. */
  zoom: number;
}

/** Actions available on the UI store. */
interface UiActions {
  /**
   * Opens a modal by ID.
   * @param modal - Modal identifier to open
   */
  openModal: (modal: Exclude<ModalId, null>) => void;
  /** Closes the currently open modal. */
  closeModal: () => void;
  /**
   * Adds a toast notification.
   * @param toast - Toast data (id must be unique)
   */
  addToast: (toast: Toast) => void;
  /**
   * Removes a toast by ID.
   * @param id - ID of the toast to dismiss
   */
  removeToast: (id: string) => void;
  /**
   * Sets the paused UI flag.
   * @param value - Whether to show paused state
   */
  setIsPaused: (value: boolean) => void;
  /** Sets the camera zoom level (clamped -1 to +1). */
  setZoom: (value: number) => void;
}

const INITIAL_STATE: UiState = {
  activeModal: null,
  toasts: [],
  isPaused: false,
  zoom: 0,
};

/**
 * Zustand store for UI state (modals, toasts, pause overlay).
 * DevTools enabled in development mode only.
 */
export const useUiStore = create<UiState & UiActions>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      openModal: (modal) =>
        set({ activeModal: modal }, false, 'ui/openModal'),

      closeModal: () =>
        set({ activeModal: null }, false, 'ui/closeModal'),

      addToast: (toast) =>
        set((state) => ({ toasts: [...state.toasts, toast] }), false, 'ui/addToast'),

      removeToast: (id) =>
        set(
          (state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }),
          false,
          'ui/removeToast',
        ),

      setIsPaused: (value) =>
        set({ isPaused: value }, false, 'ui/setIsPaused'),

      setZoom: (value) =>
        set({ zoom: Math.max(-1, Math.min(1, value)) }, false, 'ui/setZoom'),
    }),
    { name: 'UiStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
