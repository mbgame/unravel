/**
 * LeaderboardService — queries ranked users by totalXp with a 60-second in-memory cache.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';

/** Cache entry wrapper. */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Cache TTL in milliseconds (60 seconds). */
const CACHE_TTL_MS = 60 * 1000;

/** Maximum entries returned per leaderboard query. */
const MAX_ENTRIES = 100;

/** A single leaderboard row returned to the client. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  timeMs: number;
  moves: number;
}

/**
 * Service providing cached leaderboard queries.
 * Ranks users by totalXp (earned through the gamification system).
 */
@Injectable()
export class LeaderboardService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  /**
   * Returns the top 100 users globally, ranked by totalXp.
   *
   * @param limit - Number of entries to return (max 100)
   */
  async getGlobal(limit = MAX_ENTRIES): Promise<LeaderboardEntry[]> {
    const cap = Math.min(limit, MAX_ENTRIES);
    const key = `global:${cap}`;
    const cached = this.getCache<LeaderboardEntry[]>(key);
    if (cached) return cached;

    const rows = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.totalXp > 0')
      .orderBy('user.totalXp', 'DESC')
      .addOrderBy('user.createdAt', 'ASC')
      .take(cap)
      .getMany();

    const result = rows.map((row, i) => this.toEntry(row, i + 1));
    this.setCache(key, result);
    return result;
  }

  /**
   * Returns the top 100 users — level-specific filtering is not applicable
   * in the XP-based model, so this returns the same global ranking.
   *
   * @param _levelId - Level UUID (unused, kept for API compatibility)
   * @param limit - Number of entries to return (max 100)
   */
  async getByLevel(_levelId: string, limit = MAX_ENTRIES): Promise<LeaderboardEntry[]> {
    return this.getGlobal(limit);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toEntry(row: UserEntity, rank: number): LeaderboardEntry {
    return {
      rank,
      userId: row.id,
      username: row.username,
      avatarUrl: row.avatarUrl,
      score: row.totalXp,
      timeMs: 0,
      moves: 0,
    };
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}
