/**
 * Game-domain constants used across the frontend game engine.
 */

/** Base score awarded for completing a level. */
export const BASE_SCORE = 1000;

/** Score penalty per second elapsed (2 pts / second). */
export const TIME_PENALTY_PER_SECOND = 2;

/** Score penalty per move made. */
export const MOVE_PENALTY_PER_MOVE = 5;

/** Score penalty per hint used. */
export const HINT_PENALTY_PER_HINT = 100;

/** Minimum possible score (floor). */
export const MIN_SCORE = 0;

/** Duration in milliseconds to wait before checking untangle state. */
export const UNTANGLE_CHECK_THROTTLE_MS = 100;

/** Continuous frames below this FPS before downgrading quality. */
export const FPS_DOWNGRADE_THRESHOLD = 45;

/** How long (ms) FPS must stay below threshold before quality downgrade. */
export const FPS_DOWNGRADE_WINDOW_MS = 3000;

/** Minimum zoom scale for knot mesh. */
export const ZOOM_MIN = 0.5;

/** Maximum zoom scale for knot mesh. */
export const ZOOM_MAX = 2.0;

/** Rotational inertia decay factor per frame. */
export const INERTIA_DECAY = 0.95;

/** Tap duration threshold (ms) — below this counts as a tap, not a drag. */
export const TAP_DURATION_MS = 150;

/** Camera field of view in degrees. */
export const CAMERA_FOV = 60;

/** Camera initial Z position. */
export const CAMERA_Z = 6;

/** Ambient light intensity. */
export const AMBIENT_LIGHT_INTENSITY = 0.6;

/** Directional light intensity. */
export const DIRECTIONAL_LIGHT_INTENSITY = 1.0;

/** Default string (rope) radius for TubeGeometry. */
export const DEFAULT_STRING_RADIUS = 0.08;

/** Sphere radius multiplier for knot nodes relative to string radius. */
export const NODE_RADIUS_MULTIPLIER = 1.5;

/** Number of tubular segments per string segment (quality: high). */
export const TUBE_SEGMENTS_HIGH = 32;

/** Number of tubular segments per string segment (quality: medium). */
export const TUBE_SEGMENTS_MEDIUM = 24;

/** Number of tubular segments per string segment (quality: low). */
export const TUBE_SEGMENTS_LOW = 16;

/** Particle count for untangle effect (quality: high). */
export const PARTICLE_COUNT_HIGH = 200;

/** Particle count for untangle effect (quality: medium). */
export const PARTICLE_COUNT_MEDIUM = 100;

/** Particle count for untangle effect (quality: low). */
export const PARTICLE_COUNT_LOW = 0;

/** Maximum difficulty level for knot generation. */
export const MAX_DIFFICULTY = 10;

/** Minimum difficulty level for knot generation. */
export const MIN_DIFFICULTY = 1;
