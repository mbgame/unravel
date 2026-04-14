/**
 * LevelsModule — level data endpoints and service.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { LevelEntity } from './entities/level.entity';

/**
 * Levels feature module.
 * Exports LevelsService so other modules (e.g., DailyChallenge) can use it.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LevelEntity])],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
