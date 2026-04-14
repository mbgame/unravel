/**
 * DailyChallengeController — endpoints for today's daily challenge.
 */

import { Controller, Get } from '@nestjs/common';
import {
  DailyChallengeService,
  type DailyChallengeResponse,
} from './daily-challenge.service';
import { Public } from '../../common/decorators/public.decorator';
import type { LeaderboardEntry } from '../leaderboard/leaderboard.service';

/**
 * Daily challenge controller — all routes are public.
 */
@Public()
@Controller('daily-challenge')
export class DailyChallengeController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  /**
   * Returns today's daily challenge level.
   * GET /api/v1/daily-challenge/today
   */
  @Get('today')
  findToday(): Promise<DailyChallengeResponse> {
    return this.dailyChallengeService.findToday();
  }

  /**
   * Returns the leaderboard for today's daily challenge.
   * GET /api/v1/daily-challenge/leaderboard
   */
  @Get('leaderboard')
  getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.dailyChallengeService.getDailyLeaderboard();
  }
}
