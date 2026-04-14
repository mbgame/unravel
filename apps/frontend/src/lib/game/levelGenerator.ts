/**
 * levelGenerator — deterministic client-side level generation for the
 * yarn-ball collecting game.
 *
 * Each level is fully reproducible from its level number (seeded RNG).
 *
 * Game mechanics:
 *   • Each formation position holds a STACK of 1–3 yarn balls.
 *   • The outermost ball (layers[0]) is visible and tappable; inner balls are
 *     hidden underneath and revealed one-by-one as the outer layers are collected.
 *   • Every colour across all layers appears in multiples of 3, ensuring the
 *     player can always complete every collector run.
 *   • Two collectors (left + right) each accept 3 balls of their assigned colour;
 *     the penalty stack fills when the player taps the wrong colour.
 *
 * Stack depth by level:
 *   Levels 1–3  → depth 1 (no hidden balls)
 *   Levels 4–6  → depth 2 (one hidden ball per position)
 *   Levels 7+   → depth 3 (two hidden balls per position)
 */

import { getFormationPositions, getFormationName } from './shapeFormations';
import type { YarnShape } from '../three/yarnBallGeometry';
import type { HousePartType } from '../three/yarnHouseGeometry';
import type { TreePartType } from '../three/yarnTreeGeometry';
import type { BoatPartType } from '../three/yarnBoatGeometry';
import type { CastlePartType } from '../three/yarnCastleGeometry';
import type { RocketPartType } from '../three/yarnRocketGeometry';

/** All available yarn colours, ordered from simplest to most complex levels. */
export const YARN_COLORS = [
  { hex: '#E63946', name: 'Red' },
  { hex: '#F4A261', name: 'Orange' },
  { hex: '#2A9D8F', name: 'Teal' },
  { hex: '#8338EC', name: 'Purple' },
  { hex: '#3A86FF', name: 'Blue' },
  { hex: '#FB8500', name: 'Amber' },
  { hex: '#06D6A0', name: 'Mint' },
  { hex: '#FF006E', name: 'Pink' },
  { hex: '#FFBE0B', name: 'Yellow' },
  { hex: '#8AC926', name: 'Green' },
] as const;

export type YarnColor = (typeof YARN_COLORS)[number];

/** xorshift PRNG — seeded, deterministic, fast. */
function createRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) & 0x7fffffff) / 0x7fffffff;
  };
}

/** Number of distinct colours available for a given level (2 → 10). */
function colorCountForLevel(level: number): number {
  return Math.min(2 + Math.floor((level - 1) / 2), YARN_COLORS.length);
}

/**
 * Maximum k per colour. Each colour gets k×3 balls (k ∈ [1..maxK]).
 * Level 1 → maxK=1 (exactly 3 balls/colour).
 * Level 10 → maxK=5.
 */
function maxKForLevel(level: number): number {
  return Math.min(1 + Math.floor((level - 1) / 2), 5);
}

/** Stack depth (balls per formation position) scales with level. */
function stackDepthForLevel(level: number): number {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  return 3;
}

// ── Types ──────────────────────────────────────────────────────────────────

/** One ball inside a stack (may be hidden by the ball on top of it). */
export interface StackLayer {
  /** Unique ID, e.g. "s3-l1". */
  id: string;
  /** Hex colour string. */
  color: string;
  /** Visual radius in scene units (0.24–0.46). */
  size: number;
  /**
   * When true, collecting this ball awards +1 coin.
   * ~25% of layers are assigned a coin deterministically from a seeded RNG.
   */
  hasCoin?: boolean;
}

/**
 * A formation position that holds one or more stacked balls.
 * layers[0] is the outermost (visible, tappable) ball.
 * layers[1+] are hidden underneath and revealed as layers are collected.
 */
export interface BallStack {
  /** Unique stack ID, e.g. "s3". */
  stackId: string;
  /** 3-D world position for this stack (centre of the outermost ball). */
  position: [number, number, number];
  /** Ordered layers: index 0 = front/visible, higher indices = hidden behind. */
  layers: StackLayer[];
  /**
   * Optional explicit yarn shape for this stack.
   * When set, overrides the hash-based random shape in YarnBallGenerator.
   * Used by hand-crafted levels (e.g. the house in level 1).
   */
  shape?: YarnShape;
  /**
   * Optional house part type for the Level 1 yarn house.
   * When set, the renderer uses dense house-part geometry instead of
   * the standard yarn ball shapes.
   */
  housePart?: HousePartType;
  /** Optional tree part type for the Level 2 yarn tree. */
  treePart?: TreePartType;
  /** Optional boat part type for the Level 3 yarn sailboat. */
  boatPart?: BoatPartType;
  /** Optional castle part type for the Level 4 yarn castle. */
  castlePart?: CastlePartType;
  /** Optional rocket part type for the Level 5 yarn rocket. */
  rocketPart?: RocketPartType;
}

/** Colour group — how many balls of each colour exist across ALL layers. */
export interface ColorGroup {
  hex: string;
  name: string;
  /** Always a multiple of 3. */
  count: number;
}

/** Full level configuration produced by `generateLevel`. */
export interface LevelData {
  levelNumber: number;
  /** Formation stacks — the player interacts with these. */
  stacks: BallStack[];
  /** One entry per colour; count is always a multiple of 3. */
  colorGroups: ReadonlyArray<ColorGroup>;
  /** Human-readable formation name (e.g. "Mouse", "Cat"). */
  formationName: string;
  /** Total balls across all layers (sum of stack depths). */
  totalBalls: number;
}

