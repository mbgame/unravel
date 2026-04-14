/**
 * LeaderboardModule — public leaderboard ranking endpoints.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { UserEntity } from '../users/entities/user.entity';

/**
 * Leaderboard feature module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
