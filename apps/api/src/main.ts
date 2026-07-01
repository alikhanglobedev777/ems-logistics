import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0');

  console.log('EMS API running on http://localhost:4000/api');
}

bootstrap();