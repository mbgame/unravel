/**
 * Jest global setup — runs once before all e2e test suites.
 * Sets environment variables required by the test environment.
 */

export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'e2e-test-secret-at-least-32-characters-long-ok';
  process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-at-least-32-chars-ok';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.PORT = '3099';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  // DATABASE_URL must be set externally (CI or .env.test)
}
