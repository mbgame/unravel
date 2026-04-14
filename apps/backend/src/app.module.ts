import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LevelsModule } from './modules/levels/levels.module';
import { ScoresModule } from './modules/scores/scores.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { DailyChallengeModule } from './modules/daily-challenge/daily-challenge.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ShopModule } from './modules/shop/shop.module';

/** Requests allowed per throttle window. */
const THROTTLE_LIMIT = 10;
/** Throttle window in seconds. */
const THROTTLE_TTL_SECONDS = 60;

/**
 * Root application module.
 * Registers global configuration, database, rate limiting, and all feature modules.
 */
@Module({
  imports: [
    /** Global config — load from .env, validated by Joi in each config factory */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    /** PostgreSQL via TypeORM */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false, // Always use migrations — never synchronize in prod
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
    }),

    /** Global rate limiting: 10 requests per 60 seconds */
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_TTL_SECONDS * 1000,
        limit: THROTTLE_LIMIT,
      },
    ]),

    /** Cron scheduling for DailyChallenge */
    ScheduleModule.forRoot(),

    /** Feature modules */
    AuthModule,
    UsersModule,
    LevelsModule,
    ScoresModule,
    LeaderboardModule,
    DailyChallengeModule,
    GamificationModule,
    ShopModule,
  ],
})
export class AppModule {}
