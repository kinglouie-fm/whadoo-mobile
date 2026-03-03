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

describe('Saved Activities (E2E)', () => {
  let app: INestApplication;
  let consumerToken: string;
  let consumerId: string;
  let activity1Id: string;
  let activity2Id: string;
  let activity3Id: string;

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

    // Create business and activities
    const businessOwner = await createTestUser(testPrisma, {
      role: 'business',
    });
    const business = await createTestBusiness(testPrisma, businessOwner.id);

    const activity1 = await createTestActivity(testPrisma, business.id, {
      status: 'published',
      title: 'Activity 1',
    });
    activity1Id = activity1.id;

    const activity2 = await createTestActivity(testPrisma, business.id, {
      status: 'published',
      title: 'Activity 2',
    });
    activity2Id = activity2.id;

    const activity3 = await createTestActivity(testPrisma, business.id, {
      status: 'published',
      title: 'Activity 3',
    });
    activity3Id = activity3.id;

    // Create consumer
    const consumer = await createTestUser(testPrisma, {
      firebaseUid: 'saved-activities-consumer-uid',
      email: 'saved-consumer@test.com',
      role: 'user',
    });
    consumerId = consumer.id;
    consumerToken = 'saved-activities-consumer-uid';
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await testPrisma.savedActivity.deleteMany({});
  });

  describe('Save Activity Flow', () => {
    it('should save an activity', async () => {
      const response = await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.saved.activityId).toBe(activity1Id);
    });

    it('should list saved activities', async () => {
      // Save multiple activities
      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity2Id })
        .expect(201);

      // List saved activities
      const listResponse = await request(app.getHttpServer())
        .get('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(listResponse.body.items).toHaveLength(2);
      const activityIds = listResponse.body.items.map((item: any) => item.activityId);
      expect(activityIds).toContain(activity1Id);
      expect(activityIds).toContain(activity2Id);
    });

    it('should check if activity is saved', async () => {
      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      const checkResponse = await request(app.getHttpServer())
        .get(`/saved-activities/${activity1Id}/check`)
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(checkResponse.body.isSaved).toBe(true);
    });

    it('should return false for unsaved activity', async () => {
      const checkResponse = await request(app.getHttpServer())
        .get(`/saved-activities/${activity2Id}/check`)
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(checkResponse.body.isSaved).toBe(false);
    });
  });

  describe('Unsave Activity', () => {
    it('should unsave a single activity', async () => {
      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/saved-activities/${activity1Id}`)
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(listResponse.body.items).toHaveLength(0);
    });
  });

  describe('Bulk Delete', () => {
    it('should delete multiple saved activities', async () => {
      // Save three activities
      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity2Id })
        .expect(201);

      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity3Id })
        .expect(201);

      // Bulk delete two of them
      await request(app.getHttpServer())
        .post('/saved-activities/bulk-delete')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityIds: [activity1Id, activity2Id] })
        .expect(201);

      // Check remaining
      const listResponse = await request(app.getHttpServer())
        .get('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(listResponse.body.items).toHaveLength(1);
      expect(listResponse.body.items[0].activityId).toBe(activity3Id);
    });
  });

  describe('Error Handling', () => {
    it('should reject saving non-existent activity', async () => {
      const response = await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: 'non-existent-id' });

      // Should return 400 or 404 for non-existent activity
      expect([400, 404]).toContain(response.status);
    });

    it('should handle duplicate save gracefully (idempotent)', async () => {
      await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      // Try to save again - should succeed (upsert is idempotent)
      const response = await request(app.getHttpServer())
        .post('/saved-activities')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ activityId: activity1Id })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
