import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { LevelEntity } from '../../levels/entities/level.entity';

/**
 * Score entity — records the best score per user per level.
 * The unique constraint enforces one record per (user, level) pair;
 * upsert logic replaces it when a better score is achieved.
 */
@Entity('scores')
@Unique(['userId', 'levelId'])
export class ScoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'level_id' })
  levelId!: string;

  @Column()
  score!: number;

  /** Time taken to complete the level in milliseconds. */
  @Column({ name: 'time_ms' })
  timeMs!: number;

  @Column()
  moves!: number;

  @Column({ name: 'hints_used', default: 0 })
  hintsUsed!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => LevelEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level!: LevelEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
