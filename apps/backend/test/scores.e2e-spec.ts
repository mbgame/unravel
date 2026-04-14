/**
 * Scores & Leaderboard e2e tests.
 * Covers score submission, my-scores retrieval, and leaderboard endpoints.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/** Unique credentials for this test run. */
const TEST_EMAIL = `score-e2e-${Date.now()}@example.com`;
const TEST_USERNAME = `scoreuser${Date.now()}`.slice(0, 20);
const TEST_PASSWORD = 'Password1!';

describe('Scores & Leaderboard (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let testLevelId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    dataSource = app.get<DataSource>(getDataSourceToken());

    // Register + login to get a token
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: TEST_PASSWORD });

    accessToken = regRes.body.data?.accessToken as string;

    // Get first available level for testing
    const levelsRes = await request(app.getHttpServer())
      .get('/api/v1/levels?limit=1')
      .expect(200);

    const levels: { id: string }[] = levelsRes.body.data?.levels ?? [];
    testLevelId = levels[0]?.id ?? '';
  });

  afterAll(async () => {
    try {
      await dataSource.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);
    } catch {
      // Non-critical cleanup
    }
    await app.close();
  });

  describe('POST /api/v1/scores', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/scores')
        .send({ levelId: testLevelId, timeMs: 30000, moves: 10, hintsUsed: 0 })
        .expect(401);
    });

    it('should submit a score and return calculated result', async () => {
      if (!testLevelId) {
        // Skip if no levels in DB
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ levelId: testLevelId, timeMs: 30000, moves: 10, hintsUsed: 0 })
        .expect(201);

      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data.score).toBeGreaterThanOrEqual(0);
      expect(res.body.data).toHaveProperty('rank');
    });

    it('should return 400 for invalid levelId format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ levelId: 'not-a-uuid', timeMs: 30000, moves: 10, hintsUsed: 0 })
        .expect(400);
    });

    it('should return 400 for negative timeMs', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ levelId: testLevelId || '00000000-0000-0000-0000-000000000000', timeMs: -1, moves: 10, hintsUsed: 0 })
        .expect(400);
    });
  });

  describe('GET /api/v1/scores/me', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/api/v1/scores/me').expect(401);
    });

    it('should return authenticated user scores', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/scores/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/leaderboard/global', () => {
    it('should return leaderboard without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leaderboard/global')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('should respect limit query param', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leaderboard/global?limit=10')
        .expect(200);

      const entries: unknown[] = res.body.data?.entries ?? res.body.data ?? [];
      expect(entries.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/leaderboard/level/:id', () => {
    it('should return 400 for non-UUID level id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/leaderboard/level/not-a-uuid')
        .expect(400);
    });

    it('should return leaderboard for a valid UUID (even if empty)', async () => {
      if (!testLevelId) return;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/leaderboard/level/${testLevelId}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });
});
