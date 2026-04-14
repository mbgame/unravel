import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { GamificationService, type LevelCompletionResult, type GamificationProfile } from './gamification.service';
import { CompleteLevelDto } from './dto/complete-level.dto';

/**
 * GamificationController — coins, XP, and player level endpoints.
 * All routes require JWT authentication.
 */
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * Award coins and XP for completing a level.
   * POST /api/v1/gamification/complete
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompleteLevelDto,
  ): Promise<LevelCompletionResult> {
    return this.gamificationService.awardLevelCompletion(user.sub, dto);
  }

  /**
   * Get the current user's gamification profile (coins, XP, level).
   * GET /api/v1/gamification/profile
   */
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload): Promise<GamificationProfile> {
    return this.gamificationService.getProfile(user.sub);
  }
}
