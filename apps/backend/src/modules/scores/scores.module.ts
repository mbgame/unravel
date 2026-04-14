/**
 * ScoresModule — score submission and retrieval feature.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { ScoreEntity } from './entities/score.entity';
import { LevelEntity } from '../levels/entities/level.entity';

/**
 * Scores feature module.
 * Exports ScoresService so LeaderboardModule can query scores.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ScoreEntity, LevelEntity])],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
