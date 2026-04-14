/**
 * useAudio — Web Audio API wrapper for game sound effects.
 * Sounds are loaded lazily on the first user interaction to comply with
 * browser autoplay policies.
 * Respects the `soundEnabled` setting from settingsStore.
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/** Paths to the sound assets (relative to /public). */
const SOUND_PATHS = {
  move: '/assets/sounds/untangle.mp3',
  complete: '/assets/sounds/complete.mp3',
  error: '/assets/sounds/untangle.mp3', // reuse until dedicated asset exists
} as const;

type SoundName = keyof typeof SOUND_PATHS;

/** Return type of the useAudio hook. */
export interface UseAudioReturn {
  /** Plays the valid-move sound. */
  playMoveSound: () => void;
  /** Plays the level-complete sound. */
  playCompleteSound: () => void;
  /** Plays the invalid-move error sound. */
  playErrorSound: () => void;
}

/**
 * Hook providing Web Audio API–based sound playback.
 * Buffers are decoded once and cached for low-latency playback.
 *
 * @returns Object with play methods
 *
 * @example
 * ```tsx
 * const { playMoveSound } = useAudio();
 * playMoveSound();
 * ```
 */
export function useAudio(): UseAudioReturn {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const contextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundName, AudioBuffer>>>({});
  const loadedRef = useRef(false);

  /** Gets or creates the AudioContext. */
  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  /** Loads and decodes a single audio file. */
  const loadBuffer = useCallback(
    async (ctx: AudioContext, name: SoundName): Promise<void> => {
      try {
        const response = await fetch(SOUND_PATHS[name]);
        if (!response.ok) return;
        const arrayBuffer = await response.arrayBuffer();
        buffersRef.current[name] = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        // Silently fail — audio is non-critical
      }
    },
    [],
  );

  /** Loads all sound buffers on first user interaction. */
  const preload = useCallback(async () => {
    if (loadedRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    loadedRef.current = true;

    const names = Object.keys(SOUND_PATHS) as SoundName[];
    await Promise.all(names.map((name) => loadBuffer(ctx, name)));
  }, [getContext, loadBuffer]);

  // Attach one-time preload listener on first user interaction
  useEffect(() => {
    const handler = () => {
      void preload();
      window.removeEventListener('pointerdown', handler, true);
    };
    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, [preload]);

  /** Plays a decoded buffer at the given volume. */
  const playBuffer = useCallback(
    (name: SoundName, volume = 1.0) => {
      if (!soundEnabled) return;
      const ctx = getContext();
      const buffer = buffersRef.current[name];
      if (!ctx || !buffer) return;

      // Resume suspended context (required after page visibility change)
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    },
    [soundEnabled, getContext],
  );

  const playMoveSound = useCallback(() => playBuffer('move', 0.5), [playBuffer]);
  const playCompleteSound = useCallback(() => playBuffer('complete', 0.8), [playBuffer]);
  const playErrorSound = useCallback(() => playBuffer('error', 0.4), [playBuffer]);

  return { playMoveSound, playCompleteSound, playErrorSound };
}
