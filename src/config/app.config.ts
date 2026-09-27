import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  name: process.env.APP_NAME || 'ZonAlert Backend',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8100').split(','),
}));

export const databaseConfig = registerAs('database', () => ({
  host:        process.env.DB_HOST     || 'localhost',
  port:        parseInt(process.env.DB_PORT, 10) || 5432,
  username:    process.env.DB_USERNAME || 'postgres',
  password:    process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '',
  name:        process.env.DB_NAME     || 'zonalert_db',
  synchronize: process.env.DB_SYNC    === 'true',
  logging:     process.env.DB_LOGGING === 'true',
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret:       process.env.JWT_ACCESS_SECRET  || 'access-secret-change-me',
  refreshSecret:      process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me',
  accessExpiration:   process.env.JWT_ACCESS_EXPIRATION  || '15m',
  refreshExpiration:  process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl:   parseInt(process.env.THROTTLE_TTL,   10) || 60,
  limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
}));

export const firebaseConfig = registerAs('firebase', () => ({
  projectId:   process.env.FIREBASE_PROJECT_ID   || '',
  privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
}));
