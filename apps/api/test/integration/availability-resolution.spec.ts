import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AvailabilityResolutionService } from '../../src/availability-resolution/availability-resolution.service';
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

describe('Availability Resolution (Integration)', () => {
  let module: TestingModule;
  let availabilityService: AvailabilityResolutionService;
  let bookingsService: BookingsService;
  let activitiesService: ActivitiesService;
  let businessOwnerId: string;
  let businessId: string;
  let consumerId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        AvailabilityResolutionService,
        BookingsService,
        ActivitiesService,
        AvailabilityTemplatesService,
        ActivityTypeDefinitionsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    availabilityService = module.get<AvailabilityResolutionService>(
      AvailabilityResolutionService,
    );
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

  describe('Resolution Returns Slots', () => {
    it('should return slots based on package availability fields', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        config: {
          packages: [
            {
              code: 'standard',
              title: 'Standard Package',
              min_participants: 1,
              availability: {
                daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
                startTime: '10:00:00',
                endTime: '14:00:00',
                slotDurationMinutes: 60,
                capacity: 8,
                status: 'active',
              },
            },
          ],
        },
      });

      // Test Monday (2026-03-16)
      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-16',
      );

      // 10:00-14:00 with 60min slots = 4 slots
      expect(slots.length).toBe(4);
      expect(slots[0].capacity).toBe(8);
      expect(slots[0].remainingCapacity).toBe(8);
      expect(slots[0].available).toBe(true);
    });

    it('should return empty array for non-matching days', async () => {
      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        config: {
          packages: [
            {
              code: 'standard',
              title: 'Standard Package',
              min_participants: 1,
              availability: {
                daysOfWeek: [1, 3, 5], // Mon, Wed, Fri only
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

      // Test Tuesday (2026-03-17)
      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-17',
      );

      expect(slots).toEqual([]);
    });
  });

  describe('Capacity Reflected from slot_capacity', () => {
    it('should show default capacity when no bookings exist', async () => {
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
                capacity: 15,
                status: 'active',
              },
            },
          ],
        },
      });

      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-02', // Monday
      );

      slots.forEach((slot) => {
        expect(slot.capacity).toBe(15);
        expect(slot.remainingCapacity).toBe(15);
        expect(slot.available).toBe(true);
      });
    });

    it('should update remaining capacity after booking', async () => {
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

      const slotStart = new Date('2026-03-16T08:00:00.000Z'); // Monday 09:00 Luxembourg (UTC+1)

      // Create a booking
      await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 3,
        selectionData: { packageCode: 'standard' },
      });

      // Check availability
      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-16',
      );

      const bookedSlot = slots.find(
        (s) => s.slotStart.toISOString() === slotStart.toISOString(),
      );

      expect(bookedSlot).toBeDefined();
      expect(bookedSlot!.capacity).toBe(10);
      expect(bookedSlot!.remainingCapacity).toBe(7); // 10 - 3
      expect(bookedSlot!.available).toBe(true);
    });

    it('should update capacity after cancellation', async () => {
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

      // Create and cancel a booking
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 4,
        selectionData: { packageCode: 'standard' },
      });

      await bookingsService.cancelBooking(consumerId, booking.id);

      // Check availability
      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-16',
      );

      const slot = slots.find(
        (s) => s.slotStart.toISOString() === slotStart.toISOString(),
      );

      expect(slot!.remainingCapacity).toBe(10); // Back to full capacity
      expect(slot!.available).toBe(true);
    });
  });

  describe('Multiple Activities', () => {
    it('should handle activities with independent capacity', async () => {
      // Create two activities with their own availability
      const activity1 = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        title: 'Activity 1',
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
                capacity: 5,
                status: 'active',
              },
            },
          ],
        },
      });

      const activity2 = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        title: 'Activity 2',
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
                capacity: 5,
                status: 'active',
              },
            },
          ],
        },
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Book activity1
      await bookingsService.createBooking(consumerId, {
        activityId: activity1.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'standard' },
      });

      // Check availability for both activities
      const slots1 = await availabilityService.getAvailability(
        activity1.id,
        'standard',
        '2026-03-16',
      );
      const slots2 = await availabilityService.getAvailability(
        activity2.id,
        'standard',
        '2026-03-16',
      );

      const slot1 = slots1.find(
        (s) => s.slotStart.toISOString() === slotStart.toISOString(),
      );
      const slot2 = slots2.find(
        (s) => s.slotStart.toISOString() === slotStart.toISOString(),
      );

      // Activity1 should show reduced capacity
      expect(slot1!.remainingCapacity).toBe(3);

      // Activity2 should show full capacity (separate capacity tracking)
      expect(slot2!.remainingCapacity).toBe(5);
    });
  });

  describe('Slot Capacity Initialization', () => {
    it('should use default capacity when slot_capacity record missing', async () => {
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
                capacity: 12,
                status: 'active',
              },
            },
          ],
        },
      });

      const slots = await availabilityService.getAvailability(
        activity.id,
        'standard',
        '2026-03-16', // Monday
      );

      // All slots should have default capacity
      slots.forEach((slot) => {
        expect(slot.capacity).toBe(12);
        expect(slot.remainingCapacity).toBe(12);
      });
    });

    it('should create slot_capacity record on first booking', async () => {
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

      // Before booking, check that no slot_capacity exists
      const slotId = `${activity.id}_2026-03-16_0900`; // Approximate ID format
      const before = await testPrisma.slotCapacity.findUnique({
        where: { id: slotId },
      });
      expect(before).toBeNull();

      // Create booking
      await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: { packageCode: 'standard' },
      });

      // After booking, slot_capacity should exist
      const after = await testPrisma.slotCapacity.findMany({
        where: { activityId: activity.id },
      });

      expect(after.length).toBe(1);
      expect(after[0].capacity).toBe(10);
      expect(after[0].bookedSeats).toBe(2);
    });
  });
});
