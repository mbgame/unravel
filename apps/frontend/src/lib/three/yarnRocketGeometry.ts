/**
 * yarnRocketGeometry — procedural geometry for a 3D yarn rocket (Level 5).
 *
 * Rocket structure:
 *   Body (upper + lower), nose cone, 3 fins, 2 windows, exhaust nozzle,
 *   2 boosters, antenna, flame, hatch.
 */

import * as THREE from 'three';

export type RocketPartType =
  | 'rocketBodyUpper'   // Upper fuselage cylinder
  | 'rocketBodyLower'   // Lower fuselage cylinder
  | 'rocketNoseCone'    // Pointed nose cone
  | 'rocketFinA'        // Fin (angled flat panel)
  | 'rocketFinB'        // Fin
  | 'rocketFinC'        // Fin (back)
  | 'rocketWindowA'     // Circular porthole
  | 'rocketWindowB'     // Circular porthole
  | 'rocketNozzle'      // Exhaust bell
  | 'rocketBoosterL'    // Left side booster
  | 'rocketBoosterR'    // Right side booster
  | 'rocketAntenna'     // Thin antenna on nose
  | 'rocketFlame'       // Exhaust flame (cone)
  | 'rocketHatch'       // Door/hatch on body
  | 'rocketStripeA'     // Decorative ring stripe
  | 'rocketStripeB';    // Decorative ring stripe

export interface RocketPartGeometryResult {
  coreGeometry: THREE.BufferGeometry;
  spiralGeometries: THREE.TubeGeometry[];
  dispose: () => void;
}

export function createRocketPartGeometry(
  partType: RocketPartType,
): RocketPartGeometryResult {
  let core: THREE.BufferGeometry;

  switch (partType) {
    // ── Body ──────────────────────────────────────────────────────────
    case 'rocketBodyUpper': {
      core = new THREE.CylinderGeometry(0.35, 0.38, 1.0, 12);
      break;
    }
    case 'rocketBodyLower': {
      core = new THREE.CylinderGeometry(0.38, 0.40, 0.8, 12);
      break;
    }

    // ── Nose Cone ─────────────────────────────────────────────────────
    case 'rocketNoseCone': {
      core = new THREE.ConeGeometry(0.35, 0.7, 12);
      break;
    }

    // ── Fins ──────────────────────────────────────────────────────────
    case 'rocketFinA': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.4, 0);
      shape.lineTo(0.1, 0.6);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
      core.translate(-0.15, -0.3, -0.02);
      break;
    }
    case 'rocketFinB': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.4, 0);
      shape.lineTo(0.1, 0.6);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
      core.translate(-0.15, -0.3, -0.02);
      core.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI * 0.67));
      break;
    }
    case 'rocketFinC': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.4, 0);
      shape.lineTo(0.1, 0.6);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
      core.translate(-0.15, -0.3, -0.02);
      core.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI * 0.67));
      break;
    }

    // ── Windows ───────────────────────────────────────────────────────
    case 'rocketWindowA':
    case 'rocketWindowB': {
      core = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
      core.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      break;
    }

    // ── Nozzle ────────────────────────────────────────────────────────
    case 'rocketNozzle': {
      // Bell shape: wider at bottom
      core = new THREE.CylinderGeometry(0.22, 0.32, 0.3, 12);
      break;
    }

    // ── Boosters — tilted slightly outward ──────────────────────────
    case 'rocketBoosterL': {
      core = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 8);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI * 0.05));
      break;
    }
    case 'rocketBoosterR': {
      core = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 8);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI * 0.05));
      break;
    }

    // ── Antenna ───────────────────────────────────────────────────────
    case 'rocketAntenna': {
      core = new THREE.CylinderGeometry(0.015, 0.02, 0.35, 6);
      break;
    }

    // ── Flame ─────────────────────────────────────────────────────────
    case 'rocketFlame': {
      core = new THREE.ConeGeometry(0.25, 0.5, 10);
      // Point downward
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI));
      break;
    }

    // ── Hatch ─────────────────────────────────────────────────────────
    case 'rocketHatch': {
      core = new THREE.BoxGeometry(0.2, 0.3, 0.05);
      break;
    }

    // ── Decorative stripes ────────────────────────────────────────────
    case 'rocketStripeA':
    case 'rocketStripeB': {
      core = new THREE.TorusGeometry(0.38, 0.03, 8, 24);
      core.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      break;
    }
  }

  return {
    coreGeometry: core,
    spiralGeometries: [],
    dispose() { core.dispose(); },
  };
}
