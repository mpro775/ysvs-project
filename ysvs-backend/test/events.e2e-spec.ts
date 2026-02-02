import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Create admin user and get token
    // Note: In production, you would seed an admin user
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/events (GET)', () => {
    it('should return published events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/events/upcoming (GET)', () => {
    it('should return upcoming event for countdown', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/events/upcoming')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
