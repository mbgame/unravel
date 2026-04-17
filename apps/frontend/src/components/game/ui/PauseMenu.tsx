/**
 * PauseMenu — modal shown when the game is paused.
 * Provides Resume, Restart, Settings, and Quit actions.
 * Uses a blurred backdrop and Framer Motion transitions.
 */

'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../../stores/gameStore';
// resumeGame / startLevel / currentLevel removed — yarn game manages its own phase
import { useUiStore } from '../../../stores/uiStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { SettingsPanel } from './SettingsPanel';

type PauseView = 'menu' | 'settings';

interface PauseMenuProps {
  /** Called when the player chooses Restart from the pause menu. */
  onRestart?: () => void;
}

/**
 * Pause menu modal.
 * Reads open state from uiStore; transitions game phase via gameStore.
 */
export const PauseMenu = React.memo(function PauseMenu({ onRestart }: PauseMenuProps) {
  const router = useRouter();
  const [view, setView] = useState<PauseView>('menu');

  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal  = useUiStore((s) => s.closeModal);
  const setIsPaused = useUiStore((s) => s.setIsPaused);
  const resetGame   = useGameStore((s) => s.resetGame);

  const isOpen = activeModal === 'pause';

  const handleResume = useCallback(() => {
    setIsPaused(false);
    closeModal();
    setView('menu');
  }, [setIsPaused, closeModal]);

  const handleRestart = useCallback(() => {
    resetGame();
    setIsPaused(false);
    closeModal();
    setView('menu');
    onRestart?.();
  }, [resetGame, setIsPaused, closeModal, onRestart]);

  const handleQuit = useCallback(() => {
    resetGame();
    closeModal();
    setIsPaused(false);
    setView('menu');
    router.push('/');
  }, [resetGame, closeModal, setIsPaused, router]);

  return (
    <Modal isOpen={isOpen} onClose={handleResume} ariaLabel="Pause menu">
      <div className="px-6 py-8">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'menu' ? (
            <motion.div
              key="pause-menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <h2 className="mb-2 text-center text-2xl font-bold text-white">Paused</h2>

              <Button variant="primary" onClick={handleResume} aria-label="Resume game">
                Resume
              </Button>
              <Button variant="secondary" onClick={handleRestart} aria-label="Restart level">
                Restart
              </Button>
              <Button
                variant="secondary"
                onClick={() => setView('settings')}
                aria-label="Open settings"
              >
                Settings
              </Button>
              <Button variant="ghost" onClick={handleQuit} aria-label="Quit to main menu">
                Quit
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="pause-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <button
                onClick={() => setView('menu')}
                aria-label="Back to pause menu"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
              >
                ← Back
              </button>
              <SettingsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
});
