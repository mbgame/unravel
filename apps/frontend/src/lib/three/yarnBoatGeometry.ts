/**
 * yarnBoatGeometry — procedural geometry for a 3D yarn sailboat (Level 3).
 *
 * Boat structure:
 *   Hull (left/right halves), Deck (left/right), Mast, Boom, Main Sail,
 *   Jib Sail, Cabin, Flag, Rudder, 2 Portholes, Bowsprit, Anchor, Crow's Nest.
 */

import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────────────────

export type BoatPartType =
  | 'boatHullLeft'      // Left half of the hull
  | 'boatHullRight'     // Right half of the hull
  | 'boatDeckLeft'      // Left deck plank
  | 'boatDeckRight'     // Right deck plank
  | 'boatMast'          // Tall vertical mast
  | 'boatBoom'          // Horizontal boom (holds main sail bottom)
  | 'boatMainSail'      // Large triangular main sail
  | 'boatJibSail'       // Smaller front jib sail
  | 'boatCabin'         // Small cabin box on deck
  | 'boatFlag'          // Small flag at mast top
  | 'boatRudder'        // Flat rudder at stern
  | 'boatPortholeL'     // Left porthole (small disc)
  | 'boatPortholeR'     // Right porthole (small disc)
  | 'boatBowsprit'      // Angled spar at the bow
  | 'boatAnchor'        // Small anchor shape
  | 'boatCrowsNest';    // Small platform at mast top

export interface BoatPartGeometryResult {
  coreGeometry: THREE.BufferGeometry;
  spiralGeometries: THREE.TubeGeometry[];
  dispose: () => void;
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createBoatPartGeometry(
  partType: BoatPartType,
): BoatPartGeometryResult {
  let core: THREE.BufferGeometry;

  switch (partType) {
    // ── Hull ───────────────────────────────────────────────────────────────
    case 'boatHullLeft': {
      // Tapered hull half — wider at center, narrower at bow/stern
      // Use a box stretched and slightly tapered via shear
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(-1.2, 0);
      shape.lineTo(-0.9, -0.5);
      shape.lineTo(0.9, -0.5);
      shape.lineTo(1.2, 0);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false });
      core.translate(0, 0, -0.35);
      break;
    }
    case 'boatHullRight': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(-1.2, 0);
      shape.lineTo(-0.9, -0.5);
      shape.lineTo(0.9, -0.5);
      shape.lineTo(1.2, 0);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false });
      core.translate(0, 0, 0);
      break;
    }

    // ── Deck ──────────────────────────────────────────────────────────────
    case 'boatDeckLeft': {
      core = new THREE.BoxGeometry(2.2, 0.06, 0.35);
      break;
    }
    case 'boatDeckRight': {
      core = new THREE.BoxGeometry(2.2, 0.06, 0.35);
      break;
    }

    // ── Mast ──────────────────────────────────────────────────────────────
    case 'boatMast': {
      core = new THREE.CylinderGeometry(0.04, 0.05, 1.8, 8);
      break;
    }

    // ── Boom — small vertical mast (holds jib sail) ────────────────────
    case 'boatBoom': {
      core = new THREE.CylinderGeometry(0.03, 0.035, 1.0, 8);
      break;
    }

    // ── Main Sail ─────────────────────────────────────────────────────────
    case 'boatMainSail': {
      // Large triangle: mast is left edge, boom is bottom
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);       // boom end (bottom-right)
      shape.lineTo(0, 1.4);     // mast top
      shape.lineTo(-0.9, 0);    // boom near mast
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
      core.translate(0, 0, -0.01);
      break;
    }

    // ── Jib Sail ──────────────────────────────────────────────────────────
    case 'boatJibSail': {
      // Smaller triangle stretching from mast top to bowsprit
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);       // bowsprit tip
      shape.lineTo(0.2, 1.2);   // mast top
      shape.lineTo(-0.6, 0);    // bow deck
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
      core.translate(0, 0, -0.01);
      break;
    }

    // ── Cabin ─────────────────────────────────────────────────────────────
    case 'boatCabin': {
      core = new THREE.BoxGeometry(0.5, 0.3, 0.4);
      break;
    }

    // ── Flag ──────────────────────────────────────────────────────────────
    case 'boatFlag': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.25, 0.08);
      shape.lineTo(0, 0.16);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
      break;
    }

    // ── Rudder ────────────────────────────────────────────────────────────
    case 'boatRudder': {
      core = new THREE.BoxGeometry(0.06, 0.4, 0.2);
      break;
    }

    // ── Portholes ─────────────────────────────────────────────────────────
    case 'boatPortholeL':
    case 'boatPortholeR': {
      core = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
      // Rotate to face outward (along Z)
      core.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      break;
    }

    // ── Bowsprit ──────────────────────────────────────────────────────────
    case 'boatBowsprit': {
      core = new THREE.CylinderGeometry(0.025, 0.03, 0.7, 8);
      // Angle forward and slightly up
      const m = new THREE.Matrix4()
        .makeRotationZ(Math.PI * 0.35);
      core.applyMatrix4(m);
      break;
    }

    // ── Anchor ────────────────────────────────────────────────────────────
    case 'boatAnchor': {
      // Simplified: torus ring + vertical bar
      const ring = new THREE.TorusGeometry(0.06, 0.015, 8, 12);
      const bar = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6);
      bar.translate(0, 0.07, 0);
      // Merge
      const merged = new THREE.BufferGeometry();
      ring.computeBoundingBox();
      bar.computeBoundingBox();
      // Use simple approach: just the ring (close enough visually)
      core = ring;
      // Actually let's use a small compound shape via a box + torus feel
      // Keep it simple — a small cross shape
      core = new THREE.BoxGeometry(0.12, 0.16, 0.03);
      break;
    }

    // ── Crow's Nest ───────────────────────────────────────────────────────
    case 'boatCrowsNest': {
      // Small barrel/platform
      core = new THREE.CylinderGeometry(0.1, 0.08, 0.1, 10);
      break;
    }
  }

  return {
    coreGeometry: core,
    spiralGeometries: [],
    dispose() {
      core.dispose();
    },
  };
}
