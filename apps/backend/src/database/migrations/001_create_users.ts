import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 001 — creates the users table.
 */
export class CreateUsers1700000001000 implements MigrationInterface {
  name = 'CreateUsers1700000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
        "username"           VARCHAR(32)  NOT NULL,
        "email"              VARCHAR(254) NOT NULL,
        "password_hash"      TEXT         NOT NULL,
        "avatar_url"         VARCHAR(500),
        "total_score"        INTEGER      NOT NULL DEFAULT 0,
        "levels_completed"   INTEGER      NOT NULL DEFAULT 0,
        "refresh_token_hash" TEXT,
        "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
