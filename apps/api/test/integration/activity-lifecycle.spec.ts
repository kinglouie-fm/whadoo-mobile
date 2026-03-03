import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ActivitiesService } from '../../src/activities/activities.service';
import { ActivityTypeDefinitionsService } from '../../src/activity-type-definitions/activity-type-definitions.service';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  testPrisma,
} from '../test-setup';
import { createTestUser, createTestBusiness } from '../fixtures/users';
import { PublishValidationError } from '../../src/common/error-responses';

describe('Activity Lifecycle (Integration)', () => {
  let module: TestingModule;
  let activitiesService: ActivitiesService;
  let typeDefinitionsService: ActivityTypeDefinitionsService;
  let businessOwnerId: string;
  let businessId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        ActivityTypeDefinitionsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    activitiesService = module.get<ActivitiesService>(ActivitiesService);
    availabilityTemplatesService = module.get<AvailabilityTemplatesService>(
      AvailabilityTemplatesService,
    );
    typeDefinitionsService = module.get<ActivityTypeDefinitionsService>(
      ActivityTypeDefinitionsService,
    );
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();

    const owner = await createTestUser(testPrisma, { role: 'business' });
    businessOwnerId = owner.id;

    const business = await createTestBusiness(testPrisma, businessOwnerId);
    businessId = business.id;
  });

  describe('Create Activity', () => {
    it('should create activity in draft status', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
      });

      expect(activity.status).toBe('draft');
      expect(activity.title).toBe('Test Karting');
      expect(activity.businessId).toBe(businessId);
    });

    it('should reject activity creation for non-owner', async () => {
      const otherUser = await createTestUser(testPrisma, { role: 'business' });

      await expect(
        activitiesService.createActivity(otherUser.id, {
          businessId,
          title: 'Unauthorized Activity',
          typeId: 'karting',
          city: 'Luxembourg',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject activity with invalid type', async () => {
      await expect(
        activitiesService.createActivity(businessOwnerId, {
          businessId,
          title: 'Invalid Type Activity',
          typeId: 'invalid-type',
          city: 'Luxembourg',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Publish Activity', () => {
    it('should require linked availability template for publishing', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
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
      });

      await expect(
        activitiesService.publishActivity(activity.id, businessOwnerId),
      ).rejects.toThrow(PublishValidationError);
    });

    it('should successfully publish activity with valid package availability', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
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
      });

      const published = await activitiesService.publishActivity(
        activity.id,
        businessOwnerId,
      );

      expect(published.status).toBe('published');
    });

    it('should require active availability for publishing', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
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
                status: 'inactive',
              },
            },
          ],
        },
        pricing: {},
      });

      await expect(
        activitiesService.publishActivity(activity.id, businessOwnerId),
      ).rejects.toThrow(PublishValidationError);
    });
  });

  describe('Discovery Visibility', () => {
    it('should show published activities in discovery', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Published Activity',
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);

      const published = await activitiesService.listPublishedActivities();

      expect(published).toHaveLength(1);
      expect(published[0].id).toBe(activity.id);
    });

    it('should not show draft activities in discovery', async () => {
      await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Draft Activity',
        typeId: 'karting',
        city: 'Luxembourg',
      });

      const published = await activitiesService.listPublishedActivities();

      expect(published).toHaveLength(0);
    });

    it('should not show inactive activities in discovery', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Activity to Deactivate',
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      await activitiesService.deactivateActivity(activity.id, businessOwnerId);

      const published = await activitiesService.listPublishedActivities();

      expect(published).toHaveLength(0);
    });
  });

  describe('Update Activity', () => {
    it('should update draft activity successfully', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Original Title',
        typeId: 'karting',
        city: 'Luxembourg',
      });

      const updated = await activitiesService.updateActivity(
        activity.id,
        businessOwnerId,
        {
          title: 'Updated Title',
          description: 'New description',
        },
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
      expect(updated.status).toBe('draft');
    });

    it('should allow updating config for published activity', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);

      const updated = await activitiesService.updateActivity(activity.id, businessOwnerId, {
        config: {
          packages: [
            {
              code: 'basic',
              title: 'Updated Package',
              is_default: true,
              min_participants: 2,
              availability: {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '10:00:00',
                endTime: '18:00:00',
                slotDurationMinutes: 90,
                capacity: 8,
                status: 'active',
              },
            },
          ],
        },
      });

      expect(updated.config).toEqual({
        packages: [
          {
            code: 'basic',
            title: 'Updated Package',
            is_default: true,
            min_participants: 2,
            availability: {
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '10:00:00',
              endTime: '18:00:00',
              slotDurationMinutes: 90,
              capacity: 8,
              status: 'active',
            },
          },
        ],
      });
    });
  });

  describe('Unpublish and Deactivate', () => {
    it('should unpublish activity back to draft', async () => {

      const activity = await activitiesService.createActivity(businessOwnerId, {
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      const unpublished = await activitiesService.unpublishActivity(
        activity.id,
        businessOwnerId,
      );

      expect(unpublished.status).toBe('draft');
    });

    it('should deactivate activity', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      const deactivated = await activitiesService.deactivateActivity(
        activity.id,
        businessOwnerId,
      );

      expect(deactivated.status).toBe('inactive');
    });
  });

  describe('Consumer View Access', () => {
    it('should allow consumers to view published activities', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Public Activity',
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);

      const consumerView = await activitiesService.getActivity(
        activity.id,
        undefined,
        'consumer',
      );

      expect(consumerView.id).toBe(activity.id);
      expect(consumerView.status).toBe('published');
    });

    it('should hide draft activities from consumer view', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Draft Activity',
        typeId: 'karting',
        city: 'Luxembourg',
      });

      await expect(
        activitiesService.getActivity(activity.id, undefined, 'consumer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hide inactive activities from consumer view', async () => {
      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Activity to Deactivate',
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
      });

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      await activitiesService.deactivateActivity(activity.id, businessOwnerId);

      await expect(
        activitiesService.getActivity(activity.id, undefined, 'consumer'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
