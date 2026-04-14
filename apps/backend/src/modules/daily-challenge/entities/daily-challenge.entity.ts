import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { LevelEntity } from '../../levels/entities/level.entity';

/**
 * DailyChallenge entity — maps a calendar date to a specific level.
 * The cron job creates one record per day at 00:00 UTC.
 */
@Entity('daily_challenges')
@Unique(['date'])
export class DailyChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** ISO date string (YYYY-MM-DD) for the challenge day. */
  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'level_id' })
  levelId!: string;

  @ManyToOne(() => LevelEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'level_id' })
  level!: LevelEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
