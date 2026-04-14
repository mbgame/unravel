import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 007 — creates cosmetics + user_cosmetics tables and seeds initial items.
 */
export class CreateCosmetics1700000007000 implements MigrationInterface {
  name = 'CreateCosmetics1700000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cosmetics" (
        "id"                    UUID         NOT NULL DEFAULT gen_random_uuid(),
        "type"                  VARCHAR(32)  NOT NULL,
        "key"                   VARCHAR(64)  NOT NULL,
        "name"                  VARCHAR(100) NOT NULL,
        "description"           VARCHAR(300) NOT NULL,
        "icon_url"              VARCHAR(500),
        "cost_coins"            INT          NOT NULL DEFAULT 0,
        "required_player_level" INT          NOT NULL DEFAULT 1,
        "is_default"            BOOLEAN      NOT NULL DEFAULT false,
        "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cosmetics"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cosmetic_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_cosmetics" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       UUID        NOT NULL,
        "cosmetic_key"  VARCHAR(64) NOT NULL,
        "equipped_type" VARCHAR(32),
        "purchased_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_cosmetics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_cosmetic"  UNIQUE ("user_id", "cosmetic_key"),
        CONSTRAINT "FK_uc_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_cosmetics_user" ON "user_cosmetics" ("user_id")
    `);

    await queryRunner.query(`
      INSERT INTO "cosmetics" ("type", "key", "name", "description", "cost_coins", "required_player_level", "is_default") VALUES
        ('yarn_color',  'default',   'Rainbow',       'Classic colourful yarn balls',      0,   1, true),
        ('yarn_color',  'pastel',    'Pastel Dreams', 'Soft, dreamy pastel colours',     150,   3, false),
        ('yarn_color',  'neon',      'Neon Rave',     'Bold fluorescent colours',         300,   6, false),
        ('yarn_color',  'earth',     'Earth Tones',   'Warm natural colours',             200,   4, false),
        ('background',  'sky',       'Clear Sky',     'Soft blue sky gradient',             0,   1, true),
        ('background',  'galaxy',    'Galaxy',        'Deep space starfield',             200,   5, false),
        ('background',  'forest',    'Forest Glow',   'Lush green canopy light',          200,   7, false),
        ('celebration', 'confetti',  'Confetti Pop',  'Classic colourful confetti',         0,   1, true),
        ('celebration', 'stars',     'Star Burst',    'Golden star shower',               100,   2, false),
        ('celebration', 'fireworks', 'Fireworks',     'Dazzling fireworks display',       250,   8, false)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_cosmetics_user"`);
    await queryRunner.query(`DROP TABLE "user_cosmetics"`);
    await queryRunner.query(`DROP TABLE "cosmetics"`);
  }
}
