/**
 * yarnTreeGeometry — procedural geometry for a 3D yarn tree (Level 2).
 *
 * Each part returns a core geometry centered at origin with empty spirals,
 * matching the house-part pattern. The yarn look comes from the material/texture.
 *
 * Tree structure:
 *   Trunk (lower + upper), 4 branches, 4 leaf clusters,
 *   3 fruits, 2 root halves, 1 crown top.
 */

import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────────────────

export type TreePartType =
  | 'treeTrunkLower'    // Lower trunk segment (wide cylinder)
  | 'treeTrunkUpper'    // Upper trunk segment (thinner cylinder)
  | 'treeBranchLeft'    // Left branch (angled cylinder)
  | 'treeBranchRight'   // Right branch (angled cylinder)
  | 'treeBranchBackL'   // Back-left branch
  | 'treeBranchBackR'   // Back-right branch
  | 'treeLeafClusterA'  // Large leaf cluster (sphere)
  | 'treeLeafClusterB'  // Medium leaf cluster (sphere)
  | 'treeLeafClusterC'  // Small leaf cluster (sphere)
  | 'treeLeafClusterD'  // Crown / top cluster (sphere)
  | 'treeFruitA'        // Fruit (small sphere)
  | 'treeFruitB'        // Fruit (small sphere)
  | 'treeFruitC'        // Fruit (small sphere)
  | 'treeRootLeft'      // Left root spread (flared half-cylinder)
  | 'treeRootRight'     // Right root spread
  | 'treeCrownTop';     // Small top crown piece

export interface TreePartGeometryResult {
  coreGeometry: THREE.BufferGeometry;
  spiralGeometries: THREE.TubeGeometry[];
  dispose: () => void;
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createTreePartGeometry(
  partType: TreePartType,
): TreePartGeometryResult {
  let core: THREE.BufferGeometry;

  switch (partType) {
    // ── Trunk ──────────────────────────────────────────────────────────────
    case 'treeTrunkLower': {
      // Wider at the base, narrower at top
      core = new THREE.CylinderGeometry(0.16, 0.22, 1.2, 12);
      break;
    }
    case 'treeTrunkUpper': {
      // Continuation of trunk, tapers more
      core = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 12);
      break;
    }

    // ── Branches ──────────────────────────────────────────────────────────
    case 'treeBranchLeft': {
      core = new THREE.CylinderGeometry(0.05, 0.09, 0.9, 8);
      // Tilt ~40° to the left
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI * 0.22));
      break;
    }
    case 'treeBranchRight': {
      core = new THREE.CylinderGeometry(0.05, 0.09, 0.9, 8);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI * 0.22));
      break;
    }
    case 'treeBranchBackL': {
      core = new THREE.CylinderGeometry(0.04, 0.07, 0.7, 8);
      const m = new THREE.Matrix4()
        .makeRotationZ(Math.PI * 0.20)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI * 0.6));
      core.applyMatrix4(m);
      break;
    }
    case 'treeBranchBackR': {
      core = new THREE.CylinderGeometry(0.04, 0.07, 0.7, 8);
      const m = new THREE.Matrix4()
        .makeRotationZ(-Math.PI * 0.20)
        .multiply(new THREE.Matrix4().makeRotationY(-Math.PI * 0.6));
      core.applyMatrix4(m);
      break;
    }

    // ── Leaf clusters ─────────────────────────────────────────────────────
    case 'treeLeafClusterA': {
      core = new THREE.SphereGeometry(0.55, 12, 12);
      break;
    }
    case 'treeLeafClusterB': {
      core = new THREE.SphereGeometry(0.45, 12, 12);
      break;
    }
    case 'treeLeafClusterC': {
      core = new THREE.SphereGeometry(0.38, 10, 10);
      break;
    }
    case 'treeLeafClusterD': {
      core = new THREE.SphereGeometry(0.32, 10, 10);
      break;
    }

    // ── Fruits ────────────────────────────────────────────────────────────
    case 'treeFruitA':
    case 'treeFruitB':
    case 'treeFruitC': {
      core = new THREE.SphereGeometry(0.12, 8, 8);
      break;
    }

    // ── Roots ─────────────────────────────────────────────────────────────
    case 'treeRootLeft': {
      // Flared cylinder angled to the left
      core = new THREE.CylinderGeometry(0.06, 0.14, 0.4, 8);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI * 0.15));
      break;
    }
    case 'treeRootRight': {
      core = new THREE.CylinderGeometry(0.06, 0.14, 0.4, 8);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI * 0.15));
      break;
    }

    // ── Crown top ─────────────────────────────────────────────────────────
    case 'treeCrownTop': {
      // Small pointed sphere at the very top
      core = new THREE.ConeGeometry(0.22, 0.35, 10);
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
