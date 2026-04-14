/**
 * @Public() decorator — marks a route as publicly accessible,
 * bypassing the global JwtAuthGuard.
 */

import { SetMetadata } from '@nestjs/common';

/** Metadata key used by JwtAuthGuard to check public status. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Route decorator that signals JwtAuthGuard to skip authentication.
 *
 * @example
 * ```ts
 * @Public()
 * @Post('register')
 * register(@Body() dto: RegisterDto) { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
