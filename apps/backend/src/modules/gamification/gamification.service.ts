import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CompleteLevelDto } from './dto/complete-level.dto';

export interface LevelCompletionResult {
  coinsAwarded: number;
  xpAwarded: number;
  newCoins: number;
  newTotalXp: number;
  newPlayerLevel: number;
  didLevelUp: boolean;
  xpToNextLevel: number;
}

export interface GamificationProfile {
  coins: number;
  totalXp: number;
  playerLevel: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
}

/**
 * Returns the total XP required to reach `level` (1-based).
 * Level 1 = 0 XP, level 2 = 100, level 3 = 283, level 4 = 520 ...
 */
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

/**
 * Calculates which player level corresponds to `totalXp`.
 */
function playerLevelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Calculates XP awarded for completing a level.
 * Base: levelNumber × 15 + 10
 * Perfect bonus (0 penalty balls): +15
 */
function calculateXpAward(levelNumber: number, penaltyCount: number): number {
  const base = levelNumber * 15 + 10;
  const perfectBonus = penaltyCount === 0 ? 15 : 0;
  return base + perfectBonus;
}

/**
 * Calculates the win bonus coins added on top of in-game coin pickups.
 * Win bonus: levelNumber × 2 coins.
 */
function calculateWinBonusCoins(levelNumber: number): number {
  return levelNumber * 2;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  /**
   * Awards coins + XP for completing a level.
   * Recalculates player level and returns the full result.
   */
  async awardLevelCompletion(
    userId: string,
    dto: CompleteLevelDto,
  ): Promise<LevelCompletionResult> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });

    const winBonus = calculateWinBonusCoins(dto.levelNumber);
    const coinsAwarded = dto.coinsEarned + winBonus;
    const xpAwarded = calculateXpAward(dto.levelNumber, dto.penaltyCount);

    const oldLevel = user.playerLevel;
    const newTotalXp = user.totalXp + xpAwarded;
    const newPlayerLevel = playerLevelFromXp(newTotalXp);
    const newCoins = user.coins + coinsAwarded;

    await this.usersRepo.update(userId, {
      coins: newCoins,
      totalXp: newTotalXp,
      playerLevel: newPlayerLevel,
    });

    return {
      coinsAwarded,
      xpAwarded,
      newCoins,
      newTotalXp,
      newPlayerLevel,
      didLevelUp: newPlayerLevel > oldLevel,
      xpToNextLevel: xpForLevel(newPlayerLevel + 1) - newTotalXp,
    };
  }

  /** Returns the gamification profile for a user. */
  async getProfile(userId: string): Promise<GamificationProfile> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });
    const level = user.playerLevel;
    const xpCurrent = xpForLevel(level);
    const xpNext = xpForLevel(level + 1);

    return {
      coins: user.coins,
      totalXp: user.totalXp,
      playerLevel: level,
      xpToNextLevel: xpNext - user.totalXp,
      xpForCurrentLevel: xpCurrent,
    };
  }
}