// ── Level 1 — 3D Yarn House (60 balls) ───────────────────────────────────
//
// A hand-crafted 3D yarn house with multiple layers per piece.
// Each piece can hold 1–5 hidden yarn layers underneath.
// Total 60 balls, every colour count is a multiple of 3.
//
// 5 colours × multiples of 3:
//   Light Blue   ×18  — walls + floor (4 walls×3 + 2 floors×3)
//   Light Green  ×15  — roof + gables + chimney (2 roofs×4 + 2 gables×2 + chimney×3)
//   Light Orange ×9   — door×3 + 2 windows×3
//   Light Red    ×9   — inner layers across various stacks
//   Light Purple ×9   — inner layers across various stacks

const HOUSE_LIGHT_BLUE = '#7EC8E3';
const HOUSE_LIGHT_GREEN = '#A8D5A2';
const HOUSE_LIGHT_ORANGE = '#F4B183';
const HOUSE_LIGHT_RED = '#E88B8B';
const HOUSE_LIGHT_PURPLE = '#C4A8E0';

// All 5 colours used for inner layers, cycled to keep counts as multiples of 3
const INNER_COLORS = [
  HOUSE_LIGHT_BLUE, HOUSE_LIGHT_GREEN, HOUSE_LIGHT_ORANGE,
  HOUSE_LIGHT_RED, HOUSE_LIGHT_PURPLE,
];

/**
 * Build a layers array for a house stack.
 * First layer is the visible surface colour; remaining layers are drawn
 * from `pool` (which the caller manages to keep totals as multiples of 3).
 */
function houseLayers(
  stackId: string,
  surfaceColor: string,
  surfaceSize: number,
  depth: number,
  pool: string[],
): StackLayer[] {
  const layers: StackLayer[] = [
    { id: `${stackId}-l0`, color: surfaceColor, size: surfaceSize },
  ];
  for (let i = 1; i < depth; i++) {
    const c = pool.shift();
    if (!c) throw new Error(`Inner pool exhausted at ${stackId}-l${i}. Pool is undersized.`);
    layers.push({ id: `${stackId}-l${i}`, color: c, size: surfaceSize });
  }
  return layers;
}

