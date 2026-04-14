/**
 * LevelsService — data-access and caching for level records.
 * Uses a simple in-memory Map cache with a 5-minute TTL.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LevelEntity } from './entities/level.entity';

/** Cache entry wrapper. */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** In-memory cache TTL in milliseconds (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Default pagination limit. */
const DEFAULT_LIMIT = 20;
/** Maximum allowed page size. */
const MAX_LIMIT = 100;

/** Query parameters for the paginated level list. */
export interface LevelsQuery {
  page?: number;
  limit?: number;
  difficulty?: number;
}

/** Paginated response shape. */
export interface PaginatedLevels {
  data: LevelEntity[];
  meta: { page: number; limit: number; total: number };
}

/**
 * Service for querying and caching game levels.
 */
@Injectable()
export class LevelsService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    @InjectRepository(LevelEntity)
    private readonly repo: Repository<LevelEntity>,
  ) {}

  /**
   * Returns a paginated, optionally difficulty-filtered list of levels.
   *
   * @param query - Pagination and filter parameters
   */
  async findAll(query: LevelsQuery): Promise<PaginatedLevels> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const key = `list:${page}:${limit}:${query.difficulty ?? 'all'}`;

    const cached = this.getCache<PaginatedLevels>(key);
    if (cached) return cached;

    const qb = this.repo
      .createQueryBuilder('level')
      .orderBy('level.orderIndex', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.difficulty !== undefined) {
      qb.where('level.difficulty = :difficulty', { difficulty: query.difficulty });
    }

    const [data, total] = await qb.getManyAndCount();
    const result: PaginatedLevels = { data, meta: { page, limit, total } };
    this.setCache(key, result);
    return result;
  }

  /**
   * Returns a single level by UUID.
   *
   * @param id - Level UUID
   * @throws NotFoundException when the level does not exist
   */
  async findById(id: string): Promise<LevelEntity> {
    const key = `level:${id}`;
    const cached = this.getCache<LevelEntity>(key);
    if (cached) return cached;

    const level = await this.repo.findOne({ where: { id } });
    if (!level) throw new NotFoundException(`Level ${id} not found`);

    this.setCache(key, level);
    return level;
  }

  /**
   * Returns today's daily challenge level.
   *
   * @throws NotFoundException when no daily challenge exists for today
   */
  async findDailyToday(): Promise<LevelEntity> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `daily:${today}`;
    const cached = this.getCache<LevelEntity>(key);
    if (cached) return cached;

    const level = await this.repo
      .createQueryBuilder('level')
      .innerJoin('daily_challenges', 'dc', 'dc.level_id = level.id')
      .where('dc.date = :today', { today })
      .getOne();

    if (!level) throw new NotFoundException('No daily challenge found for today');

    this.setCache(key, level);
    return level;
  }

  // ── Cache helpers ─────────────────────────────────────────────────────────

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
