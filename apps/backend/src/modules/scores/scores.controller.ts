/**
 * ScoresController — score submission and retrieval endpoints.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ScoresService, type ScoreResult } from './scores.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { ScoreEntity } from './entities/score.entity';

/** Score submission rate limit — 10 per minute per user. */
const SCORE_THROTTLE_LIMIT = 10;
/** TTL for the score submission throttle window (milliseconds). */
const SCORE_THROTTLE_TTL_MS = 60 * 1000;

/**
 * Scores controller — all routes require JWT authentication.
 */
@UseGuards(JwtAuthGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  /**
   * Submit a completed level attempt.
   * Score is recalculated server-side from timeMs, moves, hintsUsed.
   * POST /api/v1/scores
   */
  @Throttle({ default: { limit: SCORE_THROTTLE_LIMIT, ttl: SCORE_THROTTLE_TTL_MS } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitScoreDto,
  ): Promise<ScoreResult> {
    return this.scoresService.submit(user.sub, dto);
  }

  /**
   * Returns the authenticated user's best scores across all levels.
   * GET /api/v1/scores/me
   */
  @Get('me')
  findMine(@CurrentUser() user: JwtPayload): Promise<ScoreEntity[]> {
    return this.scoresService.findMyScores(user.sub);
  }
}
