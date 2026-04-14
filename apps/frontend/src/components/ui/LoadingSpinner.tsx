/**
 * LoadingSpinner — accessible animated loading indicator.
 */

'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /** Size in pixels. Defaults to 32. */
  size?: number;
  /** Accessible label for screen readers. */
  label?: string;
  /** Additional Tailwind classes for colour overrides, etc. */
  className?: string;
}

/**
 * Circular SVG spinner with `aria-label` for accessibility.
 *
 * @param size - Diameter in pixels
 * @param label - Screen-reader description
 * @param className - Extra Tailwind utility classes
 */
export const LoadingSpinner = React.memo(function LoadingSpinner({
  size = 32,
  label = 'Loading…',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={['animate-spin text-brand-primary', className].join(' ')}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
});
