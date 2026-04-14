/**
 * yarnHouseGeometry — procedural yarn-wound geometry for a knitted toy house.
 *
 * Builds walls, roof, floor, door, windows, and chimney from TubeGeometry
 * spirals wound around core shapes — same technique as yarnBallGeometry.ts.
 *
 * Returns grouped geometries keyed by colour so the caller can assign
 * materials and merge same-colour meshes to minimise draw calls.
 *
 * No React dependencies — pure Three.js utility.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface HouseColorGroup {
  /** Merged geometry for all spiral tubes of this colour. */
  spirals: THREE.BufferGeometry;
  /** Merged geometry for all hidden core shapes of this colour. */
  cores: THREE.BufferGeometry;
  /** Hex colour string for material creation. */
  color: string;
}

export interface YarnHouseGeometryResult {
  groups: HouseColorGroup[];
  dispose: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TUBE_RADIUS_FACTOR = 0.048;   // thicker tubes for dense coverage
const RADIAL_SEGMENTS = 5;

// House colours
const BLUE        = '#6BB8E0';
const DARK_BLUE   = '#4A90B8';
const BEIGE       = '#C9A570';
const CREAM       = '#E8DCC8';

// ── Helpers ────────────────────────────────────────────────────────────────

function tube(
  pts: THREE.Vector3[],
  res: number,
  radius: number,
  closed = false,
): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts, closed),
    res,
    radius,
    RADIAL_SEGMENTS,
    closed,
  );
}

// ── Part builders ──────────────────────────────────────────────────────────

/**
 * buildSolidWall — dense horizontal yarn rows filling a flat rectangular panel.
 * Uses many tightly-packed rows so the wall appears solid with no holes.
 * Each row zigzags back and forth across the width like knit stitches.
 */
function buildSolidWall(
  w: number, h: number, d: number,
  rowCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  // Large core fills most of the wall so any tiny gaps are backed by solid colour
  const core = new THREE.BoxGeometry(w * 0.92, h * 0.92, d * 0.92);
  const spirals: THREE.TubeGeometry[] = [];

  // Two layers of rows offset by half a row height for dense coverage
  for (let layer = 0; layer < 2; layer++) {
    const layerRows = layer === 0 ? rowCount : rowCount - 1;
    const yOffset = layer === 0 ? 0 : (h / rowCount) * 0.5;
    const zSide = layer === 0 ? 1 : -1; // front face vs back face

    for (let s = 0; s < layerRows; s++) {
      const yFrac = s / Math.max(layerRows - 1, 1);
      const y = -h / 2 + h * yFrac + yOffset;
      if (y > h / 2 || y < -h / 2) continue;

      const pts: THREE.Vector3[] = [];
      const N = 10; // zigzag frequency — higher = denser stitches

      for (let i = 0; i <= res; i++) {
        const t   = i / res;
        const ang = N * 2 * Math.PI * t;
        const x   = (w / 2) * Math.sin(ang);
        const yy  = y + (h * 0.02) * Math.cos(ang * 2); // subtle vertical wobble
        const z   = zSide * (d / 2) * 0.5 + (d * 0.3) * Math.cos(ang) * 0.5;
        pts.push(new THREE.Vector3(x, yy, z));
      }
      spirals.push(tube(pts, res, tubeR));
    }
  }
  return { core, spirals };
}

/**
 * buildFloor — flat horizontal panel with yarn rows running back and forth.
 */
