/**
 * yarnBallGeometry — procedural yarn geometry for 5 distinct shapes.
 *
 * Each shape consists of:
 *   • A core BufferGeometry (Three.js primitive, kept small — mostly hidden
 *     beneath the wound spiral threads)
 *   • Multiple TubeGeometry spirals wound around that shape's surface
 *
 * All shapes are designed to fit within a bounding sphere of radius `size`,
 * so formation spacing from levelGenerator works without modification.
 *
 * Shapes:
 *   sphere   — 6 loxodrome spirals on a sphere (original)
 *   cone     — helical spirals narrowing from base to apex
 *   cylinder — alternating-direction helical spirals on a cylinder
 *   box      — diagonal spirals wrapping all 4 side faces
 *   torus    — (1,3)-winding spirals on a torus surface (closed loops)
 *
 * No React dependencies — pure Three.js utility, safe to call outside components.
 */

import * as THREE from 'three';

export type YarnShape = 'sphere' | 'cone' | 'cylinder' | 'box' | 'torus' | 'panel';

/** Options for `createYarnBallGeometry`. */
export interface YarnBallGeometryOptions {
  /** Overall bounding sphere radius in scene units. Recommended: 0.3–0.8. */
  size: number;
  /** Shape of the yarn object. Default: 'sphere'. */
  shape?: YarnShape;
  /** Number of spiral threads to generate. Default: 6. */
  spiralCount?: number;
  /** Sample points per spiral path. Higher = smoother. Default: 80. */
  spiralResolution?: number;
  /** Radial segments per tube cross-section. Default: 5. */
  tubeRadialSegments?: number;
}

/** Return value of `createYarnBallGeometry`. */
export interface YarnBallGeometryResult {
  /** Core geometry (mostly hidden under wound threads). */
  coreGeometry: THREE.BufferGeometry;
  /** TubeGeometry for each wound spiral thread. */
  spiralGeometries: THREE.TubeGeometry[];
  /** Dispose all geometries — call in useEffect cleanup to avoid GPU memory leaks. */
  dispose: () => void;
}

/** Azimuthal / helical winds per spiral thread (shared across all shapes). */
const N = 10;

// ── Sphere ────────────────────────────────────────────────────────────────────
// Loxodrome (rhumb-line) spirals at 6 different rotation axes give dense,
// even coverage that makes the ball look like a solid mass of wound thread.

const SPHERE_ROTATIONS: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, Math.PI / 3],
  [0, 0, (2 * Math.PI) / 3],
  [Math.PI / 3, 0, 0],
  [Math.PI / 2, Math.PI / 4, 0],
  [(2 * Math.PI) / 3, Math.PI / 3, 0],
];

function buildSphere(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const sr   = size * 0.88;
  const core = new THREE.SphereGeometry(size * 0.52, 32, 32);
  const n    = Math.min(count, SPHERE_ROTATIONS.length);
  const spirals: THREE.TubeGeometry[] = [];

  for (let s = 0; s < n; s++) {
    const [ex, ey, ez] = SPHERE_ROTATIONS[s];
    const mat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(ex, ey, ez, 'XYZ'));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= res; i++) {
      const t     = i / res;
      const theta = Math.PI * t;
      const phi   = N * 2 * Math.PI * t;
      pts.push(new THREE.Vector3(
        sr * Math.sin(theta) * Math.cos(phi),
        sr * Math.cos(theta),
        sr * Math.sin(theta) * Math.sin(phi),
      ).applyMatrix4(mat));
    }
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), res, tubeR, segs, false),
    );
  }
  return { core, spirals };
}

// ── Cone ──────────────────────────────────────────────────────────────────────
// Helical spirals that start wide at the base and converge at the apex.
// Height H fits the shape in the bounding sphere: H/2 ≈ size.

function buildCone(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const H     = size * 1.75;
  const baseR = size * 0.72;
  const core  = new THREE.ConeGeometry(baseR * 0.72, H * 0.80, 16);
  const spirals: THREE.TubeGeometry[] = [];

  for (let s = 0; s < count; s++) {
    const phase = (s / count) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= res; i++) {
      const t   = i / res;
      const r   = baseR * (1 - t * 0.96); // radius shrinks to near-zero at apex
      const ang = N * 2 * Math.PI * t + phase;
      pts.push(new THREE.Vector3(r * Math.cos(ang), -H / 2 + H * t, r * Math.sin(ang)));
    }
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), res, tubeR, segs, false),
    );
  }
  return { core, spirals };
}

// ── Cylinder ──────────────────────────────────────────────────────────────────
// Alternating clockwise / counter-clockwise helical spirals give the
// characteristic criss-cross look of tightly wound thread on a spool.

function buildCylinder(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const radius = size * 0.72;
  const H      = size * 1.55;
  const core   = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, H * 0.80, 16);
  const spirals: THREE.TubeGeometry[] = [];

  for (let s = 0; s < count; s++) {
    const phase = (s / count) * Math.PI * 2;
    const dir   = s % 2 === 0 ? 1 : -1; // alternate winding direction
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= res; i++) {
      const t   = i / res;
      const ang = dir * N * 2 * Math.PI * t + phase;
      pts.push(new THREE.Vector3(radius * Math.cos(ang), -H / 2 + H * t, radius * Math.sin(ang)));
    }
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), res, tubeR, segs, false),
    );
  }
  return { core, spirals };
}

// ── Box ───────────────────────────────────────────────────────────────────────
// Threads wrap diagonally around all 4 side faces while rising from bottom
// to top. CatmullRom smoothing rounds the corners so threads look organic.
// Half-side hs = size / √3 ensures the bounding sphere radius equals `size`.

