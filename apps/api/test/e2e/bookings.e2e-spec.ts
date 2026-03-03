import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirebaseAuthGuard } from '../../src/auth/firebase-auth.guard';
import { createTestActivity } from '../fixtures/activities';
import { createTestBusiness, createTestUser } from '../fixtures/users';
import { MockFirebaseAuthGuard } from '../mocks/mock-firebase-auth.guard';
import {
  cleanupTestDatabase,
  disconnectTestDatabase,
  setupTestDatabase,
  testPrisma,
} from '../test-setup';

describe('Bookings API (E2E)', () => {
  let app: INestApplication;
  let consumerToken: string;
  let businessToken: string;
  let consumerId: string;
  let businessId: string;
  let activityId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    await cleanupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useClass(MockFirebaseAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Create test users
    const consumer = await createTestUser(testPrisma, {
      firebaseUid: 'test-consumer-uid',
      email: 'consumer@test.com',
      role: 'user',
      phoneNumber: '+352123456',
    });
    consumerId = consumer.id;

    const businessOwner = await createTestUser(testPrisma, {
      firebaseUid: 'test-business-uid',
      email: 'business@test.com',
      role: 'business',
    });

    const business = await createTestBusiness(testPrisma, businessOwner.id);
    businessId = business.id;

    const activity = await createTestActivity(testPrisma, business.id, {
      status: 'published',
    });
    activityId = activity.id;

    // Use Firebase UIDs directly as tokens (MockFirebaseAuthGuard extracts UID)
    consumerToken = 'test-consumer-uid';
    businessToken = 'test-business-uid';
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clean bookings before each test
    await testPrisma.booking.deleteMany({});
    await testPrisma.slotCapacity.deleteMany({});
  });

  describe('POST /bookings', () => {
    it('should create booking with valid data', () => {
      const slotStart = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      return request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart,
          participantsCount: 2,
          selectionData: {},
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe(consumerId);
          expect(res.body.activityId).toBe(activityId);
          expect(res.body.participantsCount).toBe(2);
          expect(res.body.status).toBe('active');
        });
    });

    it('should reject booking without authentication', () => {
      const slotStart = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      return request(app.getHttpServer())
        .post('/bookings')
        .send({
          activityId,
          slotStart,
          participantsCount: 1,
          selectionData: {},
        })
        .expect(401);
    });

    it('should reject booking with invalid data', () => {
      return request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          // Missing required fields
          activityId,
        })
        .expect(400);
    });

    it('should reject booking when capacity exceeded', async () => {
      const slotStart = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      // First booking takes 4 spots
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart,
          participantsCount: 4,
          selectionData: {},
        })
        .expect(201);

      // Second booking tries to take 3 spots (should fail, only 1 left)
      return request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart,
          participantsCount: 3,
          selectionData: {},
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('SLOT_FULL');
        });
    });
  });

  describe('GET /bookings', () => {
    it('should list user bookings', async () => {
      const slotStart = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      // Create a booking first
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart,
          participantsCount: 1,
          selectionData: {},
        });

      return request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(res.body.items.length).toBeGreaterThan(0);
        });
    });

    it('should filter upcoming bookings', async () => {
      const futureSlot = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const pastSlot = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Create future booking
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart: futureSlot,
          participantsCount: 1,
          selectionData: {},
        });

      return request(app.getHttpServer())
        .get('/bookings?kind=upcoming')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBe(1);
        });
    });
  });

  describe('POST /bookings/:id/cancel', () => {
    it('should cancel own booking', async () => {
      const slotStart = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      // Create booking
      const createRes = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId,
          slotStart,
          participantsCount: 1,
          selectionData: {},
        });

      const bookingId = createRes.body.id;

      // Cancel booking
      return request(app.getHttpServer())
        .post(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('cancelled');
        });
    });
  });
});
