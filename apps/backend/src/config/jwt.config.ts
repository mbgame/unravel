import { registerAs } from '@nestjs/config';

/** Default access token TTL. */
const ACCESS_TOKEN_TTL = '15m';
/** Default refresh token TTL. */
const REFRESH_TOKEN_TTL = '7d';

/**
 * JWT configuration factory.
 * Access tokens expire in 15 minutes; refresh tokens expire in 7 days.
 */
export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? ACCESS_TOKEN_TTL,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? REFRESH_TOKEN_TTL,
}));