function buildFloor(
  w: number, d: number, thickness: number,
  rowCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const core = new THREE.BoxGeometry(w * 0.92, thickness * 0.9, d * 0.92);
  const spirals: THREE.TubeGeometry[] = [];

  for (let layer = 0; layer < 2; layer++) {
    const rows = layer === 0 ? rowCount : rowCount - 1;
    const zOffset = layer === 0 ? 0 : (d / rowCount) * 0.5;
    const ySide = layer === 0 ? 1 : -1;

    for (let s = 0; s < rows; s++) {
      const zFrac = s / Math.max(rows - 1, 1);
      const z = -d / 2 + d * zFrac + zOffset;
      if (z > d / 2 || z < -d / 2) continue;

      const pts: THREE.Vector3[] = [];
      const N = 10;

      for (let i = 0; i <= res; i++) {
        const t   = i / res;
        const ang = N * 2 * Math.PI * t;
        const x   = (w / 2) * Math.sin(ang);
        const y   = ySide * (thickness / 2) * 0.4 + (thickness * 0.3) * Math.cos(ang) * 0.4;
        const zz  = z + (d * 0.02) * Math.cos(ang * 2);
        pts.push(new THREE.Vector3(x, y, zz));
      }
      spirals.push(tube(pts, res, tubeR));
    }
  }
  return { core, spirals };
}

/**
 * buildRoofSlab — flat rectangular slab with dense horizontal rows.
 * Built lying flat in XZ plane. Caller rotates into pitched position.
 */
function buildRoofSlab(
  w: number, d: number, thickness: number,
  rowCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const core = new THREE.BoxGeometry(w * 0.92, thickness * 0.9, d * 0.92);
  const spirals: THREE.TubeGeometry[] = [];

  // Dense rows along the depth (Z) direction, each sweeps across the width (X)
  for (let layer = 0; layer < 2; layer++) {
    const rows = layer === 0 ? rowCount : rowCount - 1;
    const zOffset = layer === 0 ? 0 : (d / rowCount) * 0.5;
    const ySide = layer === 0 ? 1 : -1;

    for (let s = 0; s < rows; s++) {
      const zFrac = s / Math.max(rows - 1, 1);
      const z = -d / 2 + d * zFrac + zOffset;
      if (z > d / 2 || z < -d / 2) continue;

      const pts: THREE.Vector3[] = [];
      const N = 8;

      for (let i = 0; i <= res; i++) {
        const t   = i / res;
        const ang = N * 2 * Math.PI * t;
        const x   = (w / 2) * Math.sin(ang);
        const y   = ySide * (thickness / 2) * 0.4 + (thickness * 0.3) * Math.cos(ang) * 0.4;
        const zz  = z + (d * 0.015) * Math.cos(ang * 2);
        pts.push(new THREE.Vector3(x, y, zz));
      }
      spirals.push(tube(pts, res, tubeR));
    }
  }
  return { core, spirals };
}

/**
 * buildSmallBox — compact box wrapped in diagonal yarn for door / windows.
 */
function buildSmallBox(
  w: number, h: number, d: number,
  spiralCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const core = new THREE.BoxGeometry(w * 0.85, h * 0.85, d * 0.85);
  const spirals: THREE.TubeGeometry[] = [];
  const N_wrap = 5;

  for (let idx = 0; idx < spiralCount; idx++) {
    const phOff = idx / spiralCount;
    const pts: THREE.Vector3[] = [];
    const hs_w = w / 2, hs_h = h / 2, hs_d = d / 2;

    for (let i = 0; i <= res; i++) {
      const t  = i / res;
      const pt = ((N_wrap * t + phOff) % 1.0 + 1.0) % 1.0;
      const ft = pt * 4;
      const y  = -hs_h + h * t;

      let x: number, z: number;
      if      (ft < 1) { x = -hs_w + ft * w;       z =  hs_d; }
      else if (ft < 2) { x =  hs_w;                 z =  hs_d - (ft - 1) * d; }
      else if (ft < 3) { x =  hs_w - (ft - 2) * w; z = -hs_d; }
      else             { x = -hs_w;                 z = -hs_d + (ft - 3) * d; }

      pts.push(new THREE.Vector3(x, y, z));
    }
    spirals.push(tube(pts, res, tubeR));
  }
  return { core, spirals };
}

/**
 * buildChimney — helical wrapping for the chimney.
 */
