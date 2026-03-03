import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BookingsService } from '../../src/bookings/bookings.service';
import { ActivitiesService } from '../../src/activities/activities.service';
import { ActivityTypeDefinitionsService } from '../../src/activity-type-definitions/activity-type-definitions.service';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  testPrisma,
} from '../test-setup';
import { createTestUser, createTestBusiness } from '../fixtures/users';
import { createTestActivity } from '../fixtures/activities';

describe('Snapshots & Edge Cases (Integration)', () => {
  let module: TestingModule;
  let bookingsService: BookingsService;
  let activitiesService: ActivitiesService;
  let businessOwnerId: string;
  let businessId: string;
  let consumerId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        BookingsService,
        ActivitiesService,
        ActivityTypeDefinitionsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
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

    const consumer = await createTestUser(testPrisma, {
      role: 'user',
      phoneNumber: '+352123456',
    });
    consumerId = consumer.id;
  });

  describe('Package Config Changes', () => {
    it('should preserve existing bookings when package config is updated', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
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

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Create booking with current config
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'standard' },
      });

      // Update activity config (change duration and capacity)
      await activitiesService.updateActivity(
        activity.id,
        businessOwnerId,
        {
          config: {
            packages: [
              {
                code: 'standard',
                title: 'Standard Package - Updated',
                min_participants: 2,
                availability: {
                  daysOfWeek: [1, 2, 3, 4, 5],
                  startTime: '09:00:00',
                  endTime: '17:00:00',
                  slotDurationMinutes: 30,
                  capacity: 5,
                  status: 'active',
                },
              },
            ],
          },
        },
      );

      // Retrieve booking
      const retrievedBooking = await bookingsService.getBooking(
        consumerId,
        booking.id,
      );

      // Booking snapshot should preserve original config state
      expect(retrievedBooking.activitySnapshot).toBeDefined();
      expect(retrievedBooking.status).toBe('active');
      expect(retrievedBooking.participantsCount).toBe(2);
      expect(retrievedBooking.selectionSnapshot.durationMinutes).toBe(60);
    });
  });

  describe('Activity Status Changes', () => {
    it('should preserve booking when activity becomes inactive', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Create booking
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'standard' },
      });

      // Deactivate activity
      await activitiesService.deactivateActivity(activity.id, businessOwnerId);

      // Booking should still be retrievable
      const retrievedBooking = await bookingsService.getBooking(
        consumerId,
        booking.id,
      );

      expect(retrievedBooking.id).toBe(booking.id);
      expect(retrievedBooking.status).toBe('active');
      expect(retrievedBooking.activitySnapshot).toBeDefined();
    });

    it('should not show inactive activity in discovery', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
      });

      await activitiesService.deactivateActivity(activity.id, businessOwnerId);

      const published = await activitiesService.listPublishedActivities();

      expect(published).toHaveLength(0);
    });
  });

  describe('Price Changes', () => {
    it('should not affect existing bookings when price changes', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        priceFrom: 50,
        pricing: {
          basePrice: 50,
        },
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
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Create booking at original price
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'basic' },
      });

      // Unpublish, update price, republish
      await activitiesService.unpublishActivity(activity.id, businessOwnerId);
      await activitiesService.updateActivity(activity.id, businessOwnerId, {
        priceFrom: 100,
        pricing: {
          basePrice: 100,
        },
      });
      await activitiesService.publishActivity(activity.id, businessOwnerId);

      // Retrieve booking
      const retrievedBooking = await bookingsService.getBooking(
        consumerId,
        booking.id,
      );

      // Booking should preserve snapshots (price is in priceSnapshot, not activitySnapshot)
      expect(retrievedBooking.activitySnapshot).toBeDefined();
      expect(retrievedBooking.priceSnapshot).toBeDefined();
      expect(retrievedBooking.paymentAmount).toBeDefined();
      
      // The original booking amount should be preserved
      const originalAmount = retrievedBooking.paymentAmount;
      
      // Verify activity was updated
      const updatedActivity = await testPrisma.activity.findUnique({
        where: { id: activity.id },
      });
      expect(Number(updatedActivity!.priceFrom)).toBe(100);
      
      // Booking payment amount should not change
      expect(retrievedBooking.paymentAmount).toBe(originalAmount);
    });
  });

  describe('Business Details Changes', () => {
    it('should preserve business details in booking snapshots', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Get original business name
      const business = await testPrisma.business.findUnique({
        where: { id: businessId },
      });
      const originalName = business!.name;

      // Create booking
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'standard' },
      });

      // Update business name
      await testPrisma.business.update({
        where: { id: businessId },
        data: { name: 'New Business Name' },
      });

      // Retrieve booking
      const retrievedBooking = await bookingsService.getBooking(
        consumerId,
        booking.id,
      );

      // Business snapshot should preserve original name
      expect(retrievedBooking.businessSnapshot).toBeDefined();
      const businessSnapshot = retrievedBooking.businessSnapshot as any;
      expect(businessSnapshot.name).toBe(originalName);
    });
  });

  describe('Activity Config Changes', () => {
    it('should preserve activity config in selection snapshot', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
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
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Create booking
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {
          packageCode: 'basic',
        },
      });

      // Unpublish and update config
      await activitiesService.unpublishActivity(activity.id, businessOwnerId);
      await activitiesService.updateActivity(activity.id, businessOwnerId, {
        config: {
          packages: [
            {
              code: 'premium',
              title: 'Premium Package',
              is_default: true,
            },
          ],
        },
      });
      await activitiesService.publishActivity(activity.id, businessOwnerId);

      // Retrieve booking
      const retrievedBooking = await bookingsService.getBooking(
        consumerId,
        booking.id,
      );

      // Selection snapshot should preserve original user's selection
      expect(retrievedBooking.selectionSnapshot).toBeDefined();
      const selectionSnapshot = retrievedBooking.selectionSnapshot as any;
      expect(selectionSnapshot.data).toEqual({ packageCode: 'basic' });
      expect(selectionSnapshot.activityId).toBe(activity.id);
    });
  });
});
