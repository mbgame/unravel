/**
 * shapeFormations — 3-D volumetric point clouds for each game level.
 *
 * Each formation function returns N positions that visually read as a
 * recognisable 3-D animal or shape when the player rotates the scene
 * with OrbitControls. Positions fit roughly inside a ±3.5 × ±3.5 × ±2.5
 * bounding box (scene units).
 *
 * Key design change from previous version:
 *   • Z-range increased from ±0.6 to ±2.5 so shapes look truly 3-D when
 *     viewed from different angles.
 *   • Interior fill balls added so shapes read as solid volumes rather than
 *     flat outlines.
 *   • Two new formations added: Mouse and Hen (as requested).
 */

/** One 3-D position for a yarn ball. */
export type ShapePoint = [number, number, number];

/** Clamp a value to [lo, hi]. */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Utility: sample a random point inside a 3-D ellipsoid ─────────────────

function ellipsoidPoint(
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  rng: () => number,
): ShapePoint {
  // Rejection-sample a point inside the unit sphere, then scale.
  let x: number, y: number, z: number;
  do {
    x = (rng() - 0.5) * 2;
    y = (rng() - 0.5) * 2;
    z = (rng() - 0.5) * 2;
  } while (x*x + y*y + z*z > 1);
  return [cx + x * rx, cy + y * ry, cz + z * rz];
}

// ── Mouse (level 1, 3) ─────────────────────────────────────────────────────

/**
 * Sitting mouse viewed from the front.
 * Body: large elongated ellipsoid.
 * Head: smaller sphere at the front-right.
 * Ears: two petite spheres above the head.
 * Tail: a small cluster curling behind-left.
 */
function mouseShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];

  const bodyCount = Math.floor(n * 0.52);
  const headCount = Math.floor(n * 0.22);
  const earCount  = Math.floor(n * 0.12);
  const tailCount = n - bodyCount - headCount - earCount;

  // Body — elongated ellipsoid centred at origin
  for (let i = 0; i < bodyCount; i++) {
    pts.push(ellipsoidPoint(-0.3, 0, 0, 2.2, 1.3, 1.5, rng));
  }

  // Head — sphere offset to the right (+2 x)
  for (let i = 0; i < headCount; i++) {
    pts.push(ellipsoidPoint(2.1, 0.35, 0, 0.9, 0.9, 0.9, rng));
  }

  // Ears — two small spheres above head
  const halfEar = Math.floor(earCount / 2);
  for (let i = 0; i < halfEar; i++) {
    pts.push(ellipsoidPoint(2.0, 1.35, 0.3, 0.32, 0.42, 0.32, rng));
  }
  for (let i = 0; i < earCount - halfEar; i++) {
    pts.push(ellipsoidPoint(2.4, 1.35, -0.3, 0.32, 0.42, 0.32, rng));
  }

  // Tail — S-curve cluster curling behind-left
  for (let i = 0; i < tailCount; i++) {
    const t = i / Math.max(tailCount - 1, 1);
    const tx = -2.2 - t * 0.8;
    const ty = -0.5 + Math.sin(t * Math.PI) * 0.9;
    const tz = (rng() - 0.5) * 0.5;
    pts.push([tx + (rng() - 0.5) * 0.25, ty + (rng() - 0.5) * 0.25, tz]);
  }

  return pts;
}

// ── Hen (level 2, 5) ───────────────────────────────────────────────────────

/**
 * Standing hen viewed from the front.
 * Body: egg-shaped ellipsoid (taller than wide).
 * Head: round sphere on top-right.
 * Comb: 2 small spheres above the head.
 * Beak: single ball to the right.
 * Tail feathers: fan of balls curving up-left.
 */
function henShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];

  const bodyCount  = Math.floor(n * 0.50);
  const headCount  = Math.floor(n * 0.20);
  const combCount  = Math.floor(n * 0.06);
  const beakCount  = Math.max(1, Math.floor(n * 0.04));
  const tailCount  = n - bodyCount - headCount - combCount - beakCount;

  // Body — egg shape (wider at bottom)
  for (let i = 0; i < bodyCount; i++) {
    let x: number, y: number, z: number;
    do {
      x = (rng() - 0.5) * 2;
      y = (rng() - 0.5) * 2;
      z = (rng() - 0.5) * 2;
    } while (x*x + y*y*0.6 + z*z > 1);   // slightly flatter horizontally
    pts.push([-0.3 + x * 1.6, -0.2 + y * 2.0, z * 1.6]);
  }

  // Head
  for (let i = 0; i < headCount; i++) {
    pts.push(ellipsoidPoint(1.3, 1.6, 0, 0.78, 0.78, 0.78, rng));
  }

  // Comb — small cluster above head
  for (let i = 0; i < combCount; i++) {
    const cx = 1.2 + (rng() - 0.5) * 0.4;
    pts.push([cx, 2.5 + rng() * 0.5, (rng() - 0.5) * 0.3]);
  }

  // Beak
  for (let i = 0; i < beakCount; i++) {
    pts.push([2.2 + rng() * 0.2, 1.5 + (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.2]);
  }

  // Tail feathers — fan curving up-left
  for (let i = 0; i < tailCount; i++) {
    const t = i / Math.max(tailCount - 1, 1);
    const tx = -1.8 - t * 0.8;
    const ty = -0.2 + t * 1.8;
    const tz = (rng() - 0.5) * 1.2;
    pts.push([tx + (rng() - 0.5) * 0.3, ty + (rng() - 0.5) * 0.3, tz]);
  }

  return pts;
}

// ── Heart ──────────────────────────────────────────────────────────────────

function heartShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const surface = Math.floor(n * 0.68);
  const fill    = n - surface;

  for (let i = 0; i < surface; i++) {
    const t  = (i / surface) * Math.PI * 2 + rng() * 0.22;
    const x  = 16 * Math.pow(Math.sin(t), 3);
    const y  = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    const sc = 0.20;
    pts.push([
      x * sc + (rng() - 0.5) * 0.55,
      y * sc + (rng() - 0.5) * 0.55,
      (rng() - 0.5) * 2.5,
    ]);
  }

  // Interior fill with z-depth
  for (let i = 0; i < fill; i++) {
    const t  = rng() * Math.PI * 2;
    const r  = rng() * 0.85;
    const sc = 0.20;
    const xb = 16 * Math.pow(Math.sin(t), 3) * sc * r;
    const yb = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * sc * r;
    pts.push([xb, yb, (rng() - 0.5) * 2.2]);
  }

  return pts;
}

// ── Star ───────────────────────────────────────────────────────────────────

function starShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const surface = Math.floor(n * 0.7);
  const fill    = n - surface;

  for (let i = 0; i < surface; i++) {
    const frac  = i / surface;
    const k     = Math.floor(frac * 5);
    const localT = (frac * 5) % 1;
    const outer = 3.2, inner = 1.35;
    const a1 = ((k * 2 - 0.5) * Math.PI) / 5;
    const a2 = (((k + 1) * 2 - 0.5) * Math.PI) / 5;
    const mid = (a1 + a2) / 2;
    const angle = localT < 0.5
      ? a1 + (mid - a1) * (localT * 2)
      : mid + (a2 - mid) * ((localT - 0.5) * 2);
    const r = localT < 0.5
      ? outer + (inner - outer) * (localT * 2)
      : inner + (outer - inner) * ((localT - 0.5) * 2);
    pts.push([
      Math.cos(angle) * r + (rng() - 0.5) * 0.45,
      Math.sin(angle) * r + (rng() - 0.5) * 0.45,
      (rng() - 0.5) * 2.4,
    ]);
  }

  for (let i = 0; i < fill; i++) {
    const a = rng() * Math.PI * 2;
    const r = rng() * 1.3;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, (rng() - 0.5) * 2.0]);
  }

  return pts;
}

// ── Fish ───────────────────────────────────────────────────────────────────

function fishShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const bodyCount = Math.floor(n * 0.72);
  const tailCount = n - bodyCount;

  for (let i = 0; i < bodyCount; i++) {
    pts.push(ellipsoidPoint(0, 0, 0, 3.0, 1.7, 2.0, rng));
  }

  for (let i = 0; i < tailCount; i++) {
    const frac  = i / tailCount;
    const side  = frac < 0.5 ? 1 : -1;
    const lf    = frac < 0.5 ? frac * 2 : (frac - 0.5) * 2;
    const x     = -3.0 - lf * 1.6;
    const y     = side * lf * 1.9;
    pts.push([x + (rng() - 0.5) * 0.4, y + (rng() - 0.5) * 0.4, (rng() - 0.5) * 2.2]);
  }

  return pts;
}