function buildChimney(
  radius: number, h: number,
  spiralCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const core = new THREE.CylinderGeometry(radius * 0.80, radius * 0.80, h * 0.85, 12);
  const spirals: THREE.TubeGeometry[] = [];
  const N = 6;

  for (let s = 0; s < spiralCount; s++) {
    const phase = (s / spiralCount) * Math.PI * 2;
    const dir   = s % 2 === 0 ? 1 : -1;
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i <= res; i++) {
      const t   = i / res;
      const ang = dir * N * 2 * Math.PI * t + phase;
      pts.push(new THREE.Vector3(
        radius * Math.cos(ang),
        -h / 2 + h * t,
        radius * Math.sin(ang),
      ));
    }
    spirals.push(tube(pts, res, tubeR));
  }
  return { core, spirals };
}

/**
 * buildGable — triangular gable end (front/back) wound with yarn rows.
 */
function buildGable(
  baseW: number, peakH: number, d: number,
  spiralCount: number, res: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const shape = new THREE.Shape();
  shape.moveTo(-baseW / 2, 0);
  shape.lineTo(baseW / 2, 0);
  shape.lineTo(0, peakH);
  shape.closePath();

  const core = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  core.translate(0, 0, -d / 2);

  const spirals: THREE.TubeGeometry[] = [];

  // Dense horizontal rows that narrow toward the peak
  for (let layer = 0; layer < 2; layer++) {
    const rows = layer === 0 ? spiralCount : spiralCount - 1;
    const yOff = layer === 0 ? 0 : (peakH / spiralCount) * 0.5;

    for (let s = 0; s < rows; s++) {
      const yFrac = (s + 0.3) / spiralCount;
      const y = peakH * yFrac + yOff;
      if (y >= peakH * 0.95) continue;
      const halfW = (baseW / 2) * (1 - y / peakH);
      const pts: THREE.Vector3[] = [];

      for (let i = 0; i <= res; i++) {
        const t = i / res;
        const x = -halfW + 2 * halfW * t;
        const z = (d / 2) * Math.sin(t * Math.PI * 6) * 0.5;
        pts.push(new THREE.Vector3(x, y, z));
      }
      spirals.push(tube(pts, res, tubeR));
    }
  }
  return { core, spirals };
}

// ── Offset helpers ─────────────────────────────────────────────────────────

function offsetGeo(
  geo: THREE.BufferGeometry,
  x: number, y: number, z: number,
  rx = 0, ry = 0, rz = 0,
): THREE.BufferGeometry {
  const g = geo.clone();
  const m = new THREE.Matrix4();
  if (rx !== 0 || ry !== 0 || rz !== 0) {
    m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
  }
  m.setPosition(x, y, z);
  g.applyMatrix4(m);
  return g;
}

function offsetGeos(
  geos: THREE.BufferGeometry[],
  x: number, y: number, z: number,
  rx = 0, ry = 0, rz = 0,
): THREE.BufferGeometry[] {
  return geos.map((g) => offsetGeo(g, x, y, z, rx, ry, rz));
}

// ── Public API ─────────────────────────────────────────────────────────────

