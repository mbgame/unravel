/**
 * DailyChallengeModule — daily challenge scheduling and endpoints.
 * Requires ScheduleModule (from @nestjs/schedule) to be registered globally.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallengeController } from './daily-challenge.controller';
import { DailyChallengeService } from './daily-challenge.service';
import { DailyChallengeEntity } from './entities/daily-challenge.entity';
import { LevelEntity } from '../levels/entities/level.entity';
import { ScoreEntity } from '../scores/entities/score.entity';

/**
 * Daily challenge feature module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DailyChallengeEntity, LevelEntity, ScoreEntity])],
  controllers: [DailyChallengeController],
  providers: [DailyChallengeService],
})
export class DailyChallengeModule {}
