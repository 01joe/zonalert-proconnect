import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E du flux d'authentification.
 * Nécessite une base PostgreSQL de test configurée dans .env.test
 *
 * Usage : npm run test:e2e
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const aujourdhui = new Date().toISOString().split('T')[0];

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test-${aujourdhui}@example.com`,
  phone: '+22997999999',
  city: 'Cotonou',
  password: 'password123',
};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Register ───────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — crée un compte et retourne un access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');

      accessToken = res.body.data.access_token;
    });

    it('409 — email déjà utilisé', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('400 — email invalide', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);
    });
  });

  // ── Login ──────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('200 — connexion réussie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.data).toHaveProperty('access_token');
      accessToken = res.body.data.access_token;
    });

    it('401 — mauvais mot de passe', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrong' })
        .expect(401);
    });
  });

  // ── GET /auth/me ───────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('200 — retourne le profil connecté', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(testUser.email);
    });

    it('401 — sans token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });
});
