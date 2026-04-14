/**
 * SettingsPanel — in-game settings overlay.
 * Allows the player to change graphics quality, sound, music, and haptics.
 * Reads from and writes to settingsStore (persisted to localStorage).
 */

'use client';

import React, { useCallback } from 'react';
import { useSettingsStore, type QualityTier } from '../../../stores/settingsStore';

/** Display labels for quality tiers. */
const QUALITY_OPTIONS: { value: QualityTier; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
];

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  id: string;
}

/** Reusable labelled toggle switch row. */
const ToggleRow = React.memo(function ToggleRow({ label, checked, onChange, id }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <label htmlFor={id} className="text-sm font-medium text-white/90">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={[
          'relative h-7 w-12 rounded-full transition-colors',
          checked ? 'bg-brand-primary' : 'bg-white/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        ].join(' ')}
        aria-label={label}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
});

/**
 * Settings panel body — render inside PauseMenu or a standalone Modal.
 */
export const SettingsPanel = React.memo(function SettingsPanel() {
  const quality = useSettingsStore((s) => s.quality);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const toggleHaptic = useSettingsStore((s) => s.toggleHaptic);

  const handleQuality = useCallback(
    (value: QualityTier) => setQuality(value),
    [setQuality],
  );

  return (
    <div className="flex flex-col gap-1 px-2">
      <h3 className="mb-2 text-base font-semibold text-white/60 uppercase tracking-wider">
        Settings
      </h3>

      {/* Quality selector */}
      <div className="mb-2">
        <p className="mb-2 text-sm font-medium text-white/90">Graphics Quality</p>
        <div className="flex gap-2" role="group" aria-label="Graphics quality">
          {QUALITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              aria-pressed={quality === value}
              onClick={() => handleQuality(value)}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                'min-h-[48px] focus-visible:outline-none focus-visible:ring-2',
                quality === value
                  ? 'bg-brand-primary text-white focus-visible:ring-brand-primary'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 focus-visible:ring-white/30',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/10 rounded-xl bg-white/5 px-4">
        <ToggleRow
          id="toggle-sound"
          label="Sound Effects"
          checked={soundEnabled}
          onChange={toggleSound}
        />
        <ToggleRow
          id="toggle-music"
          label="Music"
          checked={musicEnabled}
          onChange={toggleMusic}
        />
        <ToggleRow
          id="toggle-haptics"
          label="Haptics"
          checked={hapticEnabled}
          onChange={toggleHaptic}
        />
      </div>
    </div>
  );
});
