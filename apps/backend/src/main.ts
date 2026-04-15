import { NestFactory, NestApplication } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/** Default port if APP_PORT env var is not set. */
const DEFAULT_PORT = 3001;

/**
 * Runs pending database migrations via the TypeORM DataSource.
 * Called before the HTTP server starts to ensure the schema is up-to-date.
 */
async function runMigrations(app: NestApplication): Promise<void> {
  const logger = new Logger('Bootstrap');
  try {
    const { DataSource } = await import('typeorm');
    const dataSource = app.get(DataSource);
    const pending = await dataSource.showMigrations();
    if (pending) {
      logger.log('Running pending database migrations…');
      await dataSource.runMigrations({ transaction: 'all' });
      logger.log('Migrations completed successfully');
    } else {
      logger.log('No pending migrations');
    }
  } catch (err) {
    const logger2 = new Logger('Migrations');
    logger2.warn(`Migration check failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Bootstrap the NestJS application.
 * Configures global middleware, pipes, filters, and interceptors.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Run migrations before accepting traffic
  await runMigrations(app);

  /** Security headers */
  app.use(helmet());

  /** CORS — allow only whitelisted origins */
  const allowedOrigins = configService.get<string>('app.allowedOrigins', 'http://localhost:3000');
  app.enableCors({
    origin: allowedOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  /** Health check — registered before the global prefix so Railway can reach it */
  const express = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  express.get('/api/v1/health', (_req: any, res: any) => res.json({ status: 'ok' }));

  /** API prefix */
  app.setGlobalPrefix('api/v1');

  /** Global validation pipe — strip unknown properties and transform types */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /** Global response transform — wraps all responses in ApiResponse shape */
  app.useGlobalInterceptors(new TransformInterceptor());

  /** Global exception filter — returns ApiError shape */
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = configService.get<number>('app.port', DEFAULT_PORT);
  await app.listen(port);

  logger.log(`Backend running on http://localhost:${port}/api/v1`);
}

bootstrap();
