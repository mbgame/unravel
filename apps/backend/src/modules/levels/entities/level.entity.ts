import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { KnotGraph } from '@unravel/shared-types';

/**
 * Level entity — stores knot puzzle data and scoring parameters.
 */
@Entity('levels')
export class LevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  /** Difficulty from 1 (easiest) to 10 (hardest). */
  @Column({ type: 'smallint' })
  difficulty!: number;

  /** Full knot graph stored as JSONB. */
  @Column({ name: 'knot_data', type: 'jsonb' })
  knotData!: KnotGraph;

  /** Time (ms) to earn 3 stars. */
  @Column({ name: 'par_time_ms' })
  parTimeMs!: number;

  /** Moves to earn 3 stars. */
  @Column({ name: 'par_moves' })
  parMoves!: number;

  /** Display ordering in level select. */
  @Column({ name: 'order_index' })
  orderIndex!: number;

  @Column({ name: 'is_daily', default: false })
  isDaily!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
