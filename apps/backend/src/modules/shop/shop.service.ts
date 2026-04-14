import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CosmeticEntity } from './entities/cosmetic.entity';
import { UserCosmeticEntity } from './entities/user-cosmetic.entity';
import { UserEntity } from '../users/entities/user.entity';

export interface CosmeticDto {
  key: string;
  type: string;
  name: string;
  description: string;
  iconUrl?: string;
  costCoins: number;
  requiredPlayerLevel: number;
  isDefault: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface EquippedCosmetics {
  yarnColor: string;
  background: string;
  celebration: string;
}

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(CosmeticEntity)
    private readonly cosmeticsRepo: Repository<CosmeticEntity>,
    @InjectRepository(UserCosmeticEntity)
    private readonly userCosmeticsRepo: Repository<UserCosmeticEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  /** List all cosmetics (no ownership flags — ownership is fetched separately). */
  async listCosmetics(): Promise<CosmeticDto[]> {
    const all = await this.cosmeticsRepo.find({ order: { type: 'ASC', costCoins: 'ASC' } });
    return all.map((c) => ({
      key: c.key,
      type: c.type,
      name: c.name,
      description: c.description,
      iconUrl: c.iconUrl,
      costCoins: c.costCoins,
      requiredPlayerLevel: c.requiredPlayerLevel,
      isDefault: c.isDefault,
      owned: c.isDefault, // defaults are always owned
      equipped: false,    // caller merges equipped state from getEquipped()
    }));
  }

  /** Returns the set of cosmetic keys owned by the user (for frontend merge). */
  async getOwnedKeys(userId: string): Promise<string[]> {
    const rows = await this.userCosmeticsRepo.find({ where: { userId } });
    return rows.map((r) => r.cosmeticKey);
  }

  /** Returns the currently equipped cosmetic key per type. Defaults if nothing equipped. */
  async getEquipped(userId: string): Promise<EquippedCosmetics> {
    const rows = await this.userCosmeticsRepo.find({
      where: { userId },
    });

    const equippedMap: Record<string, string> = {};
    for (const row of rows) {
      if (row.equippedType) {
        equippedMap[row.equippedType] = row.cosmeticKey;
      }
    }

    return {
      yarnColor:   equippedMap['yarn_color']  ?? 'default',
      background:  equippedMap['background']  ?? 'sky',
      celebration: equippedMap['celebration'] ?? 'confetti',
    };
  }

  /** Purchase a cosmetic with coins. */
  async purchase(userId: string, cosmeticKey: string): Promise<{ newCoins: number }> {
    const cosmetic = await this.cosmeticsRepo.findOne({ where: { key: cosmeticKey } });
    if (!cosmetic) throw new NotFoundException(`Cosmetic '${cosmeticKey}' not found`);
    if (cosmetic.isDefault) throw new BadRequestException('Default cosmetics are free — nothing to purchase');

    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });

    if (user.playerLevel < cosmetic.requiredPlayerLevel) {
      throw new ForbiddenException(
        `Reach player level ${cosmetic.requiredPlayerLevel} to unlock this cosmetic`,
      );
    }

    const alreadyOwned = await this.userCosmeticsRepo.findOne({
      where: { userId, cosmeticKey },
    });
    if (alreadyOwned) throw new BadRequestException('Already owned');

    if (user.coins < cosmetic.costCoins) {
      throw new BadRequestException(
        `Not enough coins — need ${cosmetic.costCoins}, have ${user.coins}`,
      );
    }

    const newCoins = user.coins - cosmetic.costCoins;
    await this.usersRepo.update(userId, { coins: newCoins });
    await this.userCosmeticsRepo.save(
      this.userCosmeticsRepo.create({ userId, cosmeticKey }),
    );

    return { newCoins };
  }

  /** Equip an owned cosmetic (unequips the previous one of the same type). */
  async equip(userId: string, cosmeticKey: string): Promise<void> {
    const cosmetic = await this.cosmeticsRepo.findOne({ where: { key: cosmeticKey } });
    if (!cosmetic) throw new NotFoundException(`Cosmetic '${cosmeticKey}' not found`);

    // Check ownership (defaults are always owned)
    if (!cosmetic.isDefault) {
      const owned = await this.userCosmeticsRepo.findOne({ where: { userId, cosmeticKey } });
      if (!owned) throw new ForbiddenException('You do not own this cosmetic');
    }

    // Unequip previous item of same type
    await this.userCosmeticsRepo
      .createQueryBuilder()
      .update()
      .set({ equippedType: () => 'NULL' })
      .where('user_id = :userId AND equipped_type = :type', {
        userId,
        type: cosmetic.type,
      })
      .execute();

    // For defaults, we may not have a row — upsert
    if (cosmetic.isDefault) {
      const existing = await this.userCosmeticsRepo.findOne({ where: { userId, cosmeticKey } });
      if (!existing) {
        await this.userCosmeticsRepo.save(
          this.userCosmeticsRepo.create({ userId, cosmeticKey, equippedType: cosmetic.type }),
        );
        return;
      }
    }

    await this.userCosmeticsRepo.update(
      { userId, cosmeticKey },
      { equippedType: cosmetic.type },
    );
  }
}
