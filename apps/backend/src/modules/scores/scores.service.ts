/**
 * ScoresService — server-side score calculation and upsert logic.
 * The score formula mirrors the frontend constants so both sides agree.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreEntity } from './entities/score.entity';
import { LevelEntity } from '../levels/entities/level.entity';
import { SubmitScoreDto } from './dto/submit-score.dto';

/** Base score awarded for any completion. */
const BASE_SCORE = 1000;
/** Penalty per second elapsed. */
const TIME_PENALTY_PER_SECOND = 2;
/** Penalty per move. */
const MOVE_PENALTY_PER_MOVE = 5;
/** Penalty per hint used. */
const HINT_PENALTY_PER_HINT = 100;

/** Shape of the score submission response. */
export interface ScoreResult {
  score: number;
  isNewBest: boolean;
  scoreRecord: ScoreEntity;
}

/**
 * Calculates the final score from raw game stats.
 *
 * @param timeMs - Elapsed time in milliseconds
 * @param moves - Number of moves made
 * @param hintsUsed - Number of hints consumed
 */
function calculateScore(timeMs: number, moves: number, hintsUsed: number): number {
  const timePenalty = Math.floor(timeMs / 1000) * TIME_PENALTY_PER_SECOND;
  const movePenalty = moves * MOVE_PENALTY_PER_MOVE;
  const hintPenalty = hintsUsed * HINT_PENALTY_PER_HINT;
  return Math.max(0, BASE_SCORE - timePenalty - movePenalty - hintPenalty);
}

/**
 * Service for submitting and retrieving player scores.
 */
@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(ScoreEntity)
    private readonly scoresRepo: Repository<ScoreEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelsRepo: Repository<LevelEntity>,
  ) {}

  /**
   * Calculates the score server-side and upserts the record only if the
   * new score exceeds the existing best.
   *
   * @param userId - Authenticated user UUID
   * @param dto - Score submission payload
   * @throws NotFoundException when the level does not exist
   */
  async submit(userId: string, dto: SubmitScoreDto): Promise<ScoreResult> {
    const level = await this.levelsRepo.findOne({ where: { id: dto.levelId } });
    if (!level) throw new NotFoundException(`Level ${dto.levelId} not found`);

    const score = calculateScore(dto.timeMs, dto.moves, dto.hintsUsed);
    const existing = await this.scoresRepo.findOne({
      where: { userId, levelId: dto.levelId },
    });

    const isNewBest = !existing || score > existing.score;

    let scoreRecord: ScoreEntity;

    if (!existing) {
      scoreRecord = await this.scoresRepo.save(
        this.scoresRepo.create({
          userId,
          levelId: dto.levelId,
          score,
          timeMs: dto.timeMs,
          moves: dto.moves,
          hintsUsed: dto.hintsUsed,
        }),
      );
    } else if (isNewBest) {
      await this.scoresRepo.update(existing.id, {
        score,
        timeMs: dto.timeMs,
        moves: dto.moves,
        hintsUsed: dto.hintsUsed,
      });
      scoreRecord = { ...existing, score, timeMs: dto.timeMs, moves: dto.moves, hintsUsed: dto.hintsUsed };
    } else {
      scoreRecord = existing;
    }

    return { score, isNewBest, scoreRecord };
  }

  /**
   * Returns all best scores for the authenticated user.
   *
   * @param userId - Authenticated user UUID
   */
  async findMyScores(userId: string): Promise<ScoreEntity[]> {
    return this.scoresRepo.find({
      where: { userId },
      relations: ['level'],
      order: { createdAt: 'DESC' },
    });
  }
}