// ── Cat ────────────────────────────────────────────────────────────────────

function catShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const headCount = Math.floor(n * 0.26);
  const earCount  = Math.floor(n * 0.08);
  const bodyCount = n - headCount - earCount;

  for (let i = 0; i < headCount; i++) {
    pts.push(ellipsoidPoint(0, 1.5, 0, 1.2, 1.2, 1.2, rng));
  }

  const halfEar = Math.floor(earCount / 2);
  for (let i = 0; i < halfEar; i++) {
    const frac = i / Math.max(halfEar - 1, 1);
    pts.push([-0.75 + (rng() - 0.5) * 0.25, 2.55 + frac * 0.75 + (rng() - 0.5) * 0.2, (rng() - 0.5) * 1.2]);
  }
  for (let i = 0; i < earCount - halfEar; i++) {
    const frac = i / Math.max(earCount - halfEar - 1, 1);
    pts.push([0.75 + (rng() - 0.5) * 0.25, 2.55 + frac * 0.75 + (rng() - 0.5) * 0.2, (rng() - 0.5) * 1.2]);
  }

  for (let i = 0; i < bodyCount; i++) {
    pts.push(ellipsoidPoint(0, -0.5, 0, 2.1, 1.65, 1.8, rng));
  }

  return pts;
}

// ── Bird ───────────────────────────────────────────────────────────────────

function birdShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const wingCount = Math.floor(n * 0.44);

  for (let i = 0; i < wingCount; i++) {
    const t = (i / wingCount) * Math.PI;
    const r = 2.6 + Math.sin(t * 2) * 0.85;
    pts.push([
      -Math.cos(t) * r + (rng() - 0.5) * 0.5,
       Math.sin(t) * 1.4 + (rng() - 0.5) * 0.5,
      (rng() - 0.5) * 2.4,
    ]);
  }
  for (let i = 0; i < wingCount; i++) {
    const t = (i / wingCount) * Math.PI;
    const r = 2.6 + Math.sin(t * 2) * 0.85;
    pts.push([
      Math.cos(t) * r + (rng() - 0.5) * 0.5,
      Math.sin(t) * 1.4 + (rng() - 0.5) * 0.5,
      (rng() - 0.5) * 2.4,
    ]);
  }

  const bodyCount = n - wingCount * 2;
  for (let i = 0; i < bodyCount; i++) {
    pts.push(ellipsoidPoint(0, 0, 0, 0.55, 1.1, 0.9, rng));
  }

  return pts;
}

// ── Spiral ─────────────────────────────────────────────────────────────────

function spiralShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 6;
    const r = 0.4 + t * 0.18;
    pts.push([
      Math.cos(t) * r + (rng() - 0.5) * 0.38,
      Math.sin(t) * r + (rng() - 0.5) * 0.38,
      (rng() - 0.5) * 2.5,
    ]);
  }
  return pts;
}

// ── Diamond ────────────────────────────────────────────────────────────────

function diamondShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const sides = 6;
  for (let i = 0; i < n; i++) {
    const t      = (i / n) * Math.PI * 2;
    const sector = Math.floor((t / (Math.PI * 2)) * sides);
    const sectorT = ((t / (Math.PI * 2)) * sides) % 1;
    const a1     = (sector / sides) * Math.PI * 2;
    const a2     = ((sector + 1) / sides) * Math.PI * 2;
    const r      = 3.0 / Math.cos((sectorT - 0.5) * (Math.PI * 2 / sides));
    const angle  = a1 + (a2 - a1) * sectorT;
    pts.push([
      Math.cos(angle) * (r * 0.9) + (rng() - 0.5) * 0.45,
      Math.sin(angle) * (r * 0.9) + (rng() - 0.5) * 0.45,
      (rng() - 0.5) * 2.5,
    ]);
  }
  return pts;
}

// ── Bunny ──────────────────────────────────────────────────────────────────

function bunnyShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const bodyCount = Math.floor(n * 0.52);
  const headCount = Math.floor(n * 0.20);
  const earCount  = n - bodyCount - headCount;

  for (let i = 0; i < bodyCount; i++) {
    pts.push(ellipsoidPoint(0, -0.7, 0, 2.1, 2.1, 1.8, rng));
  }

  for (let i = 0; i < headCount; i++) {
    pts.push(ellipsoidPoint(0, 1.55, 0, 1.1, 1.1, 1.1, rng));
  }

  const halfEar = Math.floor(earCount / 2);
  for (let i = 0; i < halfEar; i++) {
    pts.push(ellipsoidPoint(-0.68, 2.55, 0, 0.30, 1.15, 0.30, rng));
  }
  for (let i = 0; i < earCount - halfEar; i++) {
    pts.push(ellipsoidPoint(0.68, 2.55, 0, 0.30, 1.15, 0.30, rng));
  }

  return pts;
}

// ── Flower ─────────────────────────────────────────────────────────────────

function flowerShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const petals      = 7;
  const petalCount  = Math.floor(n * 0.70);
  const centreCount = n - petalCount;

  for (let i = 0; i < petalCount; i++) {
    const t = (i / petalCount) * Math.PI * 2;
    const r = 1.85 + Math.cos(t * petals) * 1.25;
    pts.push([
      Math.cos(t) * r + (rng() - 0.5) * 0.38,
      Math.sin(t) * r + (rng() - 0.5) * 0.38,
      (rng() - 0.5) * 2.4,
    ]);
  }

  for (let i = 0; i < centreCount; i++) {
    pts.push(ellipsoidPoint(0, 0, 0, 0.92, 0.92, 1.2, rng));
  }

  return pts;
}

// ── Turtle ─────────────────────────────────────────────────────────────────

/**
 * Simple turtle — rounded shell + head + four flippers.
 */
function turtleShape(n: number, rng: () => number): ShapePoint[] {
  const pts: ShapePoint[] = [];
  const shellCount   = Math.floor(n * 0.52);
  const headCount    = Math.floor(n * 0.14);
  const flipperCount = n - shellCount - headCount;

  // Dome shell
  for (let i = 0; i < shellCount; i++) {
    let x: number, y: number, z: number;
    do {
      x = (rng() - 0.5) * 2;
      y = (rng() - 0.5) * 2;
      z = rng();  // top hemisphere only
    } while (x*x + y*y + z*z > 1 || z < 0);
    pts.push([-0.2 + x * 2.2, y * 1.5, z * 1.8]);
  }

  // Head
  for (let i = 0; i < headCount; i++) {
    pts.push(ellipsoidPoint(2.4, 0, 0, 0.55, 0.45, 0.45, rng));
  }

  // Four flippers
  const fp = Math.floor(flipperCount / 4);
  const flipperDefs: [number, number][] = [[1.3, 1.2], [1.3, -1.2], [-1.3, 1.2], [-1.3, -1.2]];
  for (let f = 0; f < 4; f++) {
    const cnt = f < flipperCount % 4 ? fp + 1 : fp;
    const [fx, fy] = flipperDefs[f];
    for (let i = 0; i < cnt; i++) {
      pts.push(ellipsoidPoint(fx, fy, -0.3, 0.65, 0.32, 0.22, rng));
    }
  }

  return pts;
}

// ── Formation registry ─────────────────────────────────────────────────────

type FormationFn = (n: number, rng: () => number) => ShapePoint[];

export const FORMATIONS: Array<{ name: string; fn: FormationFn }> = [
  { name: 'Mouse',   fn: mouseShape   },
  { name: 'Hen',     fn: henShape     },
  { name: 'Heart',   fn: heartShape   },
  { name: 'Bunny',   fn: bunnyShape   },
  { name: 'Fish',    fn: fishShape    },
  { name: 'Cat',     fn: catShape     },
  { name: 'Bird',    fn: birdShape    },
  { name: 'Turtle',  fn: turtleShape  },
  { name: 'Star',    fn: starShape    },
  { name: 'Flower',  fn: flowerShape  },
  { name: 'Spiral',  fn: spiralShape  },
  { name: 'Diamond', fn: diamondShape },
];

/**
 * Returns N ball positions arranged in the shape for a given level.
 * Cycles through FORMATIONS as levels increase.
 */
export function getFormationPositions(
  levelNumber: number,
  n: number,
  rng: () => number,
): ShapePoint[] {
  const formation = FORMATIONS[(levelNumber - 1) % FORMATIONS.length];
  return formation.fn(n, rng);
}

/** Human-readable name of the formation used for a given level. */
export function getFormationName(levelNumber: number): string {
  return FORMATIONS[(levelNumber - 1) % FORMATIONS.length].name;
}