function buildBox(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const hs     = size / Math.sqrt(3); // half-side: corner-to-centre = size
  const L      = hs * 2;             // full side length
  const core   = new THREE.BoxGeometry(L * 0.72, L * 0.72, L * 0.72);
  const spirals: THREE.TubeGeometry[] = [];
  const N_wrap = 8; // helical wraps around the 4 side faces

  for (let idx = 0; idx < count; idx++) {
    const phOff = idx / count; // 0–1 phase offset within one perimeter loop
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i <= res; i++) {
      const t  = i / res;
      // Perimeter position (0–1 = one full loop around 4 faces), repeats N_wrap times
      const pt = ((N_wrap * t + phOff) % 1.0 + 1.0) % 1.0;
      const ft = pt * 4; // 0–4: which face + progress within that face
      const y  = -hs + L * t; // rises linearly from bottom to top

      let x: number, z: number;
      if      (ft < 1) { x = -hs + ft * L;       z =  hs; } // front face
      else if (ft < 2) { x =  hs;                 z =  hs - (ft - 1) * L; } // right face
      else if (ft < 3) { x =  hs - (ft - 2) * L; z = -hs; } // back face
      else             { x = -hs;                 z = -hs + (ft - 3) * L; } // left face

      pts.push(new THREE.Vector3(x, y, z));
    }
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), res, tubeR, segs, false),
    );
  }
  return { core, spirals };
}

// ── Torus ─────────────────────────────────────────────────────────────────────
// (1,3) winding: each thread makes 1 toroidal loop while winding 3 times
// poloidally around the tube. All 6 threads start at evenly-spaced phases.
// Closed curves eliminate visible seams at the join point.

function buildTorus(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const R     = size * 0.60; // torus major radius
  const r     = size * 0.26; // torus minor (tube) radius
  const N_pol = 3;           // poloidal winds per toroidal loop
  const core  = new THREE.TorusGeometry(R * 0.72, r * 0.72, 12, 24);
  const spirals: THREE.TubeGeometry[] = [];

  for (let s = 0; s < count; s++) {
    const phT = (s / count) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    // Exclusive endpoint: closed curve reconnects to the first point automatically
    for (let i = 0; i < res; i++) {
      const t   = i / res;
      const tor = 2 * Math.PI * t + phT;       // toroidal angle (around big ring)
      const pol = N_pol * 2 * Math.PI * t;      // poloidal angle (around tube)
      pts.push(new THREE.Vector3(
        (R + r * Math.cos(pol)) * Math.cos(tor),
        r * Math.sin(pol),
        (R + r * Math.cos(pol)) * Math.sin(tor),
      ));
    }
    // closed=true: seam connects last point back to first seamlessly
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), res, tubeR, segs, true),
    );
  }
  return { core, spirals };
}

// ── Panel ─────────────────────────────────────────────────────────────────────
// Wide, flat fabric swatch. Threads run in horizontal rows sweeping back and
// forth across the width (like weft rows in knitting), giving a clear
// "flat knitted panel" look — perfect for roof tiles or wall sections.
//
// Dimensions: 2.0×0.6×0.7 × size so it reads as distinctly non-spherical.

function buildPanel(
  size: number, count: number, res: number, segs: number, tubeR: number,
): { core: THREE.BufferGeometry; spirals: THREE.TubeGeometry[] } {
  const W = size * 2.00; // wide
  const H = size * 0.60; // low profile
  const D = size * 0.70; // moderate depth

  const core    = new THREE.BoxGeometry(W * 0.72, H * 0.72, D * 0.72);
  const spirals: THREE.TubeGeometry[] = [];

  // Each spiral is one horizontal "row" sweeping across the width
  // with a sinusoidal Z wave that rounds the thread off the face.
  const rows = count;
  for (let s = 0; s < rows; s++) {
    const yOff   = -H / 2 + H * (s / Math.max(rows - 1, 1));
    const zPhase = (s % 2) * Math.PI; // alternate front/back start per row
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i <= res; i++) {
      const t   = i / res;
      // Sweep across width N times (back-and-forth zigzag)
      const ang = N * 2 * Math.PI * t;
      const x   = (W / 2) * Math.sin(ang);
      // Slight vertical undulation to give thread some body
      const y   = yOff + (H * 0.12) * Math.cos(ang * 2);
      // Depth wave makes threads stand proud of the surface
      const z   = (D / 2) * Math.cos(ang + zPhase) * 0.88;
      pts.push(new THREE.Vector3(x, y, z));
    }
    spirals.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), res, tubeR, segs, false),
    );
  }
  return { core, spirals };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function createYarnBallGeometry({
  size,
  shape             = 'sphere',
  spiralCount       = 6,
  spiralResolution  = 80,
  tubeRadialSegments = 5,
}: YarnBallGeometryOptions): YarnBallGeometryResult {
  const tubeR = 0.058 * size;

  let core:    THREE.BufferGeometry;
  let spirals: THREE.TubeGeometry[];

  switch (shape) {
    case 'cone':
      ({ core, spirals } = buildCone(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
    case 'cylinder':
      ({ core, spirals } = buildCylinder(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
    case 'box':
      ({ core, spirals } = buildBox(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
    case 'torus':
      ({ core, spirals } = buildTorus(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
    case 'panel':
      ({ core, spirals } = buildPanel(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
    default: // 'sphere'
      ({ core, spirals } = buildSphere(size, spiralCount, spiralResolution, tubeRadialSegments, tubeR));
      break;
  }

  function dispose(): void {
    core.dispose();
    for (const geo of spirals) geo.dispose();
  }

  return { coreGeometry: core, spiralGeometries: spirals, dispose };
}
