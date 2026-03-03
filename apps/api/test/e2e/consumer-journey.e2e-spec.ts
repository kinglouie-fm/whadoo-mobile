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

describe('Consumer Journey (E2E)', () => {
  let app: INestApplication;
  let consumerToken: string;
  let consumerId: string;
  let activityId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useClass(MockFirebaseAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Clean database
    await cleanupTestDatabase();

    // Create business and activity
    const businessOwner = await createTestUser(testPrisma, {
      role: 'business',
    });
    const business = await createTestBusiness(testPrisma, businessOwner.id);
    const activity = await createTestActivity(testPrisma, business.id, {
      status: 'published',
      config: {
        packages: [
          {
            code: 'standard',
            title: 'Standard Package',
            min_participants: 1,
            availability: {
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '09:00:00',
              endTime: '17:00:00',
              slotDurationMinutes: 60,
              capacity: 10,
              status: 'active',
            },
          },
        ],
      },
    });
    activityId = activity.id;

    // Create consumer
    const consumer = await createTestUser(testPrisma, {
      firebaseUid: 'consumer-journey-uid',
      email: 'consumer-journey@test.com',
      role: 'user',
      phoneNumber: '+352123456',
    });
    consumerId = consumer.id;
    consumerToken = 'consumer-journey-uid';
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await testPrisma.booking.deleteMany({});
    await testPrisma.slotCapacity.deleteMany({});
    await testPrisma.savedActivity.deleteMany({});
  });

  it('should complete full consumer journey: discover → book → view booking', async () => {
    // 1. Discover activities
    const discoverResponse = await request(app.getHttpServer())
      .get('/activities/published')
      .expect(200);

    expect(discoverResponse.body).toHaveLength(1);
    expect(discoverResponse.body[0].id).toBe(activityId);

    // 2. Get activity details (consumer view)
    const activityResponse = await request(app.getHttpServer())
      .get(`/activities/consumer/${activityId}`)
      .expect(200);

    expect(activityResponse.body.id).toBe(activityId);
    expect(activityResponse.body.status).toBe('published');

    // 3. Get availability
    const availabilityResponse = await request(app.getHttpServer())
      .get('/availability')
      .set('Authorization', `Bearer ${consumerToken}`)
      .query({ activityId, date: '2026-03-16' }) // Monday
      .expect(200);

    expect(availabilityResponse.body.slots).toBeDefined();
    expect(availabilityResponse.body.slots.length).toBeGreaterThan(0);

    const firstSlot = availabilityResponse.body.slots[0];

    // 4. Create booking
    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        activityId,
        slotStart: firstSlot.slotStart,
        participantsCount: 2,
        selectionData: {},
      })
      .expect(201);

    const bookingId = bookingResponse.body.id;
    expect(bookingResponse.body.status).toBe('active');

    // 5. View booking in list
    const bookingsListResponse = await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${consumerToken}`)
      .query({ kind: 'upcoming' })
      .expect(200);

    expect(bookingsListResponse.body.items).toHaveLength(1);
    expect(bookingsListResponse.body.items[0].id).toBe(bookingId);

    // 6. View booking details
    const bookingDetailResponse = await request(app.getHttpServer())
      .get(`/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .expect(200);

    expect(bookingDetailResponse.body.id).toBe(bookingId);
    expect(bookingDetailResponse.body.participantsCount).toBe(2);
  });

  it('should enforce phone number requirement for booking', async () => {
    // Create consumer without phone number
    const consumerNoPhone = await createTestUser(testPrisma, {
      firebaseUid: 'consumer-journey-no-phone',
      role: 'user',
      phoneNumber: null,
    });
    const consumerNoPhoneToken = 'consumer-journey-no-phone';

    const slotStart = new Date('2026-03-16T08:00:00.000Z');

    const response = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${consumerNoPhoneToken}`)
      .send({
        activityId,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {},
      });

    // Should return 400 or 403 for missing phone
    expect([400, 403]).toContain(response.status);
  });

  it('should allow profile completion before booking', async () => {
    // Create consumer without phone
    const consumerNoPhone = await createTestUser(testPrisma, {
      firebaseUid: 'consumer-journey-profile',
      role: 'user',
      phoneNumber: null,
    });
    const profileToken = 'consumer-journey-profile';

    // Update profile with phone number
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({
        phoneNumber: '+352999888',
      })
      .expect(200);

    // Now booking should succeed
    const slotStart = new Date('2026-03-16T08:00:00.000Z');

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({
        activityId,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: {},
      })
      .expect(201);
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId: 'invalid-id',
          slotStart: 'not-a-date',
          participantsCount: -1,
          selectionData: {},
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle missing authentication', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          activityId,
          slotStart: new Date().toISOString(),
          participantsCount: 2,
          selectionData: {},
        })
        .expect(401);
    });

    it('should handle booking non-existent activity', async () => {
      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          activityId: 'non-existent-activity',
          slotStart: slotStart.toISOString(),
          participantsCount: 2,
          selectionData: {},
        });

      // Should return 400 or 404 for non-existent activity
      expect([400, 404]).toContain(response.status);
    });
  });
});
