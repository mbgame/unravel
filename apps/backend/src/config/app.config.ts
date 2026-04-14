import { registerAs } from '@nestjs/config';

/** Default application port. */
const DEFAULT_PORT = 3001;

/**
 * Application-level configuration factory.
 * Covers port, environment, and CORS settings.
 * PORT takes precedence (Railway injects it); APP_PORT is the legacy fallback.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? process.env.APP_PORT ?? String(DEFAULT_PORT), 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000',
}));
