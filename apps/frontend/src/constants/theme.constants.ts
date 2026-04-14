/**
 * Theme and visual design constants for the game UI.
 */

/** Brand color palette. */
export const COLORS = {
  PRIMARY: '#6C63FF',
  PRIMARY_DARK: '#4C46C0',
  SECONDARY: '#FF6584',
  ACCENT: '#43E97B',
  BACKGROUND: '#0D0D1A',
  SURFACE: '#1A1A2E',
  SURFACE_ELEVATED: '#252540',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A0A0C0',
  TEXT_MUTED: '#606080',
  SUCCESS: '#43E97B',
  WARNING: '#FFB347',
  ERROR: '#FF6B6B',
} as const;

/** String (rope) colors used in knots — one per string index. */
export const STRING_COLORS = [
  '#FF6584', // Pink
  '#6C63FF', // Purple
  '#43E97B', // Green
  '#FFB347', // Orange
  '#4FC3F7', // Light Blue
  '#F06292', // Deep Pink
  '#AED581', // Light Green
  '#FFD54F', // Amber
] as const;

/** Background gradient colors (from, to). */
export const BACKGROUND_GRADIENT = {
  FROM: '#0D0D1A',
  TO: '#1A0A2E',
} as const;

/** Minimum touch target size in pixels (accessibility). */
export const MIN_TOUCH_TARGET_PX = 48;

/** Border radius scale. */
export const BORDER_RADIUS = {
  SM: '8px',
  MD: '12px',
  LG: '16px',
  XL: '24px',
  FULL: '9999px',
} as const;

/** Animation durations in milliseconds. */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const;

/** Z-index layers. */
export const Z_INDEX = {
  CANVAS: 0,
  HUD: 10,
  MODAL_BACKDROP: 20,
  MODAL: 30,
  TOAST: 40,
} as const;

/** Font sizes (rem). */
export const FONT_SIZE = {
  XS: '0.75rem',
  SM: '0.875rem',
  BASE: '1rem',
  LG: '1.125rem',
  XL: '1.25rem',
  '2XL': '1.5rem',
  '3XL': '1.875rem',
} as const;
