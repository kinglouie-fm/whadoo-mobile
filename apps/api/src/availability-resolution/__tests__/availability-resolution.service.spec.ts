import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityResolutionService } from '../availability-resolution.service';

describe('AvailabilityResolutionService', () => {
  let service: AvailabilityResolutionService;
  let prisma: PrismaService;

  const mockActivity = {
    id: 'activity-1',
    status: 'published',
    business: { status: 'active' },
    availabilityTemplateId: 'template-1',
    availabilityTemplate: {
      id: 'template-1',
      status: 'active',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      startTime: new Date('1970-01-01T09:00:00.000Z'), // 09:00
      endTime: new Date('1970-01-01T17:00:00.000Z'), // 17:00
      slotDurationMinutes: 60,
      capacity: 10,
      exceptions: [],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityResolutionService,
        {
          provide: PrismaService,
          useValue: {
            activity: {
              findUnique: jest.fn(),
            },
            slotCapacity: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AvailabilityResolutionService>(
      AvailabilityResolutionService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Slot Generation', () => {
    it('should generate slots from template (days, start/end, duration)', async () => {
      // Monday, Apr 6, 2026 (well into the future)
      const testDate = '2026-04-06';

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      // Should generate 8 slots (09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00)
      expect(slots.length).toBe(8);
      expect(slots[0].capacity).toBe(10);
      
      // Verify first and last slot times
      const firstSlotHour = slots[0].slotStart.getUTCHours();
      const lastSlotHour = slots[7].slotStart.getUTCHours();
      
      // In April, Luxembourg is UTC+2, so 09:00 Luxembourg = 07:00 UTC
      expect(firstSlotHour).toBe(7); // 09:00 Luxembourg = 07:00 UTC (summer time)
      expect(lastSlotHour).toBe(14); // 16:00 Luxembourg = 14:00 UTC
    });

    it('should respect slot duration when generating slots', async () => {
      const testDate = '2026-04-06'; // Monday

      const customActivity = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          slotDurationMinutes: 30,
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(customActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      // 09:00-17:00 with 30min slots = 16 slots
      expect(slots.length).toBe(16);
      
      // Verify consecutive slots are 30 minutes apart
      for (let i = 0; i < slots.length - 1; i++) {
        const diff = slots[i + 1].slotStart.getTime() - slots[i].slotStart.getTime();
        expect(diff).toBe(30 * 60 * 1000); // 30 minutes in milliseconds
      }
    });

    it('should handle multi-day availability windows', async () => {
      const testDate = '2026-04-07'; // Tuesday

      const allDaysActivity = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // All days
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(allDaysActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      expect(slots.length).toBe(8);
    });
  });

  describe('Exceptions', () => {
    it('should block dates with exceptions', async () => {
      const testDate = '2026-04-06'; // Monday

      const activityWithException = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          exceptions: [
            {
              id: 'exc-1',
              startDate: new Date('2026-04-06T00:00:00.000Z'),
              endDate: new Date('2026-04-06T23:59:59.999Z'),
              reason: 'Closed for maintenance',
            },
          ],
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(activityWithException as any);

      const slots = await service.getAvailability('activity-1', testDate);

      // No slots should be returned (date is excepted)
      expect(slots).toEqual([]);
    });

    it('should block date ranges with exceptions', async () => {
      const testDate = '2026-04-08'; // Wednesday (in range)

      const activityWithRangeException = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          exceptions: [
            {
              id: 'exc-1',
              startDate: new Date('2026-04-06T00:00:00.000Z'),
              endDate: new Date('2026-04-10T23:59:59.999Z'), // 5-day exception
              reason: 'Holiday week',
            },
          ],
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(activityWithRangeException as any);

      const slots = await service.getAvailability('activity-1', testDate);

      expect(slots).toEqual([]);
    });

    it('should allow dates outside exception ranges', async () => {
      const testDate = '2026-04-13'; // Monday (outside exception)

      const activityWithException = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          exceptions: [
            {
              id: 'exc-1',
              startDate: new Date('2026-04-06T00:00:00.000Z'),
              endDate: new Date('2026-04-09T23:59:59.999Z'),
              reason: 'Closed',
            },
          ],
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(activityWithException as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe('Today Handling', () => {
    it('should filter out past slots for today', async () => {
      // Use actual current date for today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get day of week for today (ISO format: 1=Mon, 7=Sun)
      const dayOfWeek = today.getDay();
      const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      const todayActivity = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          daysOfWeek: [isoDayOfWeek], // Today's day
          startTime: new Date('1970-01-01T00:00:00.000Z'), // 00:00
          endTime: new Date('1970-01-01T23:59:00.000Z'), // 23:59
          slotDurationMinutes: 60,
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(todayActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', todayStr);

      // Should return only future slots (at least some should be filtered)
      // We can't assert exact count as it depends on current time
      slots.forEach((slot) => {
        expect(slot.slotStart.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should return empty array for past dates', async () => {
      const pastDate = '2020-01-15'; // Past date

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);

      const slots = await service.getAvailability('activity-1', pastDate);

      expect(slots).toEqual([]);
    });
  });

  describe('Days of Week', () => {
    it('should return empty array for dates not in template daysOfWeek', async () => {
      const testDate = '2026-04-07'; // Tuesday (not in [1,3,5])

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);

      const slots = await service.getAvailability('activity-1', testDate);

      expect(slots).toEqual([]);
    });

    it('should return slots for dates in template daysOfWeek', async () => {
      const testDate = '2026-04-08'; // Wednesday (in [1,3,5])

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe('Capacity Filtering', () => {
    it('should apply capacity from slot_capacity records', async () => {
      const testDate = '2026-04-06'; // Monday

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      
      // Mock one slot with capacity record (first slot: 09:00 Luxembourg = 07:00 UTC in April)
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([
        {
          id: 'activity-1_2026-04-06_0900',
          activityId: 'activity-1',
          slotStart: new Date('2026-04-06T07:00:00.000Z'),
          capacity: 10,
          bookedSeats: 7,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const slots = await service.getAvailability('activity-1', testDate);

      const firstSlot = slots[0];
      expect(firstSlot.capacity).toBe(10);
      expect(firstSlot.remainingCapacity).toBe(3);
      expect(firstSlot.available).toBe(true);
    });

    it('should mark slot unavailable when fully booked', async () => {
      const testDate = '2026-04-06'; // Monday

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([
        {
          id: 'activity-1_2026-04-06_0900',
          activityId: 'activity-1',
          slotStart: new Date('2026-04-06T07:00:00.000Z'),
          capacity: 10,
          bookedSeats: 10,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const slots = await service.getAvailability('activity-1', testDate);

      const firstSlot = slots[0];
      expect(firstSlot.remainingCapacity).toBe(0);
      expect(firstSlot.available).toBe(false);
    });

    it('should filter slots by party size', async () => {
      const testDate = '2026-04-06'; // Monday

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([
        {
          id: 'activity-1_2026-04-06_0900',
          activityId: 'activity-1',
          slotStart: new Date('2026-04-06T07:00:00.000Z'),
          capacity: 10,
          bookedSeats: 8,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Request with party size of 3 (remaining is only 2)
      const slots = await service.getAvailability('activity-1', testDate, 3);

      const firstSlot = slots[0];
      expect(firstSlot.remainingCapacity).toBe(2);
      expect(firstSlot.available).toBe(false); // Not enough capacity for party of 3
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundException for non-existent activity', async () => {
      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getAvailability('non-existent', '2026-04-06'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-published activity', async () => {
      const draftActivity = {
        ...mockActivity,
        status: 'draft',
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(draftActivity as any);

      await expect(
        service.getAvailability('activity-1', '2026-04-06'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for inactive business', async () => {
      const inactiveBusinessActivity = {
        ...mockActivity,
        business: { status: 'inactive' },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(inactiveBusinessActivity as any);

      await expect(
        service.getAvailability('activity-1', '2026-04-06'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no availability template linked', async () => {
      const noTemplateActivity = {
        ...mockActivity,
        availabilityTemplateId: null,
        availabilityTemplate: null,
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(noTemplateActivity as any);

      await expect(
        service.getAvailability('activity-1', '2026-04-06'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for inactive template', async () => {
      const inactiveTemplateActivity = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          status: 'inactive',
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(inactiveTemplateActivity as any);

      await expect(
        service.getAvailability('activity-1', '2026-04-06'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Timezone Handling (Luxembourg)', () => {
    it('should handle winter timezone (UTC+1)', async () => {
      // January is winter in Luxembourg (CET = UTC+1)
      const testDate = '2027-01-11'; // Monday

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(mockActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      // First slot: 09:00 Luxembourg = 08:00 UTC in winter
      expect(slots[0].slotStart.getUTCHours()).toBe(8);
    });

    it('should handle summer timezone (UTC+2)', async () => {
      // July is summer in Luxembourg (CEST = UTC+2)
      const testDate = '2026-07-13'; // Monday

      const summerActivity = {
        ...mockActivity,
        availabilityTemplate: {
          ...mockActivity.availabilityTemplate,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // All days
        },
      };

      jest.spyOn(prisma.activity, 'findUnique').mockResolvedValue(summerActivity as any);
      jest.spyOn(prisma.slotCapacity, 'findMany').mockResolvedValue([]);

      const slots = await service.getAvailability('activity-1', testDate);

      // First slot: 09:00 Luxembourg = 07:00 UTC in summer
      expect(slots[0].slotStart.getUTCHours()).toBe(7);
    });
  });
});
