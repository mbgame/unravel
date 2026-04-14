/**
 * @CurrentUser() parameter decorator — extracts the authenticated user
 * from the request object populated by JwtAuthGuard / LocalAuthGuard.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Injects the current authenticated user's JWT payload into a controller parameter.
 *
 * @example
 * ```ts
 * @Get('me')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return this.usersService.findById(user.sub);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