export function createYarnHouseGeometry(scale = 1.0): YarnHouseGeometryResult {
  const tubeR = TUBE_RADIUS_FACTOR * scale;
  const allGeos: THREE.BufferGeometry[] = [];

  // Collectors per colour
  const blueCores:     THREE.BufferGeometry[] = [];
  const blueSpirals:   THREE.BufferGeometry[] = [];
  const dkBlueCores:   THREE.BufferGeometry[] = [];
  const dkBlueSpirals: THREE.BufferGeometry[] = [];
  const beigeCores:    THREE.BufferGeometry[] = [];
  const beigeSpirals:  THREE.BufferGeometry[] = [];
  const creamCores:    THREE.BufferGeometry[] = [];
  const creamSpirals:  THREE.BufferGeometry[] = [];

  // ── Dimensions ──────────────────────────────────────────────────────────

  const wallW      = 1.8 * scale;   // front/back wall width
  const wallH      = 1.6 * scale;   // wall height
  const wallD      = 0.18 * scale;  // wall thickness (slightly thicker for solidity)
  const sideW      = 1.4 * scale;   // side wall width = house depth
  const halfDepth  = sideW / 2;

  const roofAngle  = Math.PI * 0.22;              // ~40 degrees pitch
  const roofSlope  = (wallW / 2 + 0.1 * scale) / Math.cos(roofAngle); // panel width to cover half-house + overhang
  const roofDepth  = sideW + 0.15 * scale;        // slightly longer than house depth
  const roofThick  = 0.12 * scale;
  const gablePeak  = (wallW / 2) * Math.tan(roofAngle); // exact height from trigonometry

  const floorW     = wallW + 0.06 * scale;
  const floorD     = sideW + 0.06 * scale;
  const floorThick = 0.12 * scale;

  const gableBase  = wallW;
  const gableD     = 0.10 * scale;
  const doorW      = 0.38 * scale;
  const doorH      = 0.60 * scale;
  const doorD      = 0.10 * scale;
  const winW       = 0.30 * scale;
  const winH       = 0.30 * scale;
  const winD       = 0.08 * scale;
  const chimR      = 0.12 * scale;
  const chimH      = 0.55 * scale;

  // ── Front wall ──────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSolidWall(wallW, wallH, wallD, 14, 70, tubeR);
    blueCores.push(offsetGeo(core, 0, 0, halfDepth));
    blueSpirals.push(...offsetGeos(spirals, 0, 0, halfDepth));
  }

  // ── Back wall ───────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSolidWall(wallW, wallH, wallD, 14, 70, tubeR);
    blueCores.push(offsetGeo(core, 0, 0, -halfDepth));
    blueSpirals.push(...offsetGeos(spirals, 0, 0, -halfDepth));
  }

  // ── Left wall ───────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSolidWall(sideW, wallH, wallD, 12, 70, tubeR);
    blueCores.push(offsetGeo(core, -wallW / 2, 0, 0, 0, Math.PI / 2, 0));
    blueSpirals.push(...offsetGeos(spirals, -wallW / 2, 0, 0, 0, Math.PI / 2, 0));
  }

  // ── Right wall ──────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSolidWall(sideW, wallH, wallD, 12, 70, tubeR);
    blueCores.push(offsetGeo(core, wallW / 2, 0, 0, 0, Math.PI / 2, 0));
    blueSpirals.push(...offsetGeos(spirals, wallW / 2, 0, 0, 0, Math.PI / 2, 0));
  }

  // ── Floor ───────────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildFloor(floorW, floorD, floorThick, 10, 60, tubeR);
    const py = -wallH / 2 - floorThick / 2;
    blueCores.push(offsetGeo(core, 0, py, 0));
    blueSpirals.push(...offsetGeos(spirals, 0, py, 0));
  }

  // ── Roof — two slabs meeting at a ridge ─────────────────────────────────
  // Each slab is built flat (XZ plane), then rotated around the Z axis to create
  // the pitch. They meet at the top center of the walls.
  {
    const ridgeY = wallH / 2 + gablePeak;

    // Left roof slope: rotate +roofAngle around Z, pivot at ridge
    {
      const { core, spirals } = buildRoofSlab(roofSlope, roofDepth, roofThick, 10, 60, tubeR);
      // Position so the right edge (x=+w/2) sits at the ridge, then rotate
      const px = -roofSlope / 2 * Math.cos(roofAngle);
      const py = ridgeY - roofSlope / 2 * Math.sin(roofAngle);
      blueCores.push(offsetGeo(core, px, py, 0, 0, 0, roofAngle));
      blueSpirals.push(...offsetGeos(spirals, px, py, 0, 0, 0, roofAngle));
    }

    // Right roof slope: rotate -roofAngle around Z, mirror of left
    {
      const { core, spirals } = buildRoofSlab(roofSlope, roofDepth, roofThick, 10, 60, tubeR);
      const px = roofSlope / 2 * Math.cos(roofAngle);
      const py = ridgeY - roofSlope / 2 * Math.sin(roofAngle);
      blueCores.push(offsetGeo(core, px, py, 0, 0, 0, -roofAngle));
      blueSpirals.push(...offsetGeos(spirals, px, py, 0, 0, 0, -roofAngle));
    }
  }

  // ── Front gable ─────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildGable(gableBase, gablePeak, gableD, 7, 50, tubeR);
    blueCores.push(offsetGeo(core, 0, wallH / 2, halfDepth));
    blueSpirals.push(...offsetGeos(spirals, 0, wallH / 2, halfDepth));
  }

  // ── Back gable ──────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildGable(gableBase, gablePeak, gableD, 7, 50, tubeR);
    blueCores.push(offsetGeo(core, 0, wallH / 2, -halfDepth));
    blueSpirals.push(...offsetGeos(spirals, 0, wallH / 2, -halfDepth));
  }

  // ── Door ────────────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSmallBox(doorW, doorH, doorD, 6, 45, tubeR);
    const py = -wallH / 2 + doorH / 2 + 0.02 * scale;
    const pz = halfDepth + wallD / 2 + 0.01 * scale;
    beigeCores.push(offsetGeo(core, 0, py, pz));
    beigeSpirals.push(...offsetGeos(spirals, 0, py, pz));
  }

  // ── Left window ─────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSmallBox(winW, winH, winD, 5, 40, tubeR);
    const px = -wallW * 0.28;
    const py = wallH * 0.08;
    const pz = halfDepth + wallD / 2 + 0.01 * scale;
    creamCores.push(offsetGeo(core, px, py, pz));
    creamSpirals.push(...offsetGeos(spirals, px, py, pz));
  }

  // ── Right window ────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildSmallBox(winW, winH, winD, 5, 40, tubeR);
    const px = wallW * 0.28;
    const py = wallH * 0.08;
    const pz = halfDepth + wallD / 2 + 0.01 * scale;
    creamCores.push(offsetGeo(core, px, py, pz));
    creamSpirals.push(...offsetGeos(spirals, px, py, pz));
  }

  // ── Chimney ─────────────────────────────────────────────────────────────
  {
    const { core, spirals } = buildChimney(chimR, chimH, 5, 45, tubeR);
    const px = wallW * 0.25;
    const py = wallH / 2 + gablePeak * 0.75;
    dkBlueCores.push(offsetGeo(core, px, py, 0));
    dkBlueSpirals.push(...offsetGeos(spirals, px, py, 0));
  }

  // ── Merge per colour ────────────────────────────────────────────────────

  function safeMerge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geos.length === 0) return new THREE.BufferGeometry();
    if (geos.length === 1) return geos[0];
    return mergeGeometries(geos, false) ?? geos[0];
  }

  const groups: HouseColorGroup[] = [
    { spirals: safeMerge(blueSpirals),   cores: safeMerge(blueCores),    color: BLUE },
    { spirals: safeMerge(dkBlueSpirals), cores: safeMerge(dkBlueCores),  color: DARK_BLUE },
    { spirals: safeMerge(beigeSpirals),  cores: safeMerge(beigeCores),   color: BEIGE },
    { spirals: safeMerge(creamSpirals),  cores: safeMerge(creamCores),   color: CREAM },
  ];

  for (const g of [...blueSpirals, ...blueCores, ...dkBlueSpirals, ...dkBlueCores,
                    ...beigeSpirals, ...beigeCores, ...creamSpirals, ...creamCores]) {
    allGeos.push(g);
  }

  function dispose() {
    for (const g of allGeos) g.dispose();
    for (const grp of groups) {
      grp.spirals.dispose();
      grp.cores.dispose();
    }
  }

  return { groups, dispose };
}

