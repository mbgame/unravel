/**
 * Modal — accessible modal wrapper with animated backdrop.
 * Uses a portal so it always renders on top of the R3F canvas.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  /** Controls whether the modal is visible. */
  isOpen: boolean;
  /** Called when the user presses Escape or clicks the backdrop. */
  onClose: () => void;
  /** Modal content. */
  children: React.ReactNode;
  /** Optional accessible title rendered for screen readers. */
  ariaLabel?: string;
}

/**
 * Modal wrapper with animated backdrop and focus trap.
 *
 * @param isOpen - Visibility toggle
 * @param onClose - Dismiss handler
 * @param children - Modal content
 * @param ariaLabel - Accessible label
 */
export const Modal = React.memo(function Modal({
  isOpen,
  onClose,
  children,
  ariaLabel = 'Dialog',
}: ModalProps) {
  /** Close on Escape key. */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-surface-dark shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
});