function generateHouseLevel(): LevelData {
  // ── Build inner-layer colour pool ──────────────────────────────────────
  //
  // 16 stacks × varying depth = 60 total.
  // Surface layers (16 balls) are assigned explicitly.
  // Inner layers (44 balls) come from the pool below.
  //
  // Pool colours (44 balls, each colour a multiple of 3):
  //   Blue ×12, Green ×8, Orange ×6, Red ×9, Purple ×9  = 44
  //   Totals across surface+pool:
  //     Blue:   6 surface + 12 pool = 18 ✓
  //     Green:  5 surface +  8 pool = 13 … needs adjustment
  //
  // Let's compute precisely. 16 stacks with these depths:
  //   4 walls(4ea) + 2 floors(4ea) + 2 roofs(5ea) + 2 gables(3ea)
  //   + chimney(2) + door(4) + 2 windows(3ea) =
  //   16+8+10+6+2+4+6 = 52 total … let's lay it out exactly.

  // Stack definitions: [stackId, position, housePart, surfaceColor, surfaceSize, depth]
  type StackDef = [string, [number, number, number], HousePartType, string, number, number];

  const defs: StackDef[] = [
    // Walls — 4 stacks × 5 deep = 20 (surface: 4 blue)
    ['h-wall-front', [0.00, 0.00, 0.70], 'houseFrontWall', HOUSE_LIGHT_BLUE, 0.55, 5],
    ['h-wall-back', [0.00, 0.00, -0.70], 'houseFrontWall', HOUSE_LIGHT_BLUE, 0.55, 5],
    ['h-wall-left', [-1.10, 0.00, 0.00], 'houseSideWall', HOUSE_LIGHT_BLUE, 0.50, 5],
    ['h-wall-right', [1.10, 0.00, 0.00], 'houseSideWall', HOUSE_LIGHT_BLUE, 0.50, 5],

    // Floor — 2 stacks × 4 deep = 8 (surface: 2 blue)
    ['h-floor-l', [-0.55, -0.80, 0.00], 'houseFloorHalf', HOUSE_LIGHT_BLUE, 0.45, 4],
    ['h-floor-r', [0.55, -0.80, 0.00], 'houseFloorHalf', HOUSE_LIGHT_BLUE, 0.45, 4],

    // Roof — 2 stacks × 5 deep = 10 (surface: 2 green)
    ['h-roof-l', [-0.55, 1.125, 0.00], 'houseRoofLeft', HOUSE_LIGHT_GREEN, 0.50, 5],
    ['h-roof-r', [0.55, 1.125, 0.00], 'houseRoofRight', HOUSE_LIGHT_GREEN, 0.50, 5],

    // Gables — 2 × 3 = 6 (surface: 2 green)
    ['h-gable-f', [0.00, 0.80, 0.70], 'houseGable', HOUSE_LIGHT_GREEN, 0.40, 3],
    ['h-gable-b', [0.00, 0.80, -0.70], 'houseGable', HOUSE_LIGHT_GREEN, 0.40, 3],

    // Chimney — 1 × 3 = 3 (surface: 1 green)
    ['h-chimney', [0.55, 1.30, 0.20], 'houseChimney', HOUSE_LIGHT_GREEN, 0.30, 3],

    // Door — 1 × 5 = 5 (surface: 1 orange)
    ['h-door', [0.00, -0.475, 0.78], 'houseDoor', HOUSE_LIGHT_ORANGE, 0.38, 5],

    // Windows — 2 × 4 = 8 (surface: 2 orange)
    ['h-win-l', [-0.52, 0.22, 0.78], 'houseWindow', HOUSE_LIGHT_ORANGE, 0.24, 4],
    ['h-win-r', [0.52, 0.22, 0.78], 'houseWindow', HOUSE_LIGHT_ORANGE, 0.24, 4],
  ];
  // walls 4×5=20, floor 2×4=8, roof 2×5=10, gable 2×3=6, chimney 1×3=3,
  // door 1×5=5, windows 2×4=8 → 20+8+10+6+3+5+8 = 60 ✓

  const totalBalls = defs.reduce((s, d) => s + d[5], 0); // 60
  // 14 stacks → 14 surface balls
  // Surface: blue=6, green=5, orange=3 → 14
  // Targets (all ×3): blue=18, green=15, orange=12, red=9, purple=6 → 60
  // Inner: 60-14=46 → blue=12, green=10, orange=9, red=9, purple=6 = 46
  const innerPool: string[] = [];
  const innerCounts: [string, number][] = [
    [HOUSE_LIGHT_BLUE, 12],
    [HOUSE_LIGHT_GREEN, 10],
    [HOUSE_LIGHT_ORANGE, 9],
    [HOUSE_LIGHT_RED, 9],
    [HOUSE_LIGHT_PURPLE, 6],
  ];
  for (const [hex, n] of innerCounts) {
    for (let i = 0; i < n; i++) innerPool.push(hex);
  }

  // Shuffle the inner pool deterministically
  const rng = createRng(42);
  for (let i = innerPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = innerPool[i]; innerPool[i] = innerPool[j]; innerPool[j] = tmp;
  }

  // Build stacks
  const stacks: BallStack[] = defs.map(([stackId, position, housePart, surfColor, surfSize, depth]) => ({
    stackId,
    position,
    housePart,
    layers: houseLayers(stackId, surfColor, surfSize, depth, innerPool),
  }));

  const colorGroups: ColorGroup[] = [
    { hex: HOUSE_LIGHT_BLUE, name: 'Light Blue', count: 18 },
    { hex: HOUSE_LIGHT_GREEN, name: 'Light Green', count: 15 },
    { hex: HOUSE_LIGHT_ORANGE, name: 'Light Orange', count: 12 },
    { hex: HOUSE_LIGHT_RED, name: 'Light Red', count: 9 },
    { hex: HOUSE_LIGHT_PURPLE, name: 'Light Purple', count: 6 },
  ];

  return {
    levelNumber: 1,
    stacks,
    colorGroups,
    formationName: 'House',
    totalBalls,
  };
}

// ── Level 2 — 3D Yarn Tree (60 balls) ────────────────────────────────────
//
// A hand-crafted 3D yarn tree with trunk, branches, leaf clusters, fruits,
// roots, and a crown top. Each piece has 2–5 hidden layers underneath.
// Total 60 balls, every colour count is a multiple of 3.
//
// 5 colours:
//   Brown   ×18  — trunk + branches + roots
//   LGreen  ×12  — leaf clusters
//   DGreen  ×12  — leaf cluster variation
//   Red     ×9   — fruits + inner layers
//   Yellow  ×9   — inner layers

const TREE_BROWN = '#C9A870';
const TREE_LGREEN = '#8FBF7A';
const TREE_DGREEN = '#5A9E4B';
const TREE_RED = '#E88B8B';
const TREE_YELLOW = '#F0D080';

