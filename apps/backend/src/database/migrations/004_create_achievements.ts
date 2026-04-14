import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 004 — creates achievements and user_achievements tables.
 */
export class CreateAchievements1700000004000 implements MigrationInterface {
  name = 'CreateAchievements1700000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "achievements" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "key"         VARCHAR(64)  NOT NULL,
        "name"        VARCHAR(100) NOT NULL,
        "description" VARCHAR(300) NOT NULL,
        "icon_url"    VARCHAR(500) NOT NULL,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_achievements_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_achievements" (
        "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"        UUID        NOT NULL,
        "achievement_id" UUID        NOT NULL,
        "unlocked_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_achievement" UNIQUE ("user_id", "achievement_id"),
        CONSTRAINT "FK_ua_user"        FOREIGN KEY ("user_id")        REFERENCES "users"        ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ua_achievement" FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_achievements"`);
    await queryRunner.query(`DROP TABLE "achievements"`);
  }
}
