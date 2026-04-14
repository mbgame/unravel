import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 002 — creates the levels table.
 */
export class CreateLevels1700000002000 implements MigrationInterface {
  name = 'CreateLevels1700000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "levels" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"        VARCHAR(100) NOT NULL,
        "difficulty"  SMALLINT    NOT NULL,
        "knot_data"   JSONB       NOT NULL,
        "par_time_ms" INTEGER     NOT NULL,
        "par_moves"   INTEGER     NOT NULL,
        "order_index" INTEGER     NOT NULL,
        "is_daily"    BOOLEAN     NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_levels" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_difficulty" CHECK (difficulty BETWEEN 1 AND 10)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_levels_difficulty" ON "levels" ("difficulty");
      CREATE INDEX "IDX_levels_order_index" ON "levels" ("order_index");
      CREATE INDEX "IDX_levels_is_daily" ON "levels" ("is_daily");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "levels"`);
  }
}