function generateTreeLevel(): LevelData {
  type StackDef = [string, [number, number, number], TreePartType, string, number, number];

  // All Y positions shifted +0.6 so tree base sits at ground level (y ≈ -0.8)
  const defs: StackDef[] = [
    // Trunk — 2 segments × 5 deep = 10 (surface: 2 brown)
    ['t-trunk-lo', [0.00, 0.00, 0.00], 'treeTrunkLower', TREE_BROWN, 0.40, 5],
    ['t-trunk-up', [0.00, 1.00, 0.00], 'treeTrunkUpper', TREE_BROWN, 0.35, 5],

    // Branches — 4 × 3 deep = 12 (surface: 4 brown)
    ['t-br-l', [-0.32, 0.65, 0.00], 'treeBranchLeft', TREE_BROWN, 0.30, 3],
    ['t-br-r', [0.32, 0.65, 0.00], 'treeBranchRight', TREE_BROWN, 0.30, 3],
    ['t-br-bl', [-0.25, 1.00, -0.25], 'treeBranchBackL', TREE_BROWN, 0.28, 3],
    ['t-br-br', [0.25, 1.00, 0.25], 'treeBranchBackR', TREE_BROWN, 0.28, 3],

    // Leaf clusters — 4 × 5 deep = 20 (surface: 2 lgreen + 2 dgreen)
    ['t-leaf-a', [-0.45, 1.60, 0.30], 'treeLeafClusterA', TREE_LGREEN, 0.50, 5],
    ['t-leaf-b', [0.45, 1.60, -0.25], 'treeLeafClusterB', TREE_DGREEN, 0.42, 5],
    ['t-leaf-c', [0.00, 1.80, 0.40], 'treeLeafClusterC', TREE_LGREEN, 0.38, 5],
    ['t-leaf-d', [0.00, 2.15, 0.00], 'treeLeafClusterD', TREE_DGREEN, 0.32, 5],

    // Fruits — 3 × 3 deep = 9 (surface: 3 red)
    ['t-fruit-a', [-0.55, 1.35, 0.50], 'treeFruitA', TREE_RED, 0.20, 3],
    ['t-fruit-b', [0.60, 1.40, -0.40], 'treeFruitB', TREE_RED, 0.20, 3],
    ['t-fruit-c', [0.10, 1.95, 0.50], 'treeFruitC', TREE_RED, 0.20, 3],

    // Roots — 2 × 3 deep = 6 (surface: 2 brown)
    ['t-root-l', [-0.18, -0.60, 0.00], 'treeRootLeft', TREE_BROWN, 0.30, 3],
    ['t-root-r', [0.18, -0.60, 0.00], 'treeRootRight', TREE_BROWN, 0.30, 3],

    // Crown top — 1 × 3 = 3 (surface: 1 dgreen)
    ['t-crown', [0.00, 2.45, 0.00], 'treeCrownTop', TREE_DGREEN, 0.25, 3],
  ];

  const totalBalls = defs.reduce((s, d) => s + d[5], 0); // 60

  // Surface counts: brown=8, lgreen=2, dgreen=3, red=3, yellow=0 = 16
  // Target totals (all ×3): brown=18, lgreen=12, dgreen=12, red=9, yellow=9 = 60
  // Inner pool (44 balls):  brown=10, lgreen=10, dgreen=9, red=6, yellow=9
  const innerPool: string[] = [];
  const innerCounts: [string, number][] = [
    [TREE_BROWN, 10],
    [TREE_LGREEN, 10],
    [TREE_DGREEN, 9],
    [TREE_RED, 6],
    [TREE_YELLOW, 9],
  ];
  for (const [hex, n] of innerCounts) {
    for (let i = 0; i < n; i++) innerPool.push(hex);
  }

  // Shuffle deterministically (seed 43, different from house's 42)
  const rng = createRng(43);
  for (let i = innerPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = innerPool[i]; innerPool[i] = innerPool[j]; innerPool[j] = tmp;
  }

  const stacks: BallStack[] = defs.map(([stackId, position, treePart, surfColor, surfSize, depth]) => ({
    stackId,
    position,
    treePart,
    layers: houseLayers(stackId, surfColor, surfSize, depth, innerPool),
  }));

  const colorGroups: ColorGroup[] = [
    { hex: TREE_BROWN, name: 'Brown', count: 18 },
    { hex: TREE_LGREEN, name: 'Light Green', count: 12 },
    { hex: TREE_DGREEN, name: 'Dark Green', count: 12 },
    { hex: TREE_RED, name: 'Red', count: 9 },
    { hex: TREE_YELLOW, name: 'Yellow', count: 9 },
  ];

  return {
    levelNumber: 2,
    stacks,
    colorGroups,
    formationName: 'Tree',
    totalBalls,
  };
}

// ── Level 3 — 3D Yarn Sailboat (60 balls) ────────────────────────────────
//
// A hand-crafted 3D yarn sailboat with hull, deck, mast, sails, cabin,
// flag, rudder, portholes, bowsprit, anchor, and crow's nest.
// Total 60 balls, every colour count is a multiple of 3.
//
// 5 colours:
//   Navy     ×18  — hull + deck
//   Cream    ×15  — sails + flag
//   Brown    ×12  — mast + boom + bowsprit + cabin + crow's nest
//   Red      ×9   — rudder + anchor + portholes
//   Gold     ×6   — inner layers

const BOAT_NAVY = '#4A6FA5';
const BOAT_CREAM = '#F5E6CA';
const BOAT_BROWN = '#8B6D47';
const BOAT_RED = '#C94C4C';
const BOAT_GOLD = '#D4A843';

