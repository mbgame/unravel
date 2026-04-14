/**
 * DebugPanel — Leva-based GUI for tweaking animation, lighting, shadows,
 * camera, ground, and colours at runtime.  Only rendered in dev mode.
 *
 * Values are exposed via a zustand store so any component can read them.
 */

'use client';

import { useControls, folder, Leva } from 'leva';
import { create } from 'zustand';

// ── Debug store — readable from anywhere ─────────────────────────────────

export interface DebugValues {
  // Animation
  unravelDuration: number;
  travelDuration: number;
  flyDuration: number;
  spawnDuration: number;
  zigzagRowHeight: number;
  threadRadius: number;
  spindleTurns: number;
  arcHeight: number;

  // Lighting
  ambientIntensity: number;
  keyLightIntensity: number;
  keyLightX: number;
  keyLightY: number;
  keyLightZ: number;
  fillLightIntensity: number;
  fillLightX: number;
  fillLightY: number;
  fillLightZ: number;
  rimLightIntensity: number;
  rimLightColor: string;

  // Fake Shadow
  shadowOpacity: number;
  shadowSoftness: number;
  shadowNoise: number;
  shadowScaleX: number;
  shadowScaleZ: number;

  // Ground
  groundY: number;
  groundSize: number;
  groundVisible: boolean;

  // Camera / Controls
  orbitDamping: number;
  orbitRotateSpeed: number;
  minPolarAngle: number;
  maxPolarAngle: number;

  // Coin animation
  coinDuration: number;
  coinSpinStart: number;

  // Colors
  houseBlue: string;
  houseGreen: string;
  houseOrange: string;
  emissiveIntensity: number;
  coreColorMultiplier: number;
  materialRoughness: number;
  materialMetalness: number;
}

const DEFAULTS: DebugValues = {
  // Animation
  unravelDuration: 0.3,
  travelDuration: 0.6,
  flyDuration: 0.35,
  spawnDuration: 0.1,
  zigzagRowHeight: 0.04,
  threadRadius: 0.01,
  spindleTurns: 3.0,
  arcHeight: 0.15,

  // Lighting
  ambientIntensity: 5,
  keyLightIntensity: 3,
  keyLightX: 5,
  keyLightY: 10,
  keyLightZ: 7,
  fillLightIntensity: 1.4,
  fillLightX: 0,
  fillLightY: 4,
  fillLightZ: 6,
  rimLightIntensity: 0.35,
  rimLightColor: '#b8d4ff',

  // Fake Shadow
  shadowOpacity: 0.18,
  shadowSoftness: 1.0,
  shadowNoise: 0.08,
  shadowScaleX: 1.0,
  shadowScaleZ: 0.7,

  // Ground
  groundY: -0.8,
  groundSize: 8,
  groundVisible: true,

  // Camera / Controls
  orbitDamping: 0.08,
  orbitRotateSpeed: 0.6,
  minPolarAngle: 0.2,
  maxPolarAngle: 0.8,

  // Coin animation
  coinDuration: 2.3,
  coinSpinStart: 6.5,

  // Colors
  houseBlue: '#7EC8E3',
  houseGreen: '#A8D5A2',
  houseOrange: '#F4B183',
  emissiveIntensity: 0.38,
  coreColorMultiplier: 0.48,
  materialRoughness: 0.78,
  materialMetalness: 0.02,
};

export const useDebugStore = create<DebugValues>()(() => ({ ...DEFAULTS }));

// ── Component ────────────────────────────────────────────────────────────

