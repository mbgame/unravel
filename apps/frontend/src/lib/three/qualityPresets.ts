/**
 * Quality preset constants for the Three.js renderer.
 * Applied based on the detected or user-selected quality tier.
 */

import {
  TUBE_SEGMENTS_HIGH,
  TUBE_SEGMENTS_MEDIUM,
  TUBE_SEGMENTS_LOW,
  PARTICLE_COUNT_HIGH,
  PARTICLE_COUNT_MEDIUM,
  PARTICLE_COUNT_LOW,
} from '../../constants/game.constants';

/** Configuration applied to the R3F Canvas and scene for a given quality level. */
export interface QualityPreset {
  /** Device pixel ratio cap. */
  dpr: [number, number];
  /** Whether antialiasing is enabled. */
  antialias: boolean;
  /** Maximum tube segments per string (controls geometry complexity). */
  maxStringSegments: number;
  /** Number of ambient particles. */
  particleCount: number;
  /** Number of radial segments for tube cross-section. */
  radialSegments: number;
  /** Human-readable label. */
  label: string;
}

/** Preset for high-end desktop / flagship mobile. */
export const HIGH_QUALITY: QualityPreset = {
  dpr: [1, 2],
  antialias: true,
  maxStringSegments: TUBE_SEGMENTS_HIGH,
  particleCount: PARTICLE_COUNT_HIGH,
  radialSegments: 8,
  label: 'High',
};

/** Preset for mid-range mobile devices. */
export const MEDIUM_QUALITY: QualityPreset = {
  dpr: [1, 1.5],
  antialias: false,
  maxStringSegments: TUBE_SEGMENTS_MEDIUM,
  particleCount: PARTICLE_COUNT_MEDIUM,
  radialSegments: 6,
  label: 'Medium',
};

/** Preset for low-end mobile devices. */
export const LOW_QUALITY: QualityPreset = {
  dpr: [1, 1],
  antialias: false,
  maxStringSegments: TUBE_SEGMENTS_LOW,
  particleCount: PARTICLE_COUNT_LOW,
  radialSegments: 4,
  label: 'Low',
};

/** Map from tier name to preset object for easy lookup. */
export const QUALITY_PRESETS: Record<'low' | 'medium' | 'high', QualityPreset> = {
  low: LOW_QUALITY,
  medium: MEDIUM_QUALITY,
  high: HIGH_QUALITY,
};
