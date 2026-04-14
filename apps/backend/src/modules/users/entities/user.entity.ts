import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

/**
 * User entity — represents a registered player.
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 32 })
  username!: string;

  @Column({ unique: true, length: 254 })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'avatar_url', nullable: true, length: 500 })
  avatarUrl?: string;

  @Column({ name: 'total_score', default: 0 })
  totalScore!: number;

  @Column({ name: 'levels_completed', default: 0 })
  levelsCompleted!: number;

  @Column({ name: 'coins', default: 0 })
  coins!: number;

  @Column({ name: 'total_xp', default: 0 })
  totalXp!: number;

  @Column({ name: 'player_level', default: 1 })
  playerLevel!: number;

  @Column({ name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
