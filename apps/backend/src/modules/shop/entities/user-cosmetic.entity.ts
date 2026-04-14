import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

/**
 * UserCosmeticEntity — tracks which cosmetics a user owns and which is equipped.
 * When equippedType is set it means this cosmetic is the currently active one
 * for its type (yarn_color / background / celebration).
 */
@Entity('user_cosmetics')
export class UserCosmeticEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  /** Key of the owned cosmetic (references cosmetics.key). */
  @Column({ name: 'cosmetic_key', length: 64 })
  cosmeticKey!: string;

  /**
   * Non-null when this cosmetic is currently equipped.
   * Stores the cosmetic type so we can easily find the equipped item per type.
   */
  @Column({ name: 'equipped_type', length: 32, nullable: true })
  equippedType?: string;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt!: Date;
}
