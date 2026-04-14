/**
 * Toast — notification component that auto-dismisses.
 * Render ToastContainer once at the app root; individual
 * toasts are managed via uiStore.
 */

'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore, type Toast as ToastData } from '../../stores/uiStore';

/** Default auto-dismiss delay in milliseconds. */
const DEFAULT_DURATION_MS = 3000;

/** Icon map for each toast type. */
const ICONS: Record<ToastData['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

/** Colour classes for each toast type. */
const TYPE_CLASSES: Record<ToastData['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

interface SingleToastProps {
  toast: ToastData;
}

/**
 * Renders a single dismissible toast and starts its auto-dismiss timer.
 */
const SingleToast = React.memo(function SingleToast({ toast }: SingleToastProps) {
  const removeToast = useUiStore((s) => s.removeToast);
  const duration = toast.durationMs ?? DEFAULT_DURATION_MS;

  useEffect(() => {
    const id = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(id);
  }, [toast.id, duration, removeToast]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={[
        'flex items-center gap-3 rounded-xl px-4 py-3',
        'min-w-[240px] max-w-[320px] text-white shadow-lg',
        TYPE_CLASSES[toast.type],
      ].join(' ')}
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true" className="text-lg font-bold">
        {ICONS[toast.type]}
      </span>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={() => removeToast(toast.id)}
        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/20"
      >
        ✕
      </button>
    </motion.li>
  );
});

/**
 * ToastContainer — place once near the root of the app.
 * Reads toasts from uiStore and renders them in a fixed overlay.
 */
export const ToastContainer = React.memo(function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <ul
      aria-label="Notifications"
      className="fixed bottom-safe-bottom right-4 z-[100] flex flex-col gap-2"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <SingleToast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </ul>
  );
});
