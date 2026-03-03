import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from '../../src/activities/activities.service';
import { ActivityTypeDefinitionsService } from '../../src/activity-type-definitions/activity-type-definitions.service';
import { AvailabilityTemplatesService } from '../../src/availability-templates/availability-templates.service';
import { BookingsService } from '../../src/bookings/bookings.service';
import { BusinessesService } from '../../src/businesses/businesses.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestActivity } from '../fixtures/activities';
import { createTestBusiness, createTestUser } from '../fixtures/users';
import {
  cleanupTestDatabase,
  disconnectTestDatabase,
  setupTestDatabase,
  testPrisma,
} from '../test-setup';

describe('RBAC - Role-Based Access Control Tests', () => {
  let activitiesService: ActivitiesService;
  let businessesService: BusinessesService;
  let templatesService: AvailabilityTemplatesService;
  let bookingsService: BookingsService;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        BusinessesService,
        AvailabilityTemplatesService,
        ActivityTypeDefinitionsService,
        BookingsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    activitiesService = module.get<ActivitiesService>(ActivitiesService);
    businessesService = module.get<BusinessesService>(BusinessesService);
    templatesService = module.get<AvailabilityTemplatesService>(
      AvailabilityTemplatesService,
    );
    bookingsService = module.get<BookingsService>(BookingsService);

    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('Activity Management', () => {
    it('should prevent consumer from creating activity', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);

      // Act & Assert - Consumer tries to create activity for business they don't own
      await expect(
        activitiesService.createActivity(consumer.id, {
          businessId: business.id,
          title: 'Test Activity',
          typeId: 'karting',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent business from creating activity for another business', async () => {
      // Setup
      const businessOwner1 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const businessOwner2 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business1 = await createTestBusiness(testPrisma, businessOwner1.id);
      const business2 = await createTestBusiness(testPrisma, businessOwner2.id);

      // Act & Assert - Business owner 2 tries to create activity for business 1
      await expect(
        activitiesService.createActivity(businessOwner2.id, {
          businessId: business1.id,
          title: 'Test Activity',
          typeId: 'karting',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent consumer from updating activity', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const activity = await createTestActivity(testPrisma, business.id);

      // Act & Assert
      await expect(
        activitiesService.updateActivity(activity.id, consumer.id, {
          title: 'Updated Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent business from updating another business activity', async () => {
      // Setup
      const businessOwner1 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const businessOwner2 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business1 = await createTestBusiness(testPrisma, businessOwner1.id);
      const business2 = await createTestBusiness(testPrisma, businessOwner2.id);
      const activity = await createTestActivity(testPrisma, business1.id);

      // Act & Assert - Business owner 2 tries to update activity from business 1
      await expect(
        activitiesService.updateActivity(activity.id, businessOwner2.id, {
          title: 'Updated Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Availability Template Management', () => {
    it('should prevent consumer from creating availability template', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);

      // Act & Assert
      await expect(
        templatesService.createTemplate(consumer.id, business.id, {
          name: 'Test Template',
          daysOfWeek: [1, 2, 3],
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 60,
          capacity: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent business from creating template for another business', async () => {
      // Setup
      const businessOwner1 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const businessOwner2 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business1 = await createTestBusiness(testPrisma, businessOwner1.id);
      const business2 = await createTestBusiness(testPrisma, businessOwner2.id);

      // Act & Assert
      await expect(
        templatesService.createTemplate(businessOwner2.id, business1.id, {
          name: 'Test Template',
          daysOfWeek: [1, 2, 3],
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 60,
          capacity: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Booking Access Control', () => {
    it("should prevent user from viewing another user's booking", async () => {
      // Setup
      const consumer1 = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352111111',
      });
      const consumer2 = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352222222',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Consumer1 makes a booking
      const booking = await bookingsService.createBooking(consumer1.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: { packageCode: 'standard' },
      });

      // Act & Assert - Consumer2 tries to view consumer1's booking
      await expect(
        bookingsService.getBooking(consumer2.id, booking.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow business owner to view bookings for their business', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Consumer makes a booking
      await bookingsService.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: { packageCode: 'standard' },
      });

      // Act - Business owner lists bookings for their business
      const result = await bookingsService.listBusinessBookings(
        businessOwner.id,
        business.id,
        'upcoming',
      );

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].businessId).toBe(business.id);
    });

    it("should prevent business from viewing another business's bookings", async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner1 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const businessOwner2 = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business1 = await createTestBusiness(testPrisma, businessOwner1.id);
      const business2 = await createTestBusiness(testPrisma, businessOwner2.id);
      const activity = await createTestActivity(testPrisma, business1.id, {
        status: 'published',
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Consumer makes a booking for business1
      await bookingsService.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: { packageCode: 'standard' },
      });

      // Act & Assert - Business owner 2 tries to view business1's bookings
      await expect(
        bookingsService.listBusinessBookings(
          businessOwner2.id,
          business1.id,
          'upcoming',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Business Management', () => {
    it('should throw when user without business tries to update', async () => {
      // Setup - user2 has no business
      const user2 = await createTestUser(testPrisma, {
        role: 'business',
      });

      // Act & Assert - User2 has no business, so updateMyBusiness throws
      await expect(
        businessesService.updateMyBusiness(user2.id, {
          name: 'Hacked Business Name',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