function generateBoatLevel(): LevelData {
  type StackDef = [string, [number, number, number], BoatPartType, string, number, number];

  const defs: StackDef[] = [
    // Hull — 2 halves × 5 deep = 10 (surface: 2 navy)
    ['b-hull-l', [0.00, -0.25, -0.18], 'boatHullLeft', BOAT_NAVY, 0.50, 5],
    ['b-hull-r', [0.00, -0.25, 0.18], 'boatHullRight', BOAT_NAVY, 0.50, 5],

    // Deck — 2 planks × 4 deep = 8 (surface: 2 navy)
    ['b-deck-l', [0.00, 0.00, -0.18], 'boatDeckLeft', BOAT_NAVY, 0.40, 4],
    ['b-deck-r', [0.00, 0.00, 0.18], 'boatDeckRight', BOAT_NAVY, 0.40, 4],

    // Mast — 1 × 5 = 5 (surface: 1 brown)
    ['b-mast', [0.10, 0.90, 0.00], 'boatMast', BOAT_BROWN, 0.30, 5],

    // Boom — small vertical mast at the bow, 1 × 3 = 3 (surface: 1 brown)
    ['b-boom', [-0.70, 0.50, 0.00], 'boatBoom', BOAT_BROWN, 0.25, 3],

    // Sails — 2 × 5 = 10 (surface: 2 cream)
    // Main sail: attached to main mast, base slightly above deck
    ['b-sail-main', [0.10, 0.45, 0.00], 'boatMainSail', BOAT_CREAM, 0.50, 5],
    // Jib sail: between boom (bow mast) and main mast
    ['b-sail-jib', [-0.75, 0.40, 0.00], 'boatJibSail', BOAT_CREAM, 0.42, 5],

    // Cabin — 1 × 3 = 3 (surface: 1 brown)
    ['b-cabin', [0.60, 0.18, 0.00], 'boatCabin', BOAT_BROWN, 0.35, 3],

    // Flag — 1 × 3 = 3 (surface: 1 cream)
    ['b-flag', [0.10, 1.85, 0.00], 'boatFlag', BOAT_RED, 0.20, 3],

    // Rudder — 1 × 3 = 3 (surface: 1 red)
    ['b-rudder', [1.15, -0.20, 0.00], 'boatRudder', BOAT_RED, 0.25, 3],

    // Portholes — 2 × 3 = 6 (surface: 2 red)
    ['b-port-l', [-0.30, -0.10, -0.38], 'boatPortholeL', BOAT_RED, 0.15, 3],
    ['b-port-r', [-0.30, -0.10, 0.38], 'boatPortholeR', BOAT_RED, 0.15, 3],
    // Bowsprit — 1 × 3 = 3 (surface: 1 brown)
    ['b-bowsprit', [-1.10, 0.15, 0.00], 'boatBowsprit', BOAT_BROWN, 0.22, 3],

    // Anchor — 1 × 3 = 3 (surface: 1 brown)
    ['b-anchor', [-0.80, -0.45, 0.30], 'boatAnchor', BOAT_BROWN, 0.18, 3],

    // Crow's Nest — 1 × 3 = 3 (surface: 1 cream)
    ['b-crows', [0.10, 1.70, 0.00], 'boatCrowsNest', BOAT_CREAM, 0.20, 3],
  ];
  // 5+5 + 4+4 + 5+3 + 5+5 + 3 + 3+3 + 3+3 + 3+3 + 3 = 60 ✓

  const totalBalls = defs.reduce((s, d) => s + d[5], 0); // 60

  // Surface: navy=4, cream=3, brown=5, red=4, gold=0 → 16 stacks
  // Targets (all ×3): navy=18, cream=15, brown=12, red=9, gold=6 → 60
  // Inner: 60-16=44 → navy=14, cream=12, brown=7, red=5, gold=6 = 44
  const innerPool: string[] = [];
  const innerCounts: [string, number][] = [
    [BOAT_NAVY, 14],
    [BOAT_CREAM, 12],
    [BOAT_BROWN, 7],
    [BOAT_RED, 5],
    [BOAT_GOLD, 6],
  ];
  for (const [hex, n] of innerCounts) {
    for (let i = 0; i < n; i++) innerPool.push(hex);
  }

  const rng = createRng(44);
  for (let i = innerPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = innerPool[i]; innerPool[i] = innerPool[j]; innerPool[j] = tmp;
  }

  const stacks: BallStack[] = defs.map(([stackId, position, boatPart, surfColor, surfSize, depth]) => ({
    stackId,
    position,
    boatPart,
    layers: houseLayers(stackId, surfColor, surfSize, depth, innerPool),
  }));

  const colorGroups: ColorGroup[] = [
    { hex: BOAT_NAVY, name: 'Navy', count: 18 },
    { hex: BOAT_CREAM, name: 'Cream', count: 15 },
    { hex: BOAT_BROWN, name: 'Brown', count: 12 },
    { hex: BOAT_RED, name: 'Red', count: 9 },
    { hex: BOAT_GOLD, name: 'Gold', count: 6 },
  ];

  return {
    levelNumber: 3,
    stacks,
    colorGroups,
    formationName: 'Sailboat',
    totalBalls,
  };
}

// ── Level 4 — 3D Yarn Castle (60 balls) ──────────────────────────────────
//
// 17 stacks: 4 towers, 4 walls, gate, drawbridge, 4 battlements, flag,
// 2 windows.  5 colours, all ×3.
//
//   Stone   ×18  — towers + walls
//   Brown   ×15  — gate + drawbridge + battlements
//   Red     ×12  — flag + windows + inner
//   Gold    ×9   — inner layers
//   Teal    ×6   — inner layers

const CASTLE_STONE = '#A0A5B0';
const CASTLE_BROWN = '#8B7355';
const CASTLE_RED = '#C05050';
const CASTLE_GOLD = '#D4A843';
const CASTLE_TEAL = '#5EA8A0';

