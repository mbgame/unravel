import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 003 — creates the scores table.
 */
export class CreateScores1700000003000 implements MigrationInterface {
  name = 'CreateScores1700000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "scores" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID        NOT NULL,
        "level_id"    UUID        NOT NULL,
        "score"       INTEGER     NOT NULL,
        "time_ms"     INTEGER     NOT NULL,
        "moves"       INTEGER     NOT NULL,
        "hints_used"  INTEGER     NOT NULL DEFAULT 0,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_scores_user_level" UNIQUE ("user_id", "level_id"),
        CONSTRAINT "FK_scores_user"  FOREIGN KEY ("user_id")  REFERENCES "users"  ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_scores_level" FOREIGN KEY ("level_id") REFERENCES "levels" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scores_user_id"  ON "scores" ("user_id");
      CREATE INDEX "IDX_scores_level_id" ON "scores" ("level_id");
      CREATE INDEX "IDX_scores_score"    ON "scores" ("score" DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "scores"`);
  }
}
