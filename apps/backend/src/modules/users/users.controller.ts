/**
 * UsersController — profile endpoints under /users.
 */

import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService, type PublicProfile } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { UserEntity } from './entities/user.entity';

/**
 * User profile controller.
 * Protected routes require a valid JWT access token.
 */
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the authenticated user's full profile.
   * GET /api/v1/users/me
   */
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload): Promise<UserEntity> {
    return this.usersService.findById(user.sub);
  }

  /**
   * Updates the authenticated user's mutable profile fields.
   * PATCH /api/v1/users/me
   */
  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.updateMe(user.sub, dto);
  }

  /**
   * Returns a public profile (no sensitive data).
   * GET /api/v1/users/:id/profile
   */
  @Public()
  @Get(':id/profile')
  getPublicProfile(@Param('id') id: string): Promise<PublicProfile> {
    return this.usersService.getPublicProfile(id);
  }
}
