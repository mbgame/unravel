/**
 * JwtStrategy — validates the short-lived access token (15 min).
 * Extracts the Bearer token from the Authorization header.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/** Shape of the JWT access token payload. */
export interface JwtPayload {
  /** User UUID (subject). */
  sub: string;
  /** User email. */
  email: string;
}

/**
 * Passport strategy for JWT access-token validation.
 * Registered under the name `'jwt'` so `JwtAuthGuard` can reference it.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.accessSecret');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called after the token signature is verified.
   * Returns the value attached to `req.user`.
   *
   * @param payload - Decoded JWT payload
   */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
