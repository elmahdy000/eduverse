import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

function readAllowedOrigins() {
  const raw = process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://localhost:3002';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET || '';
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  if (
    nodeEnv === 'production' &&
    (jwtSecret === 'your_jwt_secret_change_in_production' || jwtSecret.length < 24)
  ) {
    throw new Error(
      'Unsafe JWT_SECRET for production. Use a strong secret with at least 24 characters.',
    );
  }
}

async function bootstrap() {
  validateEnvironment();
  
  // Skip Prisma migration check for existing database
  process.env.SKIP_MIGRATION = 'true';
  
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const allowedOrigins = readAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Eduverse API')
    .setDescription('Venue Operations Platform - Phase 1')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
