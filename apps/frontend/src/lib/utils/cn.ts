/**
 * Utility for conditionally joining CSS class names together.
 * Lightweight alternative to `clsx` / `classnames` packages.
 */

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

/**
 * Merges and deduplicates class name strings.
 * Falsy values are ignored.
 *
 * @param classes - Class values (strings, booleans, arrays, null/undefined)
 * @returns Merged class name string
 *
 * @example
 * cn('base', isActive && 'active', ['extra', false && 'nope'])
 * // => "base active extra"
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string' || typeof cls === 'number') {
      result.push(String(cls));
    } else if (Array.isArray(cls)) {
      const inner = cn(...cls);
      if (inner) result.push(inner);
    }
  }

  return result.join(' ');
}
