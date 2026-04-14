import React from 'react';

/**
 * CoinIcon — reusable SVG coin matching the in-game HUD style.
 * Gold coin with inner ring, 4-pointed star, and 3-D highlight sheen.
 */
export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      <circle cx="9" cy="9" r="8.25" fill="#F5C518" stroke="#C9950C" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="5.6" fill="none" stroke="#C9950C" strokeWidth="0.7" opacity="0.55" />
      <path
        d="M9,6.2 L9.9,8.1 L11.8,9 L9.9,9.9 L9,11.8 L8.1,9.9 L6.2,9 L8.1,8.1 Z"
        fill="#C9950C"
      />
      <ellipse
        cx="6.4" cy="5.8" rx="2.2" ry="1.1"
        fill="rgba(255,255,255,0.45)"
        transform="rotate(-25 6.4 5.8)"
      />
    </svg>
  );
}
