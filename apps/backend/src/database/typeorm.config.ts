import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../modules/users/entities/user.entity';
import { LevelEntity } from '../modules/levels/entities/level.entity';
import { ScoreEntity } from '../modules/scores/entities/score.entity';
import { AchievementEntity } from '../modules/achievements/entities/achievement.entity';
import { UserAchievementEntity } from '../modules/achievements/entities/user-achievement.entity';
import { DailyChallengeEntity } from '../modules/daily-challenge/entities/daily-challenge.entity';
import { CosmeticEntity } from '../modules/shop/entities/cosmetic.entity';
import { UserCosmeticEntity } from '../modules/shop/entities/user-cosmetic.entity';

dotenv.config();

/** Default PostgreSQL port. */
const POSTGRES_DEFAULT_PORT = 5432;

/** Parse individual fields from a DATABASE_URL if provided (e.g. on Railway). */
function parseDatabaseUrl(url: string | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || String(POSTGRES_DEFAULT_PORT), 10),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);

/**
 * TypeORM DataSource for CLI migrations.
 * Used by `typeorm migration:run` and `typeorm migration:generate`.
 * DATABASE_URL (Railway) takes precedence over individual DB_* vars.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: fromUrl?.host ?? process.env.DB_HOST ?? 'localhost',
  port: fromUrl?.port ?? parseInt(process.env.DB_PORT ?? String(POSTGRES_DEFAULT_PORT), 10),
  username: fromUrl?.username ?? process.env.DB_USERNAME ?? 'postgres',
  password: fromUrl?.password ?? process.env.DB_PASSWORD ?? 'postgres',
  database: fromUrl?.database ?? process.env.DB_NAME ?? 'unravel',
  entities: [
    UserEntity,
    LevelEntity,
    ScoreEntity,
    AchievementEntity,
    UserAchievementEntity,
    DailyChallengeEntity,
    CosmeticEntity,
    UserCosmeticEntity,
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
