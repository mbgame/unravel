/**
 * LevelsController — public endpoints for fetching game levels.
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { LevelsService, type PaginatedLevels } from './levels.service';
import { Public } from '../../common/decorators/public.decorator';
import type { LevelEntity } from './entities/level.entity';

/**
 * Query parameters for the level list endpoint.
 */
class LevelsQueryParams {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;
}

/**
 * Levels controller — all routes are public (no auth required to read levels).
 */
@Public()
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  /**
   * Returns a paginated list of levels with optional difficulty filter.
   * GET /api/v1/levels?page=1&limit=20&difficulty=3
   */
  @Get()
  findAll(@Query() query: LevelsQueryParams): Promise<PaginatedLevels> {
    return this.levelsService.findAll({
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      difficulty: query.difficulty ? Number(query.difficulty) : undefined,
    });
  }

  /**
   * Returns today's daily challenge level.
   * GET /api/v1/levels/daily/today
   *
   * @remarks
   * This route MUST be declared before `:id` to prevent 'daily' being
   * treated as a UUID parameter.
   */
  @Get('daily/today')
  findDailyToday(): Promise<LevelEntity> {
    return this.levelsService.findDailyToday();
  }

  /**
   * Returns a single level by UUID.
   * GET /api/v1/levels/:id
   */
  @Get(':id')
  findById(@Param('id') id: string): Promise<LevelEntity> {
    return this.levelsService.findById(id);
  }
}
