/**
 * LeaderboardController — public leaderboard endpoints.
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService, type LeaderboardEntry } from './leaderboard.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Leaderboard controller — all routes are public (no auth required).
 */
@Public()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * Returns the global top-100 leaderboard.
   * GET /api/v1/leaderboard/global?limit=100
   */
  @Get('global')
  getGlobal(@Query('limit') limit?: string): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getGlobal(limit ? Number(limit) : undefined);
  }

  /**
   * Returns the top-100 leaderboard for a specific level.
   * GET /api/v1/leaderboard/level/:id
   */
  @Get('level/:id')
  getByLevel(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getByLevel(id, limit ? Number(limit) : undefined);
  }
}