function generateCastleLevel(): LevelData {
  type StackDef = [string, [number, number, number], CastlePartType, string, number, number];

  const defs: StackDef[] = [
    // Towers — 4 × 4 = 16 (surface: 4 stone)
    ['c-tw-fl', [-0.70, 0.00, 0.55], 'castleTowerFrontL', CASTLE_STONE, 0.40, 4],
    ['c-tw-fr', [0.70, 0.00, 0.55], 'castleTowerFrontR', CASTLE_STONE, 0.40, 4],
    ['c-tw-bl', [-0.70, 0.00, -0.55], 'castleTowerBackL', CASTLE_STONE, 0.40, 4],
    ['c-tw-br', [0.70, 0.00, -0.55], 'castleTowerBackR', CASTLE_STONE, 0.40, 4],

    // Walls — 4 × 4 = 16 (surface: 4 stone)
    ['c-wl-f', [0.00, 0.00, 0.55], 'castleWallFront', CASTLE_STONE, 0.45, 4],
    ['c-wl-b', [0.00, 0.00, -0.55], 'castleWallBack', CASTLE_STONE, 0.45, 4],
    ['c-wl-l', [-0.70, 0.00, 0.00], 'castleWallLeft', CASTLE_STONE, 0.40, 4],
    ['c-wl-r', [0.70, 0.00, 0.00], 'castleWallRight', CASTLE_STONE, 0.40, 4],

    // Gate — 1 × 3 = 3 (surface: 1 brown)
    ['c-gate', [0.00, -0.15, 0.62], 'castleGate', CASTLE_BROWN, 0.35, 3],

    // Drawbridge — 1 × 3 = 3 (surface: 1 brown)
    ['c-draw', [0.00, -0.50, 0.90], 'castleDrawbridge', CASTLE_BROWN, 0.30, 3],

    // Battlements — 4 × 3 = 12 (surface: 4 brown)
    ['c-bt-fl', [-0.70, 0.90, 0.55], 'castleBattlementFL', CASTLE_BROWN, 0.25, 3],
    ['c-bt-fr', [0.70, 0.90, 0.55], 'castleBattlementFR', CASTLE_BROWN, 0.25, 3],
    ['c-bt-bl', [-0.70, 0.90, -0.55], 'castleBattlementBL', CASTLE_BROWN, 0.25, 3],
    ['c-bt-br', [0.70, 0.90, -0.55], 'castleBattlementBR', CASTLE_BROWN, 0.25, 3],

    // Flag — 1 × 4 = 4 (surface: 1 red)
    ['c-flag', [-0.70, 1.25, 0.55], 'castleFlag', CASTLE_RED, 0.20, 4],

    // Windows — 2 × 3 = 6 (surface: 2 red)
    ['c-win-l', [-0.30, 0.10, 0.62], 'castleWindowL', CASTLE_RED, 0.18, 3],
    ['c-win-r', [0.30, 0.10, 0.62], 'castleWindowR', CASTLE_RED, 0.18, 3],
  ];
  // 16+16+3+3+12+4+6 = 60 ✓

  const totalBalls = defs.reduce((s, d) => s + d[5], 0); // 60
  // 17 stacks → 17 surface
  // Surface: stone=8, brown=6, red=3 → 17
  // Targets: stone=18, brown=15, red=12, gold=9, teal=6 → 60
  // Inner: 60-17=43 → stone=10, brown=9, red=9, gold=9, teal=6 = 43
  const innerPool: string[] = [];
  const innerCounts: [string, number][] = [
    [CASTLE_STONE, 10],
    [CASTLE_BROWN, 9],
    [CASTLE_RED, 9],
    [CASTLE_GOLD, 9],
    [CASTLE_TEAL, 6],
  ];
  for (const [hex, n] of innerCounts) {
    for (let i = 0; i < n; i++) innerPool.push(hex);
  }

  const rng = createRng(45);
  for (let i = innerPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = innerPool[i]; innerPool[i] = innerPool[j]; innerPool[j] = tmp;
  }

  const stacks: BallStack[] = defs.map(([stackId, position, castlePart, surfColor, surfSize, depth]) => ({
    stackId,
    position,
    castlePart,
    layers: houseLayers(stackId, surfColor, surfSize, depth, innerPool),
  }));

  const colorGroups: ColorGroup[] = [
    { hex: CASTLE_STONE, name: 'Stone', count: 18 },
    { hex: CASTLE_BROWN, name: 'Brown', count: 15 },
    { hex: CASTLE_RED, name: 'Red', count: 12 },
    { hex: CASTLE_GOLD, name: 'Gold', count: 9 },
    { hex: CASTLE_TEAL, name: 'Teal', count: 6 },
  ];

  return {
    levelNumber: 4,
    stacks,
    colorGroups,
    formationName: 'Castle',
    totalBalls,
  };
}

// ── Level 5 — 3D Yarn Rocket (60 balls) ──────────────────────────────────
//
// 16 stacks: body (upper+lower), nose cone, 3 fins, 2 windows, nozzle,
// 2 boosters, antenna, flame, hatch, 2 stripes.  5 colours, all ×3.
//
//   Silver  ×18  — body + nose + nozzle
//   Red     ×15  — fins + flame + stripes
//   Blue    ×12  — windows + boosters + hatch
//   Orange  ×9   — inner layers
//   White   ×6   — antenna + inner

const ROCKET_SILVER = '#C0C8D0';
const ROCKET_RED = '#D94040';
const ROCKET_BLUE = '#4878B8';
const ROCKET_ORANGE = '#E89040';
const ROCKET_WHITE = '#F0EDE8';

