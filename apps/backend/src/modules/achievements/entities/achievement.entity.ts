import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Achievement entity — defines an unlockable achievement.
 */
@Entity('achievements')
export class AchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 64 })
  key!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 300 })
  description!: string;

  /** URL path to the achievement icon. */
  @Column({ name: 'icon_url', length: 500 })
  iconUrl!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
