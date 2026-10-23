import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { registerBaseRoutes } from './main';

@Module({})
class TestAppModule {}

describe('Base routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    registerBaseRoutes(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns 200 with backend metadata', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'ZonAlert Backend',
    });
  });

  it('GET /health returns 200 and env info', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
    });
  });

  it('GET /favicon.ico returns 204', async () => {
    await request(app.getHttpServer()).get('/favicon.ico').expect(204);
  });
});
