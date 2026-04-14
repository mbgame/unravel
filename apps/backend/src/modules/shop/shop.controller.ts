import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShopService, type CosmeticDto, type EquippedCosmetics } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * ShopController — cosmetics listing, purchasing, and equipping.
 */
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * List all cosmetics (public). Ownership flags default to isDefault only.
   * Authenticated clients should also call GET /shop/owned-keys to merge.
   * GET /api/v1/shop/cosmetics
   */
  @Public()
  @Get('cosmetics')
  listCosmetics(): Promise<CosmeticDto[]> {
    return this.shopService.listCosmetics();
  }

  /**
   * Returns the cosmetic keys owned by the authenticated user.
   * Frontend merges this with the cosmetics list to set owned flags.
   * GET /api/v1/shop/owned-keys
   */
  @UseGuards(JwtAuthGuard)
  @Get('owned-keys')
  getOwnedKeys(@CurrentUser() user: JwtPayload): Promise<string[]> {
    return this.shopService.getOwnedKeys(user.sub);
  }

  /**
   * Get currently equipped cosmetics for the authenticated user.
   * GET /api/v1/shop/equipped
   */
  @UseGuards(JwtAuthGuard)
  @Get('equipped')
  getEquipped(@CurrentUser() user: JwtPayload): Promise<EquippedCosmetics> {
    return this.shopService.getEquipped(user.sub);
  }

  /**
   * Purchase a cosmetic using coins.
   * POST /api/v1/shop/purchase/:key
   */
  @UseGuards(JwtAuthGuard)
  @Post('purchase/:key')
  @HttpCode(HttpStatus.OK)
  purchase(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
  ): Promise<{ newCoins: number }> {
    return this.shopService.purchase(user.sub, key);
  }

  /**
   * Equip an owned cosmetic (automatically unequips the previous of the same type).
   * POST /api/v1/shop/equip/:key
   */
  @UseGuards(JwtAuthGuard)
  @Post('equip/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async equip(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
  ): Promise<void> {
    return this.shopService.equip(user.sub, key);
  }
}