function generateRocketLevel(): LevelData {
  type StackDef = [string, [number, number, number], RocketPartType, string, number, number];

  const defs: StackDef[] = [
    // Body — 2 × 5 = 10 (surface: 2 silver)
    ['r-body-up', [0.00, 0.50, 0.00], 'rocketBodyUpper', ROCKET_SILVER, 0.42, 5],
    ['r-body-lo', [0.00, -0.40, 0.00], 'rocketBodyLower', ROCKET_SILVER, 0.42, 5],

    // Nose — 1 × 5 = 5 (surface: 1 silver)
    ['r-nose', [0.00, 1.35, 0.00], 'rocketNoseCone', ROCKET_SILVER, 0.38, 5],

    // Fins — 3 × 3 = 9 (surface: 3 red) — base at body bottom
    ['r-fin-a', [0.42, -0.65, 0.00], 'rocketFinA', ROCKET_RED, 0.28, 3],
    ['r-fin-b', [-0.22, -0.65, 0.36], 'rocketFinB', ROCKET_RED, 0.28, 3],
    ['r-fin-c', [-0.22, -0.65, -0.36], 'rocketFinC', ROCKET_RED, 0.28, 3],

    // Windows — 2 × 3 = 6 (surface: 2 blue)
    ['r-win-a', [0.00, 0.70, 0.36], 'rocketWindowA', ROCKET_BLUE, 0.15, 3],
    ['r-win-b', [0.00, 0.30, 0.39], 'rocketWindowB', ROCKET_BLUE, 0.15, 3],

    // Nozzle — 1 × 3 = 3 (surface: 1 silver) — directly below body
    ['r-nozzle', [0.00, -0.95, 0.00], 'rocketNozzle', ROCKET_SILVER, 0.30, 3],

    // Boosters — 2 × 4 = 8 (surface: 2 blue) — flanking lower body
    ['r-boost-l', [-0.52, -0.45, 0.00], 'rocketBoosterL', ROCKET_BLUE, 0.22, 4],
    ['r-boost-r', [0.52, -0.45, 0.00], 'rocketBoosterR', ROCKET_BLUE, 0.22, 4],

    // Antenna — 1 × 3 = 3 (surface: 1 white)
    ['r-ant', [0.00, 1.85, 0.00], 'rocketAntenna', ROCKET_WHITE, 0.12, 3],

    // Flame — 1 × 3 = 3 (surface: 1 red) — below nozzle
    ['r-flame', [0.00, -1.20, 0.00], 'rocketFlame', ROCKET_RED, 0.28, 3],

    // Hatch — 1 × 3 = 3 (surface: 1 blue)
    ['r-hatch', [0.00, 0.10, -0.39], 'rocketHatch', ROCKET_BLUE, 0.18, 3],

    // Stripes — 2 × 4 = 8 (surface: 2 red)  wait let me count
    // So far: 10+5+9+6+3+8+3+3+3 = 50.  Need 10 more → stripes 2×5 = 10
    ['r-str-a', [0.00, 0.05, 0.00], 'rocketStripeA', ROCKET_RED, 0.20, 5],
    ['r-str-b', [0.00, 0.90, 0.00], 'rocketStripeB', ROCKET_RED, 0.20, 5],
  ];
  // 10+5+9+6+3+8+3+3+3+5+5 = 60 ✓

  const totalBalls = defs.reduce((s, d) => s + d[5], 0); // 60
  // 16 stacks → 16 surface
  // Surface: silver=4, red=6, blue=5, white=1 → 16
  // Targets: silver=18, red=15, blue=12, orange=9, white=6 → 60
  // Inner: 60-16=44 → silver=14, red=9, blue=7, orange=9, white=5 = 44
  const innerPool: string[] = [];
  const innerCounts: [string, number][] = [
    [ROCKET_SILVER, 14],
    [ROCKET_RED, 9],
    [ROCKET_BLUE, 7],
    [ROCKET_ORANGE, 9],
    [ROCKET_WHITE, 5],
  ];
  for (const [hex, n] of innerCounts) {
    for (let i = 0; i < n; i++) innerPool.push(hex);
  }

  const rng = createRng(46);
  for (let i = innerPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = innerPool[i]; innerPool[i] = innerPool[j]; innerPool[j] = tmp;
  }

  const stacks: BallStack[] = defs.map(([stackId, position, rocketPart, surfColor, surfSize, depth]) => ({
    stackId,
    position,
    rocketPart,
    layers: houseLayers(stackId, surfColor, surfSize, depth, innerPool),
  }));

  const colorGroups: ColorGroup[] = [
    { hex: ROCKET_SILVER, name: 'Silver', count: 18 },
    { hex: ROCKET_RED, name: 'Red', count: 15 },
    { hex: ROCKET_BLUE, name: 'Blue', count: 12 },
    { hex: ROCKET_ORANGE, name: 'Orange', count: 9 },
    { hex: ROCKET_WHITE, name: 'White', count: 6 },
  ];

  return {
    levelNumber: 5,
    stacks,
    colorGroups,
    formationName: 'Rocket',
    totalBalls,
  };
}

// ── Fisher-Yates shuffle (in-place) ───────────────────────────────────────

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/**
 * Generates a fully deterministic level configuration from a level number.
 *
 * Design constraints:
 *   1. Every colour count is a multiple of 3.
 *   2. totalBalls = numPositions × stackDepth  (so colour pool fills exactly).
 *   3. Colours in each stack's layers are assigned from a globally shuffled pool,
 *      so adjacent layers in a stack can be different colours (strategic depth).
 *
 * @param levelNumber — positive integer (clamped to [1, 99])
 */
