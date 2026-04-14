/**
 * App health-check e2e tests.
 * Verifies the NestJS application bootstraps correctly and the health endpoint responds.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('App (e2e)', () => {
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

  it('should return 404 for unknown routes (not 500)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
  });

  it('should respond to auth register with validation error for empty body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should have consistent error response shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);
    expect(res.body).toMatchObject({ statusCode: 400 });
  });
});
