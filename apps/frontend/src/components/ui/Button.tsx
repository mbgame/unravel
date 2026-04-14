/**
 * Button — reusable base button component with touch-target enforcement.
 * All interactive variants share this primitive to ensure consistent
 * accessibility and mobile sizing.
 */

'use client';

import React, { type ButtonHTMLAttributes } from 'react';

/** Visual style variants for the button. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Size presets that map to Tailwind class combinations. */
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. Defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `'md'`. */
  size?: ButtonSize;
  /** When true, shows a spinner and disables the button. */
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:opacity-90 active:scale-95 focus-visible:ring-brand-primary',
  secondary:
    'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 focus-visible:ring-white/30',
  ghost:
    'bg-transparent text-white hover:bg-white/10 active:scale-95 focus-visible:ring-white/20',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:scale-95 focus-visible:ring-red-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[48px] min-w-[48px] px-4 py-2 text-sm',
  md: 'min-h-[48px] min-w-[48px] px-6 py-3 text-base',
  lg: 'min-h-[56px] min-w-[56px] px-8 py-4 text-lg',
};

/**
 * Base button component.
 *
 * @param variant - Visual style variant
 * @param size - Touch-target size preset (all enforce min 48×48 px)
 * @param isLoading - Disables button and shows inline spinner
 * @param children - Button label / content
 */
export const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