export function generateLevel(levelNumber: number): LevelData {
  // Seeded RNG for coin assignment — separate seed so it never affects level layout.
  const coinRng = createRng(levelNumber * 31337 + 9973);

  if (levelNumber === 1) return assignCoins(generateHouseLevel(), coinRng);
  if (levelNumber === 2) return assignCoins(generateTreeLevel(), coinRng);
  if (levelNumber === 3) return assignCoins(generateBoatLevel(), coinRng);
  if (levelNumber === 4) return assignCoins(generateCastleLevel(), coinRng);
  if (levelNumber === 5) return assignCoins(generateRocketLevel(), coinRng);

  const level = Math.max(1, Math.min(levelNumber, 99));
  const rng = createRng(level * 7919 + 1337);
  const depth = stackDepthForLevel(level);

  const colorCount = colorCountForLevel(level);
  const maxK = maxKForLevel(level);
  const availableColors = YARN_COLORS.slice(0, colorCount);

  // ── Step 1: assign k×3 count to each colour ───────────────────────────────
  // totalBalls must be divisible by depth so the pool fills stacks evenly.
  // We pick k values, compute their sum, then scale the whole lot if needed.
  const rawGroups = availableColors.map((c) => {
    const k = 1 + Math.floor(rng() * maxK);
    return { hex: c.hex, name: c.name, rawK: k };
  });

  // Find the LCM-compatible total: sum(k) × 3 must be divisible by depth.
  const rawTotal = rawGroups.reduce((s, g) => s + g.rawK * 3, 0);
  // Pad with extra full multiples of (3 × depth) across all colours until divisible.
  let paddedTotal = rawTotal;
  while (paddedTotal % depth !== 0) {
    // Add 3 (one more rawK unit) to the lightest colour's count.
    // Adding `depth` would preserve parity when depth is even, causing
    // an infinite loop. Adding 1 always changes paddedTotal by 3,
    // which flips the parity modulo 2 and guarantees termination.
    rawGroups[0].rawK += 1;
    paddedTotal = rawGroups.reduce((s, g) => s + g.rawK * 3, 0);
  }

  const colorGroups: ColorGroup[] = rawGroups.map(({ hex, name, rawK }) => ({
    hex, name, count: rawK * 3,
  }));

  const totalBalls = colorGroups.reduce((s, g) => s + g.count, 0);
  const numPositions = totalBalls / depth;

  // ── Step 2: build & shuffle ball-colour pool ──────────────────────────────
  const colorPool: string[] = [];
  for (const { hex, count } of colorGroups) {
    for (let i = 0; i < count; i++) colorPool.push(hex);
  }
  shuffle(colorPool, rng);

  // ── Step 3: get formation positions ───────────────────────────────────────
  const positions = getFormationPositions(level, numPositions, rng);
  const formName = getFormationName(level);

  // ── Step 4: build stacks ──────────────────────────────────────────────────
  const stacks: BallStack[] = positions.map((pos, si) => {
    const layers: StackLayer[] = [];
    for (let li = 0; li < depth; li++) {
      // Outer balls are slightly larger; inner balls slightly smaller.
      const sizeBase = 0.32 - li * 0.04;
      const size = sizeBase + rng() * 0.14;
      layers.push({
        id: `s${si}-l${li}`,
        color: colorPool[si * depth + li] ?? colorPool[0],
        size: Math.max(0.22, Math.min(size, 0.48)),
      });
    }
    return { stackId: `s${si}`, position: pos, layers };
  });

  return assignCoins(
    { levelNumber: level, stacks, colorGroups, formationName: formName, totalBalls },
    coinRng,
  );
}

// ── Coin assignment helper ─────────────────────────────────────────────────

/** Probability that any given layer ball contains a coin. */
const COIN_CHANCE = 0.25;

/**
 * Deterministically assigns `hasCoin` to ~25% of all layer balls in the level.
 * Uses a seeded RNG so the same level always has the same coin positions.
 */
function assignCoins(data: LevelData, rng: () => number): LevelData {
  return {
    ...data,
    stacks: data.stacks.map((stack) => ({
      ...stack,
      layers: stack.layers.map((layer) => ({
        ...layer,
        hasCoin: rng() < COIN_CHANCE,
      })),
    })),
  };
}

// ── Helpers for YarnBallGenerator ─────────────────────────────────────────

/**
 * Returns a map of hex → count for all layers currently in the given stacks.
 * Used by the generator to pick new collector colours intelligently.
 */
export function countRemainingColors(
  stacks: ReadonlyArray<{ layers: ReadonlyArray<{ color: string }> }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const stack of stacks) {
    for (const layer of stack.layers) {
      counts.set(layer.color, (counts.get(layer.color) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Picks the colour with the highest remaining count, excluding `excludeColor`.
 * Falls back to any remaining colour if all are excluded.
 * Returns null if no balls remain.
 */
export function pickNextColor(
  remaining: Map<string, number>,
  excludeColor: string | null,
): string | null {
  let best: string | null = null;
  let bestCount = -1;
  for (const [color, count] of remaining) {
    if (color === excludeColor) continue;
    if (count > bestCount) { best = color; bestCount = count; }
  }
  // Fallback: if all remaining == excludeColor, pick it anyway
  if (best === null) {
    for (const [color, count] of remaining) {
      if (count > bestCount) { best = color; bestCount = count; }
    }
  }
  return best;
}
