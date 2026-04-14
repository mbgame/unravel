/**
 * GameCanvas — root R3F Canvas for the Unravel game.
 * No real shadow maps — uses a fake shader shadow on the ground plane instead.
 */

'use client';

import React, { Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { Scene } from './Scene';
import { CAMERA_FOV, CAMERA_Z } from '../../../constants/game.constants';

interface GameCanvasProps {
  children?: React.ReactNode;
}

function CanvasLoadingFallback() {
  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'transparent',
        color:          'rgba(0,80,160,0.55)',
        fontSize:       '1rem',
        fontFamily:     'sans-serif',
      }}
      aria-label="Loading game canvas"
    >
      Loading…
    </div>
  );
}

export const GameCanvas = memo(function GameCanvas({ children }: GameCanvasProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', touchAction: 'none' }}>
      <Suspense fallback={<CanvasLoadingFallback />}>
        <Canvas
          camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 100 }}
          dpr={[1, Math.min(window.devicePixelRatio, 2)]}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            alpha: true,
            localClippingEnabled: true,
          }}
          frameloop="always"
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', background: 'transparent' }}
          onCreated={({ gl }) => {
            gl.domElement.style.touchAction = 'none';
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Scene>{children}</Scene>
          {isDev && <Stats />}
        </Canvas>
      </Suspense>
    </div>
  );
});
