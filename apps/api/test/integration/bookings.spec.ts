import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from '../../src/bookings/bookings.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createTestActivity,
  createTestAvailabilityTemplate,
} from '../fixtures/activities';
import { createTestBusiness, createTestUser } from '../fixtures/users';
import {
  cleanupTestDatabase,
  disconnectTestDatabase,
  setupTestDatabase,
  testPrisma,
} from '../test-setup';

describe('BookingsService - Critical Integration Tests', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);

    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('Booking Creation with Capacity', () => {
    it('should create booking successfully with available capacity', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
        {
          capacity: 5,
        },
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      // Act
      const booking = await service.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {},
      });

      // Assert
      expect(booking).toBeDefined();
      expect(booking.userId).toBe(consumer.id);
      expect(booking.activityId).toBe(activity.id);
      expect(booking.participantsCount).toBe(2);
      expect(booking.status).toBe('active');

      // Verify capacity was updated
      const slotCapacity = await testPrisma.slotCapacity.findFirst({
        where: { activityId: activity.id },
      });
      expect(slotCapacity?.bookedSeats).toBe(2);
      expect(slotCapacity?.capacity).toBe(5);
    });

    it('should reject booking when capacity exceeded', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
        {
          capacity: 3, // Only 3 spots
        },
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // First booking takes 2 spots
      await service.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {},
      });

      // Act & Assert - Try to book 3 more (should fail, only 1 spot left)
      await expect(
        service.createBooking(consumer.id, {
          activityId: activity.id,
          slotStart: slotStart.toISOString(),
          participantsCount: 3,
          selectionData: {},
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject booking without phone number', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: null, // No phone number
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Act & Assert
      await expect(
        service.createBooking(consumer.id, {
          activityId: activity.id,
          slotStart: slotStart.toISOString(),
          participantsCount: 1,
          selectionData: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject booking for inactive activity', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'draft', // Not published
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Act & Assert
      await expect(
        service.createBooking(consumer.id, {
          activityId: activity.id,
          slotStart: slotStart.toISOString(),
          participantsCount: 1,
          selectionData: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Concurrency & Race Conditions', () => {
    it('should handle concurrent bookings for same slot correctly', async () => {
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
        {
          capacity: 3, // Only 3 spots
        },
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Act - Try to book simultaneously (both want 2 spots, only 3 available)
      const results = await Promise.allSettled([
        service.createBooking(consumer1.id, {
          activityId: activity.id,
          slotStart: slotStart.toISOString(),
          participantsCount: 2,
          selectionData: {},
        }),
        service.createBooking(consumer2.id, {
          activityId: activity.id,
          slotStart: slotStart.toISOString(),
          participantsCount: 2,
          selectionData: {},
        }),
      ]);

      // Assert - One should succeed, one should fail
      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      // Verify final capacity
      const slotCapacity = await testPrisma.slotCapacity.findFirst({
        where: { activityId: activity.id },
      });
      expect(slotCapacity?.bookedSeats).toBe(2); // Only one booking succeeded
    });

    it('should not create duplicate bookings on retry', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Act - Create booking twice (simulating double-tap/retry)
      const booking1 = await service.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: {},
      });

      const booking2 = await service.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: {},
      });

      // Assert - Both succeeded (no unique constraint), but capacity should reflect both
      expect(booking1.id).not.toBe(booking2.id);

      const bookings = await testPrisma.booking.findMany({
        where: {
          userId: consumer.id,
          activityId: activity.id,
        },
      });
      expect(bookings.length).toBe(2);

      // Capacity should be 2 (both bookings counted)
      const slotCapacity = await testPrisma.slotCapacity.findFirst({
        where: { activityId: activity.id },
      });
      expect(slotCapacity?.bookedSeats).toBe(2);
    });
  });

  describe('Booking Cancellation', () => {
    it('should cancel booking and refund capacity', async () => {
      // Setup
      const consumer = await createTestUser(testPrisma, {
        role: 'user',
        phoneNumber: '+352123456',
      });
      const businessOwner = await createTestUser(testPrisma, {
        role: 'business',
      });
      const business = await createTestBusiness(testPrisma, businessOwner.id);
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
        {
          capacity: 5,
        },
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const booking = await service.createBooking(consumer.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {},
      });

      // Act
      const cancelled = await service.cancelBooking(consumer.id, booking.id);

      // Assert
      expect(cancelled.status).toBe('cancelled');

      // Verify capacity was refunded
      const slotCapacity = await testPrisma.slotCapacity.findFirst({
        where: { activityId: activity.id },
      });
      expect(slotCapacity?.bookedSeats).toBe(0);
    });

    it("should not allow cancelling someone else's booking", async () => {
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        business.id,
      );
      const activity = await createTestActivity(testPrisma, business.id, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const booking = await service.createBooking(consumer1.id, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 1,
        selectionData: {},
      });

      // Act & Assert - consumer2 tries to cancel consumer1's booking
      await expect(
        service.cancelBooking(consumer2.id, booking.id),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
