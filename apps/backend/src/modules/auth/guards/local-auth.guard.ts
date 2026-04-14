/**
 * LocalAuthGuard — triggers the Passport local strategy
 * (email + password validation) for the login endpoint.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that runs the local (email/password) Passport strategy.
 * Apply only to POST /auth/login.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
