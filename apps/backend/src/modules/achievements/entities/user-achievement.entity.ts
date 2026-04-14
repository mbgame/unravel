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
import { AchievementEntity } from './achievement.entity';

/**
 * UserAchievement entity — join table recording which user unlocked which achievement.
 */
@Entity('user_achievements')
@Unique(['userId', 'achievementId'])
export class UserAchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'achievement_id' })
  achievementId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => AchievementEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement!: AchievementEntity;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt!: Date;
}
