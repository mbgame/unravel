/**
 * yarnCastleGeometry — procedural geometry for a 3D yarn castle (Level 4).
 *
 * Castle structure:
 *   2 front towers, 2 back towers, front wall, back wall, 2 side walls,
 *   gate, drawbridge, 4 battlements (tower tops), flag, 2 windows.
 */

import * as THREE from 'three';

export type CastlePartType =
  | 'castleTowerFrontL'   // Left front tower (cylinder)
  | 'castleTowerFrontR'   // Right front tower
  | 'castleTowerBackL'    // Left back tower
  | 'castleTowerBackR'    // Right back tower
  | 'castleWallFront'     // Front wall between towers
  | 'castleWallBack'      // Back wall
  | 'castleWallLeft'      // Left side wall
  | 'castleWallRight'     // Right side wall
  | 'castleGate'          // Arched gate opening
  | 'castleDrawbridge'    // Flat drawbridge plank
  | 'castleBattlementFL'  // Battlement cap on front-left tower
  | 'castleBattlementFR'  // Battlement cap on front-right tower
  | 'castleBattlementBL'  // Battlement cap on back-left tower
  | 'castleBattlementBR'  // Battlement cap on back-right tower
  | 'castleFlag'          // Flag on a tower
  | 'castleWindowL'       // Left window
  | 'castleWindowR';      // Right window

export interface CastlePartGeometryResult {
  coreGeometry: THREE.BufferGeometry;
  spiralGeometries: THREE.TubeGeometry[];
  dispose: () => void;
}

export function createCastlePartGeometry(
  partType: CastlePartType,
): CastlePartGeometryResult {
  let core: THREE.BufferGeometry;

  switch (partType) {
    // ── Towers ─────────────────────────────────────────────────────────
    case 'castleTowerFrontL':
    case 'castleTowerFrontR':
    case 'castleTowerBackL':
    case 'castleTowerBackR': {
      core = new THREE.CylinderGeometry(0.25, 0.28, 1.6, 10);
      break;
    }

    // ── Walls ──────────────────────────────────────────────────────────
    case 'castleWallFront':
    case 'castleWallBack': {
      core = new THREE.BoxGeometry(1.2, 1.0, 0.12);
      break;
    }
    case 'castleWallLeft':
    case 'castleWallRight': {
      core = new THREE.BoxGeometry(0.12, 1.0, 1.0);
      break;
    }

    // ── Gate ───────────────────────────────────────────────────────────
    case 'castleGate': {
      // Arched gate: box with a half-cylinder cutout feel
      core = new THREE.BoxGeometry(0.5, 0.7, 0.14);
      break;
    }

    // ── Drawbridge ────────────────────────────────────────────────────
    case 'castleDrawbridge': {
      core = new THREE.BoxGeometry(0.5, 0.04, 0.6);
      break;
    }

    // ── Battlements (tower caps) ──────────────────────────────────────
    case 'castleBattlementFL':
    case 'castleBattlementFR':
    case 'castleBattlementBL':
    case 'castleBattlementBR': {
      // Cone-shaped tower roof
      core = new THREE.ConeGeometry(0.30, 0.4, 10);
      break;
    }

    // ── Flag ──────────────────────────────────────────────────────────
    case 'castleFlag': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.3, 0.06);
      shape.lineTo(0, 0.18);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
      break;
    }

    // ── Windows ───────────────────────────────────────────────────────
    case 'castleWindowL':
    case 'castleWindowR': {
      core = new THREE.BoxGeometry(0.18, 0.25, 0.08);
      break;
    }
  }

  return {
    coreGeometry: core,
    spiralGeometries: [],
    dispose() { core.dispose(); },
  };
}
