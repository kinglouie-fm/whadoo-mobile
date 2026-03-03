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

describe('Business Journey (E2E)', () => {
  let app: INestApplication;
  let businessToken: string;
  let businessOwnerId: string;
  let businessId: string;
  let consumerToken: string;

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

    // Create business owner
    const businessOwner = await createTestUser(testPrisma, {
      firebaseUid: 'business-owner-uid',
      email: 'business@test.com',
      role: 'business',
    });
    businessOwnerId = businessOwner.id;
    businessToken = 'business-owner-uid';

    const business = await createTestBusiness(testPrisma, businessOwnerId);
    businessId = business.id;

    // Create consumer for booking tests
    const consumer = await createTestUser(testPrisma, {
      firebaseUid: 'consumer-uid',
      role: 'user',
      phoneNumber: '+352123456',
    });
    consumerToken = 'consumer-uid';
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await testPrisma.booking.deleteMany({});
    await testPrisma.slotCapacity.deleteMany({});
    await testPrisma.activity.deleteMany({});
    await testPrisma.availabilityTemplate.deleteMany({});
  });

  it('should complete full business journey: create template → create activity → link → publish → view bookings', async () => {
    // 1. Create availability template
    const templateResponse = await request(app.getHttpServer())
      .post('/availability-templates')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        businessId,
        name: 'Weekday Template',
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 60,
        capacity: 8,
      })
      .expect(201);

    const templateId = templateResponse.body.id;
    expect(templateResponse.body.status).toBe('active');

    // 2. Create activity
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        businessId,
        title: 'Premium Karting Experience',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 75,
        description: 'High-speed indoor karting',
        config: {
          packages: [
            {
              code: 'premium',
              title: 'Premium Package',
              is_default: true,
            },
          ],
        },
        pricing: {},
      })
      .expect(201);

    const activityId = activityResponse.body.id;
    expect(activityResponse.body.status).toBe('draft');

    // 3. Link template to activity
    await request(app.getHttpServer())
      .put(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        availabilityTemplateId: templateId,
      })
      .expect(200);

    // 4. Publish activity
    const publishResponse = await request(app.getHttpServer())
      .patch(`/activities/${activityId}/publish`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(publishResponse.body.status).toBe('published');

    // 5. Consumer creates booking
    const slotStart = new Date('2026-03-16T08:00:00.000Z'); // Monday 09:00 Luxembourg

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        activityId,
        slotStart: slotStart.toISOString(),
        participantsCount: 3,
        selectionData: {},
      })
      .expect(201);

    const bookingId = bookingResponse.body.id;

    // 6. Business views bookings
    const businessBookingsResponse = await request(app.getHttpServer())
      .get(`/bookings/business/${businessId}/list`)
      .set('Authorization', `Bearer ${businessToken}`)
      .query({ kind: 'upcoming' })
      .expect(200);

    expect(businessBookingsResponse.body.items).toHaveLength(1);
    expect(businessBookingsResponse.body.items[0].id).toBe(bookingId);
    expect(businessBookingsResponse.body.items[0].participantsCount).toBe(3);
  });

  it('should prevent publishing activity without template', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        businessId,
        title: 'Incomplete Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        config: {
          packages: [
            {
              code: 'basic',
              title: 'Basic Package',
              is_default: true,
            },
          ],
        },
        pricing: {},
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/activities/${activityResponse.body.id}/publish`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(400);
  });

  it('should allow business to update draft activity', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        businessId,
        title: 'Original Title',
        typeId: 'karting',
        city: 'Luxembourg',
      })
      .expect(201);

    const activityId = activityResponse.body.id;

    const updateResponse = await request(app.getHttpServer())
      .put(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        title: 'Updated Title',
        description: 'New description',
      })
      .expect(200);

    expect(updateResponse.body.title).toBe('Updated Title');
    expect(updateResponse.body.description).toBe('New description');
  });

  it('should allow business to unpublish activity', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        businessId,
        title: 'Test Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        config: {
          packages: [
            {
              code: 'basic',
              title: 'Basic Package',
              is_default: true,
              min_participants: 1,
              availability: {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00:00',
                endTime: '17:00:00',
                slotDurationMinutes: 60,
                capacity: 5,
                status: 'active',
              },
            },
          ],
        },
        pricing: {},
      })
      .expect(201);

    const activityId = activityResponse.body.id;

    // Publish
    await request(app.getHttpServer())
      .patch(`/activities/${activityId}/publish`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    // Unpublish
    const unpublishResponse = await request(app.getHttpServer())
      .patch(`/activities/${activityId}/unpublish`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(unpublishResponse.body.status).toBe('draft');
  });

  it('should show business bookings with filters', async () => {
    const activity = await createTestActivity(testPrisma, businessId, {
      status: 'published',
    });

    // Create multiple bookings
    const futureSlot = new Date('2026-03-16T08:00:00.000Z');
    
    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        activityId: activity.id,
        slotStart: futureSlot.toISOString(),
        participantsCount: 2,
        selectionData: {},
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        activityId: activity.id,
        slotStart: new Date('2026-03-17T08:00:00.000Z').toISOString(),
        participantsCount: 1,
        selectionData: {},
      })
      .expect(201);

    // Get all bookings
    const allBookingsResponse = await request(app.getHttpServer())
      .get(`/bookings/business/${businessId}/list`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(allBookingsResponse.body.items).toHaveLength(2);

    // Filter by upcoming
    const upcomingResponse = await request(app.getHttpServer())
      .get(`/bookings/business/${businessId}/list`)
      .set('Authorization', `Bearer ${businessToken}`)
      .query({ kind: 'upcoming' })
      .expect(200);

    expect(upcomingResponse.body.items).toHaveLength(2);
  });
});
