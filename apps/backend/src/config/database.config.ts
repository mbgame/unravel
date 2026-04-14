import { registerAs } from '@nestjs/config';

/** Default PostgreSQL port. */
const POSTGRES_DEFAULT_PORT = 5432;

/**
 * Parse individual DB fields from a DATABASE_URL connection string.
 * Returns null if the URL is absent or malformed.
 */
function parseDatabaseUrl(url: string | undefined): {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
} | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || String(POSTGRES_DEFAULT_PORT), 10),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      name: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

/**
 * Database configuration factory.
 * DATABASE_URL (provided by Railway) takes precedence over individual DB_* vars.
 */
export default registerAs('database', () => {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  return {
    host: fromUrl?.host ?? process.env.DB_HOST ?? 'localhost',
    port: fromUrl?.port ?? parseInt(process.env.DB_PORT ?? String(POSTGRES_DEFAULT_PORT), 10),
    username: fromUrl?.username ?? process.env.DB_USERNAME ?? 'postgres',
    password: fromUrl?.password ?? process.env.DB_PASSWORD ?? 'postgres',
    name: fromUrl?.name ?? process.env.DB_NAME ?? 'unravel',
  };
});
