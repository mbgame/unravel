/**
 * Levels module e2e tests.
 * Covers fetching level lists and individual levels.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Levels (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/levels', () => {
    it('should return a paginated list of levels', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/levels')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('levels');
      expect(Array.isArray(res.body.data.levels)).toBe(true);
    });

    it('should respect the page and limit query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/levels?page=1&limit=5')
        .expect(200);

      expect(res.body.data.levels.length).toBeLessThanOrEqual(5);
    });

    it('should filter by difficulty when param is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/levels?difficulty=1')
        .expect(200);

      const levels: { difficulty: number }[] = res.body.data.levels;
      for (const level of levels) {
        expect(level.difficulty).toBe(1);
      }
    });

    it('should return 400 for out-of-range difficulty', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/levels?difficulty=0')
        .expect(400);
    });
  });

  describe('GET /api/v1/levels/:id', () => {
    it('should return 400 for a non-UUID id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/levels/not-a-uuid')
        .expect(400);
    });

    it('should return 404 for a non-existent level UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/levels/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/v1/levels/daily/today', () => {
    it('should return 200 or 404 (depends on seed data)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/levels/daily/today');
      expect([200, 404]).toContain(res.status);
    });
  });
});
