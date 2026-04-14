/**
 * DailyChallengeService — manages daily challenge creation and retrieval.
 * A cron job runs at 00:00 UTC to pick the next day's challenge.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyChallengeEntity } from './entities/daily-challenge.entity';
import { LevelEntity } from '../levels/entities/level.entity';
import { ScoreEntity } from '../scores/entities/score.entity';
import type { LeaderboardEntry } from '../leaderboard/leaderboard.service';

/** Maximum leaderboard entries for daily challenge. */
const DAILY_LB_LIMIT = 50;

/** Response shape for today's daily challenge. */
export interface DailyChallengeResponse {
  date: string;
  level: LevelEntity;
}

/**
 * Service that manages daily challenge scheduling and data.
 */
@Injectable()
export class DailyChallengeService {
  private readonly logger = new Logger(DailyChallengeService.name);

  constructor(
    @InjectRepository(DailyChallengeEntity)
    private readonly challengesRepo: Repository<DailyChallengeEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelsRepo: Repository<LevelEntity>,
    @InjectRepository(ScoreEntity)
    private readonly scoresRepo: Repository<ScoreEntity>,
  ) {}

  /**
   * Returns today's daily challenge with the associated level.
   *
   * @throws NotFoundException when no challenge exists for today
   */
  async findToday(): Promise<DailyChallengeResponse> {
    const today = new Date().toISOString().slice(0, 10);
    const challenge = await this.challengesRepo.findOne({
      where: { date: today },
      relations: ['level'],
    });

    if (!challenge) {
      throw new NotFoundException('No daily challenge has been set for today');
    }

    return { date: challenge.date, level: challenge.level };
  }

  /**
   * Returns the leaderboard for today's daily challenge level.
   */
  async getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
    const today = new Date().toISOString().slice(0, 10);
    const challenge = await this.challengesRepo.findOne({ where: { date: today } });

    if (!challenge) return [];

    const rows = await this.scoresRepo
      .createQueryBuilder('score')
      .innerJoinAndSelect('score.user', 'user')
      .where('score.levelId = :levelId', { levelId: challenge.levelId })
      .orderBy('score.score', 'DESC')
      .take(DAILY_LB_LIMIT)
      .getMany();

    return rows.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      username: row.user?.username ?? 'Unknown',
      avatarUrl: row.user?.avatarUrl,
      score: row.score,
      timeMs: row.timeMs,
      moves: row.moves,
    }));
  }

  /**
   * Cron job: runs at midnight UTC every day.
   * Picks a random non-daily level and records it as the daily challenge.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailyChallenge(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const date = tomorrow.toISOString().slice(0, 10);

    // Check if already created (idempotent)
    const existing = await this.challengesRepo.findOne({ where: { date } });
    if (existing) {
      this.logger.log(`Daily challenge for ${date} already exists, skipping`);
      return;
    }

    // Pick a random level
    const level = await this.levelsRepo
      .createQueryBuilder('level')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();

    if (!level) {
      this.logger.error('No levels available to create daily challenge');
      return;
    }

    await this.challengesRepo.save(
      this.challengesRepo.create({ date, levelId: level.id }),
    );

    this.logger.log(`Daily challenge for ${date} created: level "${level.name}"`);
  }
}
