/**
 * OfflineBanner — displays a dismissible notice when the user is offline.
 * Listens to `navigator.onLine` and the `online`/`offline` window events.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Banner component that appears at the top of the screen when offline.
 * Automatically hides when connectivity is restored.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state after mount (navigator.onLine is unreliable during SSR)
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-black"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          You are offline — some features may be unavailable
        </motion.div>
      )}
    </AnimatePresence>
  );
}
