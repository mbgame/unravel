import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 005 — creates the daily_challenges table.
 */
export class CreateDailyChallenges1700000005000 implements MigrationInterface {
  name = 'CreateDailyChallenges1700000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "daily_challenges" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "date"       DATE        NOT NULL,
        "level_id"   UUID        NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_challenges" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_challenges_date" UNIQUE ("date"),
        CONSTRAINT "FK_dc_level" FOREIGN KEY ("level_id") REFERENCES "levels" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_daily_challenges_date" ON "daily_challenges" ("date" DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "daily_challenges"`);
  }
}
