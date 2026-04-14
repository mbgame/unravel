import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * CosmeticEntity — a purchasable visual customisation.
 * Type is one of: 'yarn_color' | 'background' | 'celebration'.
 */
@Entity('cosmetics')
export class CosmeticEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Cosmetic category. */
  @Column({ length: 32 })
  type!: string;

  /** Unique slug used as identifier in frontend (e.g. 'pastel', 'galaxy'). */
  @Column({ unique: true, length: 64 })
  key!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 300 })
  description!: string;

  @Column({ name: 'icon_url', nullable: true, length: 500 })
  iconUrl?: string;

  /** Cost in coins to purchase. 0 = free. */
  @Column({ name: 'cost_coins', default: 0 })
  costCoins!: number;

  /** Player level required to purchase. */
  @Column({ name: 'required_player_level', default: 1 })
  requiredPlayerLevel!: number;

  /** Default items are pre-owned by everyone and cannot be purchased. */
  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
