/**
 * Performance monitoring hook — detects GPU quality tier and monitors FPS.
 * Auto-downgrades quality if FPS drops below threshold for a sustained period.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  FPS_DOWNGRADE_THRESHOLD,
  FPS_DOWNGRADE_WINDOW_MS,
} from '../constants/game.constants';
import { QUALITY_PRESETS } from '../lib/three/qualityPresets';
import type { QualityPreset } from '../lib/three/qualityPresets';
import type { QualityTier } from '../stores/settingsStore';

/** Return value of the usePerformance hook. */
export interface PerformanceInfo {
  /** Currently active quality tier. */
  qualityTier: Exclude<QualityTier, 'auto'>;
  /** Currently active quality preset object. */
  preset: QualityPreset;
  /** Current smoothed FPS reading. */
  fps: number;
  /** Manually override the quality tier. */
  setQualityTier: (tier: Exclude<QualityTier, 'auto'>) => void;
}

/**
 * Detects the initial quality tier based on GPU and device heuristics.
 * Falls back to 'medium' if no GPU info is available.
 */
function detectInitialTier(): Exclude<QualityTier, 'auto'> {
  if (typeof window === 'undefined') return 'medium';

  // Check for low-memory devices (< 2GB RAM heuristic)
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return 'low';

  // Check for low-core-count devices (likely budget phones)
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return 'low';

  // Check DPR as a proxy for device class (high-end devices have high DPR)
  if (window.devicePixelRatio >= 3) return 'high';
  if (window.devicePixelRatio >= 2) return 'medium';

  return 'medium';
}

/**
 * Hook for monitoring game performance and adjusting quality tier dynamically.
 * Must be used inside a component that is a descendant of the R3F Canvas.
 *
 * Monitors FPS using useFrame accumulation; if FPS stays below
 * FPS_DOWNGRADE_THRESHOLD for FPS_DOWNGRADE_WINDOW_MS, automatically
 * downgrades the quality tier.
 *
 * @returns PerformanceInfo object with current tier, preset, FPS, and setter
 */
export function usePerformance(): PerformanceInfo {
  const [qualityTier, setQualityTierState] = useState<Exclude<QualityTier, 'auto'>>(
    detectInitialTier,
  );

  const fpsRef = useRef<number>(60);
  const lowFpsAccumulatorRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const setQualityTier = useCallback((tier: Exclude<QualityTier, 'auto'>) => {
    setQualityTierState(tier);
  }, []);

  // Monitor FPS on every frame using delta time
  useFrame((_, delta) => {
    const instantFps = delta > 0 ? 1 / delta : 60;
    // Exponential moving average for smoothing
    fpsRef.current = fpsRef.current * 0.9 + instantFps * 0.1;

    if (fpsRef.current < FPS_DOWNGRADE_THRESHOLD) {
      lowFpsAccumulatorRef.current += delta * 1000;

      if (lowFpsAccumulatorRef.current >= FPS_DOWNGRADE_WINDOW_MS) {
        lowFpsAccumulatorRef.current = 0;
        setQualityTierState((prev) => {
          if (prev === 'high') return 'medium';
          if (prev === 'medium') return 'low';
          return prev; // Already at lowest
        });
      }
    } else {
      lowFpsAccumulatorRef.current = 0;
    }

    lastTimeRef.current = performance.now();
  });

  // Keep fps state in sync for external consumers
  const [fps, setFps] = useState<number>(60);
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.round(fpsRef.current));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return {
    qualityTier,
    preset: QUALITY_PRESETS[qualityTier],
    fps,
    setQualityTier,
  };
}
