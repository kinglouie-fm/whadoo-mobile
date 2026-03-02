import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AvailabilityResolutionService } from '../../src/availability-resolution/availability-resolution.service';
import { BookingsService } from '../../src/bookings/bookings.service';
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
import {
  createTestAvailabilityTemplate,
  createTestActivity,
} from '../fixtures/activities';

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
    it('should return slots based on template fields', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
          startTime: '10:00',
          endTime: '14:00',
          slotDurationMinutes: 60,
          capacity: 8,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      // Test Monday (2026-03-16)
      const slots = await availabilityService.getAvailability(
        activity.id,
        '2026-03-16',
      );

      // 10:00-14:00 with 60min slots = 4 slots
      expect(slots.length).toBe(4);
      expect(slots[0].capacity).toBe(8);
      expect(slots[0].remainingCapacity).toBe(8);
      expect(slots[0].available).toBe(true);
    });

    it('should return empty array for non-matching days', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          daysOfWeek: [1, 3, 5], // Mon, Wed, Fri only
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      // Test Tuesday (2026-03-17)
      const slots = await availabilityService.getAvailability(
        activity.id,
        '2026-03-17',
      );

      expect(slots).toEqual([]);
    });
  });

  describe('Capacity Reflected from slot_capacity', () => {
    it('should show default capacity when no bookings exist', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 15,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slots = await availabilityService.getAvailability(
        activity.id,
        '2026-03-02', // Monday
      );

      slots.forEach((slot) => {
        expect(slot.capacity).toBe(15);
        expect(slot.remainingCapacity).toBe(15);
        expect(slot.available).toBe(true);
      });
    });

    it('should update remaining capacity after booking', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 10,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z'); // Monday 09:00 Luxembourg (UTC+1)

      // Create a booking
      await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 3,
        selectionData: {},
      });

      // Check availability
      const slots = await availabilityService.getAvailability(
        activity.id,
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 10,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Create and cancel a booking
      const booking = await bookingsService.createBooking(consumerId, {
        activityId: activity.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 4,
        selectionData: {},
      });

      await bookingsService.cancelBooking(consumerId, booking.id);

      // Check availability
      const slots = await availabilityService.getAvailability(
        activity.id,
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
    it('should handle multiple activities with same time slots', async () => {
      // Create shared template
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 5,
        },
      );

      // Create two activities using the same template
      const activity1 = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
        title: 'Activity 1',
      });

      const activity2 = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
        title: 'Activity 2',
      });

      const slotStart = new Date('2026-03-16T08:00:00.000Z');

      // Book activity1
      await bookingsService.createBooking(consumerId, {
        activityId: activity1.id,
        slotStart: slotStart.toISOString(),
        participantsCount: 2,
        selectionData: {},
      });

      // Check availability for both activities
      const slots1 = await availabilityService.getAvailability(
        activity1.id,
        '2026-03-16',
      );
      const slots2 = await availabilityService.getAvailability(
        activity2.id,
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
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 12,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
      });

      const slots = await availabilityService.getAvailability(
        activity.id,
        '2026-03-16', // Monday
      );

      // All slots should have default capacity
      slots.forEach((slot) => {
        expect(slot.capacity).toBe(12);
        expect(slot.remainingCapacity).toBe(12);
      });
    });

    it('should create slot_capacity record on first booking', async () => {
      const template = await createTestAvailabilityTemplate(
        testPrisma,
        businessId,
        {
          capacity: 10,
        },
      );

      const activity = await createTestActivity(testPrisma, businessId, {
        status: 'published',
        availabilityTemplateId: template.id,
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
        selectionData: {},
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
