/**
 * yarnTexture — string texture URL for 3D yarn ball thread rendering.
 *
 * All yarn-ball spiral threads use string.png so the tubes look like
 * real twisted rope/thread rather than flat fabric.  The texture is
 * tinted at runtime by the ball colour (Three.js multiplies map × color).
 */

/** Public URL (served from /public) of the thread texture. */
export const STRING_TEXTURE_URL = '/assets/textures/yarn/string.png';

/** Knit fabric textures — randomly assigned per yarn object. */
export const KNIT_TEXTURE_URLS = [
  '/assets/textures/yarn/knit1.jpg',
  '/assets/textures/yarn/knit2.jpg',
  '/assets/textures/yarn/knit3.jpg',
  '/assets/textures/yarn/knit4.jpg',
  '/assets/textures/yarn/knit5.jpg',
  '/assets/textures/yarn/knit6.jpg',
] as const;
