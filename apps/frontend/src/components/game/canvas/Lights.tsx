/**
 * Lights — scene lighting. No shadow casting (fake shader shadow used instead).
 * All values driven by the debug panel store.
 */

'use client';

import React, { memo } from 'react';
import { useDebugStore } from '../debug/DebugPanel';

export const Lights = memo(function Lights() {
  const ambient  = useDebugStore((s) => s.ambientIntensity);
  const keyInt   = useDebugStore((s) => s.keyLightIntensity);
  const keyX     = useDebugStore((s) => s.keyLightX);
  const keyY     = useDebugStore((s) => s.keyLightY);
  const keyZ     = useDebugStore((s) => s.keyLightZ);
  const fillInt  = useDebugStore((s) => s.fillLightIntensity);
  const fillX    = useDebugStore((s) => s.fillLightX);
  const fillY    = useDebugStore((s) => s.fillLightY);
  const fillZ    = useDebugStore((s) => s.fillLightZ);
  const rimInt   = useDebugStore((s) => s.rimLightIntensity);
  const rimColor = useDebugStore((s) => s.rimLightColor);

  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight
        intensity={keyInt}
        position={[keyX, keyY, keyZ]}
      />
      <pointLight position={[fillX, fillY, fillZ]} intensity={fillInt} color="#ffffff" />
      <pointLight position={[-4, -3, -5]} intensity={rimInt} color={rimColor} />
    </>
  );
});
