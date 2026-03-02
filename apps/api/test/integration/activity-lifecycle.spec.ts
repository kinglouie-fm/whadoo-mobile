import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ActivitiesService } from '../../src/activities/activities.service';
import { AvailabilityTemplatesService } from '../../src/availability-templates/availability-templates.service';
import { ActivityTypeDefinitionsService } from '../../src/activity-type-definitions/activity-type-definitions.service';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  testPrisma,
} from '../test-setup';
import { createTestUser, createTestBusiness } from '../fixtures/users';
import { createTestAvailabilityTemplate } from '../fixtures/activities';
import { PublishValidationError } from '../../src/common/error-responses';

describe('Activity Lifecycle (Integration)', () => {
  let module: TestingModule;
  let activitiesService: ActivitiesService;
  let availabilityTemplatesService: AvailabilityTemplatesService;
  let typeDefinitionsService: ActivityTypeDefinitionsService;
  let businessOwnerId: string;
  let businessId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        AvailabilityTemplatesService,
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

    it('should successfully publish activity with valid template', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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

      const published = await activitiesService.publishActivity(
        activity.id,
        businessOwnerId,
      );

      expect(published.status).toBe('published');
    });

    it('should require active template for publishing', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        { status: 'inactive' },
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Karting',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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
  });

  describe('Discovery Visibility', () => {
    it('should show published activities in discovery', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Published Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Activity to Deactivate',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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

    it('should prevent changing template for published activity', async () => {
      const template1 = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );
      const template2 = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template1.id,
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

      await activitiesService.publishActivity(activity.id, businessOwnerId);

      await expect(
        activitiesService.updateActivity(activity.id, businessOwnerId, {
          availabilityTemplateId: template2.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Unpublish and Deactivate', () => {
    it('should unpublish activity back to draft', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      const unpublished = await activitiesService.unpublishActivity(
        activity.id,
        businessOwnerId,
      );

      expect(unpublished.status).toBe('draft');
    });

    it('should deactivate activity', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Test Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Public Activity',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
      );

      const activity = await activitiesService.createActivity(businessOwnerId, {
        businessId,
        title: 'Activity to Deactivate',
        typeId: 'karting',
        city: 'Luxembourg',
        priceFrom: 50,
        availabilityTemplateId: template.id,
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

      await activitiesService.publishActivity(activity.id, businessOwnerId);
      await activitiesService.deactivateActivity(activity.id, businessOwnerId);

      await expect(
        activitiesService.getActivity(activity.id, undefined, 'consumer'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
