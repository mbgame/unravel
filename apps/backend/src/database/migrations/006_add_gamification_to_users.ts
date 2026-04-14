import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 006 — adds gamification columns (coins, total_xp, player_level) to users table.
 */
export class AddGamificationToUsers1700000006000 implements MigrationInterface {
  name = 'AddGamificationToUsers1700000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "coins"        INT NOT NULL DEFAULT 0,
        ADD COLUMN "total_xp"     INT NOT NULL DEFAULT 0,
        ADD COLUMN "player_level" INT NOT NULL DEFAULT 1
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "coins",
        DROP COLUMN "total_xp",
        DROP COLUMN "player_level"
    `);
  }
}