// ── Individual 3D house-part geometry for game pieces ─────────────────────
//
// Each part uses the same dense-winding technique as the decorative house
// but returns a single piece centered at the origin, compatible with the
// YarnBall rendering pipeline (coreGeometry + spiralGeometries + dispose).
//
// Rotations (side walls → 90° Y, floor → flat, roof → tilted) are baked
// into the geometry vertices so the animation pipeline doesn't need changes.
//
// House dimensions the parts are designed for:
//   Width (X): 2.2   Wall height (Y): 1.6   Depth (Z): 1.4
//   Roof peak 0.65 above walls.  Front face at z = +0.7.

export type HousePartType =
  | 'houseFrontWall'  // 2.2 × 1.6 dense wall panel (XY plane, front/back)
  | 'houseSideWall'   // 1.4 × 1.6 dense wall, pre-rotated 90° around Y
  | 'houseFloorHalf'  // 1.1 × 1.4 panel, pre-rotated flat (XZ plane)
  | 'houseRoofLeft'   // Slope panel, pre-tilted for left roof
  | 'houseRoofRight'  // Slope panel, pre-tilted for right roof
  | 'houseChimney'    // Chimney cylinder
  | 'houseDoor'       // Door box on front face
  | 'houseWindow'     // Square window box
  | 'houseGable';     // Triangular gable fill (front/back above walls)

