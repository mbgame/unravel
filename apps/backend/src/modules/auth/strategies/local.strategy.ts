/**
 * LocalStrategy — validates email + password during the login flow.
 * Used exclusively by LocalAuthGuard on POST /auth/login.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Passport local strategy.
 * Overrides the default `username` field to use `email` instead.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Validates credentials and returns the user entity on success.
   *
   * @param email - Submitted email address
   * @param password - Plain-text password to verify
   * @throws UnauthorizedException when credentials are invalid
   */
  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
