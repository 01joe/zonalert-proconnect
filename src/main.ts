import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  // Railway injecte PORT automatiquement — priorité absolue
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  // ── Health check (/health) ─────────────────────────────────────────────────
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', env: nodeEnv, timestamp: new Date().toISOString() });
  });

  // ── Helmet ─────────────────────────────────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Permissif : toutes les origines sans origin (Capacitor, Postman, mobile)
  // + origines Capacitor explicites
  app.enableCors({
    origin: true,          // ← autorise TOUTES les origines (simplification fiable)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,  // ← false : ne pas rejeter les champs inconnus
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Sérialisation (@Exclude sur password/refreshToken) ──────────────────────
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ── WebSocket ──────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Swagger (développement uniquement) ─────────────────────────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ZonAlert & ProConnect API')
      .setDescription('Signalement pannes · ProConnect artisans · Bénin')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('Auth', 'Inscription, connexion, tokens')
      .addTag('Users', 'Gestion des profils')
      .addTag('Incidents', 'Signalement et suivi des pannes')
      .addTag('Confirmations', 'Validation communautaire')
      .addTag('Comments', 'Commentaires sur les incidents')
      .addTag('Reports', 'Signalements inappropriés')
      .addTag('Professionals', 'Annuaire artisans ProConnect')
      .addTag('Service Requests', "Demandes d'intervention")
      .addTag('Notifications', 'Alertes temps-réel')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📚 Swagger → http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 ZonAlert Backend démarré — port ${port} [${nodeEnv}]`);
}

bootstrap();