// Roof geometry: slope from eave to ridge
const ROOF_HALF_W = 1.1;  // half the house width
const ROOF_PEAK   = 0.65; // height above wall top
const ROOF_ANGLE  = Math.atan2(ROOF_PEAK, ROOF_HALF_W); // ~30.6°
const ROOF_SLOPE  = Math.sqrt(ROOF_HALF_W ** 2 + ROOF_PEAK ** 2); // ~1.28

export interface HousePartGeometryResult {
  coreGeometry: THREE.BufferGeometry;
  spiralGeometries: THREE.TubeGeometry[];
  dispose: () => void;
}


export function createHousePartGeometry(
  partType: HousePartType,
): HousePartGeometryResult {
  let core: THREE.BufferGeometry;
  let spirals: THREE.TubeGeometry[];

  switch (partType) {
    // ── Walls ──────────────────────────────────────────────────────────────
    case 'houseFrontWall': {
      // Solid box — yarn texture applied via material, no spiral tubes
      core = new THREE.BoxGeometry(2.2, 1.6, 0.10);
      spirals = [];
      break;
    }
    case 'houseSideWall': {
      // Side wall: box pre-rotated 90° around Y
      core = new THREE.BoxGeometry(1.4, 1.6, 0.10);
      core.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
      spirals = [];
      break;
    }

    // ── Floor ──────────────────────────────────────────────────────────────
    case 'houseFloorHalf': {
      // Floor panel: flat slab — width along X, thin in Y, depth along Z
      core = new THREE.BoxGeometry(1.1, 0.08, 1.4);
      spirals = [];
      break;
    }

    // ── Roof ───────────────────────────────────────────────────────────────
    case 'houseRoofLeft': {
      // Flat slab: slope length along X, thin in Y, house depth along Z
      core = new THREE.BoxGeometry(ROOF_SLOPE, 0.08, 1.5);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(ROOF_ANGLE));
      spirals = [];
      break;
    }
    case 'houseRoofRight': {
      core = new THREE.BoxGeometry(ROOF_SLOPE, 0.08, 1.5);
      core.applyMatrix4(new THREE.Matrix4().makeRotationZ(-ROOF_ANGLE));
      spirals = [];
      break;
    }

    // ── Chimney ────────────────────────────────────────────────────────────
    case 'houseChimney': {
      core = new THREE.CylinderGeometry(0.12, 0.12, 0.50, 12);
      spirals = [];
      break;
    }

    // ── Door ───────────────────────────────────────────────────────────────
    case 'houseDoor': {
      core = new THREE.BoxGeometry(0.48, 0.65, 0.10);
      spirals = [];
      break;
    }

    // ── Window — square box ──────────────────────────────────────────────
    case 'houseWindow': {
      core = new THREE.BoxGeometry(0.30, 0.30, 0.08);
      spirals = [];
      break;
    }

    // ── Gable — triangular fill above front/back wall ─────────────────────
    case 'houseGable': {
      const baseW = 2.2;
      const peakH = ROOF_PEAK;  // 0.65
      const depth = 0.10;
      const shape = new THREE.Shape();
      shape.moveTo(-baseW / 2, 0);
      shape.lineTo(baseW / 2, 0);
      shape.lineTo(0, peakH);
      shape.closePath();
      core = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      core.translate(0, 0, -depth / 2);
      spirals = [];
      break;
    }
  }

  return {
    coreGeometry: core,
    spiralGeometries: spirals,
    dispose() {
      core.dispose();
      for (const g of spirals) g.dispose();
    },
  };
}