export function DebugPanel() {
  const isDev = process.env.NODE_ENV === 'development';

  const values = useControls({
    Coin: folder({
      coinDuration: { value: DEFAULTS.coinDuration, min: 0.3, max: 4.0, step: 0.05, label: 'Duration (s)' },
      coinSpinStart: { value: DEFAULTS.coinSpinStart, min: 0, max: 20, step: 0.5, label: 'Spin (r/s)' },
    }, { collapsed: true }),

    Animation: folder({
      unravelDuration: { value: DEFAULTS.unravelDuration, min: 0.1, max: 2, step: 0.05, label: 'Unravel (s)' },
      travelDuration: { value: DEFAULTS.travelDuration, min: 0.1, max: 2, step: 0.05, label: 'Travel (s)' },
      flyDuration: { value: DEFAULTS.flyDuration, min: 0.1, max: 2, step: 0.05, label: 'Fly (s)' },
      spawnDuration: { value: DEFAULTS.spawnDuration, min: 0.01, max: 1, step: 0.01, label: 'Spawn (s)' },
      zigzagRowHeight: { value: DEFAULTS.zigzagRowHeight, min: 0.01, max: 0.5, step: 0.01, label: 'Row Height' },
      threadRadius: { value: DEFAULTS.threadRadius, min: 0.005, max: 0.15, step: 0.005, label: 'Thread Radius' },
      spindleTurns: { value: DEFAULTS.spindleTurns, min: 1, max: 8, step: 0.5, label: 'Spindle Turns' },
      arcHeight: { value: DEFAULTS.arcHeight, min: 0, max: 1, step: 0.05, label: 'Arc Height' },
    }, { collapsed: true }),

    Lighting: folder({
      ambientIntensity: { value: DEFAULTS.ambientIntensity, min: 0, max: 10, step: 0.1, label: 'Ambient' },
      keyLightIntensity: { value: DEFAULTS.keyLightIntensity, min: 0, max: 10, step: 0.1, label: 'Key Light' },
      keyLightX: { value: DEFAULTS.keyLightX, min: -20, max: 20, step: 0.5, label: 'Key X' },
      keyLightY: { value: DEFAULTS.keyLightY, min: -20, max: 20, step: 0.5, label: 'Key Y' },
      keyLightZ: { value: DEFAULTS.keyLightZ, min: -20, max: 20, step: 0.5, label: 'Key Z' },
      fillLightIntensity: { value: DEFAULTS.fillLightIntensity, min: 0, max: 4, step: 0.1, label: 'Fill Light' },
      fillLightX: { value: DEFAULTS.fillLightX, min: -20, max: 20, step: 0.5, label: 'Fill X' },
      fillLightY: { value: DEFAULTS.fillLightY, min: -20, max: 20, step: 0.5, label: 'Fill Y' },
      fillLightZ: { value: DEFAULTS.fillLightZ, min: -20, max: 20, step: 0.5, label: 'Fill Z' },
      rimLightIntensity: { value: DEFAULTS.rimLightIntensity, min: 0, max: 2, step: 0.05, label: 'Rim Light' },
      rimLightColor: { value: DEFAULTS.rimLightColor, label: 'Rim Color' },
    }, { collapsed: true }),

    'Fake Shadow': folder({
      shadowOpacity: { value: DEFAULTS.shadowOpacity, min: 0, max: 0.5, step: 0.01, label: 'Opacity' },
      shadowSoftness: { value: DEFAULTS.shadowSoftness, min: 0.2, max: 3, step: 0.05, label: 'Softness' },
      shadowNoise: { value: DEFAULTS.shadowNoise, min: 0, max: 0.3, step: 0.01, label: 'Edge Noise' },
      shadowScaleX: { value: DEFAULTS.shadowScaleX, min: 0.2, max: 3, step: 0.05, label: 'Scale X' },
      shadowScaleZ: { value: DEFAULTS.shadowScaleZ, min: 0.2, max: 3, step: 0.05, label: 'Scale Z' },
    }, { collapsed: true }),

    Ground: folder({
      groundVisible: { value: DEFAULTS.groundVisible, label: 'Visible' },
      groundY: { value: DEFAULTS.groundY, min: -5, max: 0, step: 0.1, label: 'Y Position' },
      groundSize: { value: DEFAULTS.groundSize, min: 2, max: 20, step: 0.5, label: 'Size' },
    }, { collapsed: true }),

    Camera: folder({
      orbitDamping: { value: DEFAULTS.orbitDamping, min: 0.01, max: 0.3, step: 0.01, label: 'Damping' },
      orbitRotateSpeed: { value: DEFAULTS.orbitRotateSpeed, min: 0.1, max: 2, step: 0.1, label: 'Rotate Speed' },
      minPolarAngle: { value: DEFAULTS.minPolarAngle, min: 0, max: 1, step: 0.05, label: 'Min Polar (×PI)' },
      maxPolarAngle: { value: DEFAULTS.maxPolarAngle, min: 0, max: 1, step: 0.05, label: 'Max Polar (×PI)' },
    }, { collapsed: true }),

    Material: folder({
      houseBlue: { value: DEFAULTS.houseBlue, label: 'House Blue' },
      houseGreen: { value: DEFAULTS.houseGreen, label: 'House Green' },
      houseOrange: { value: DEFAULTS.houseOrange, label: 'House Orange' },
      emissiveIntensity: { value: DEFAULTS.emissiveIntensity, min: 0, max: 1, step: 0.02, label: 'Emissive' },
      coreColorMultiplier: { value: DEFAULTS.coreColorMultiplier, min: 0.1, max: 1, step: 0.02, label: 'Core Darkening' },
      materialRoughness: { value: DEFAULTS.materialRoughness, min: 0, max: 1, step: 0.02, label: 'Roughness' },
      materialMetalness: { value: DEFAULTS.materialMetalness, min: 0, max: 1, step: 0.01, label: 'Metalness' },
    }, { collapsed: true }),
  });

  // Push every change into the zustand store so non-Leva code can read it
  useDebugStore.setState(values as DebugValues);

  if (!isDev) return null;

  return <Leva collapsed titleBar={{ title: 'Debug' }} />;
}
