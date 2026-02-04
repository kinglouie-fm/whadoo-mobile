import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SlotAvailability {
  slotId: string;
  slotStart: Date;
  available: boolean;
  remainingCapacity: number;
  capacity: number;
}

@Injectable()
export class AvailabilityResolutionService {
  constructor(private prisma: PrismaService) {}

  private generateSlotId(activityId: string, slotStart: Date): string {
    const year = slotStart.getFullYear();
    const month = String(slotStart.getMonth() + 1).padStart(2, '0');
    const day = String(slotStart.getDate()).padStart(2, '0');
    const hours = String(slotStart.getHours()).padStart(2, '0');
    const minutes = String(slotStart.getMinutes()).padStart(2, '0');
    
    return `${activityId}_${year}-${month}-${day}_${hours}${minutes}`;
  }

  async getAvailability(
    activityId: string,
    date: string,
    partySize?: number
  ): Promise<SlotAvailability[]> {
    // 1. Validate activity
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        availabilityTemplate: {
          include: {
            exceptions: true,
          },
        },
        business: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    if (activity.status !== 'published') {
      throw new BadRequestException('Activity is not available for booking');
    }

    if (activity.business.status !== 'active') {
      throw new BadRequestException('Business is not active');
    }

    if (!activity.availabilityTemplateId || !activity.availabilityTemplate) {
      throw new BadRequestException('No availability configured for this activity');
    }

    const template = activity.availabilityTemplate;

    if (template.status !== 'active') {
      throw new BadRequestException('Availability template is inactive');
    }

    // 2. Parse date and check if it's in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return []; // No slots for past dates
    }

    // 3. Check if date is in template's daysOfWeek (1=Mon, 7=Sun)
    const dayOfWeek = requestedDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO 8601 (1=Mon, 7=Sun)

    if (!template.daysOfWeek.includes(isoDayOfWeek)) {
      return []; // Date not in template's days
    }

    // 4. Check for exceptions
    const exceptions = template.exceptions || [];
    const isExcepted = exceptions.some((exception) => {
      const exceptionStart = new Date(exception.startDate);
      const exceptionEnd = new Date(exception.endDate);
      return requestedDate >= exceptionStart && requestedDate <= exceptionEnd;
    });

    if (isExcepted) {
      return []; // Date is blocked by exception
    }

    // 5. Generate candidate slots
    const slots = this.generateSlots(
      requestedDate,
      template.startTime,
      template.endTime,
      template.slotDurationMinutes,
      template.capacity
    );

    // 6. Filter out past slots if today
    const now = new Date();
    const validSlots =
      requestedDate.toDateString() === today.toDateString()
        ? slots.filter((slot) => slot.slotStart > now)
        : slots;

    // 7. Lookup capacity for each slot
    const slotsWithCapacity = await this.applyCapacity(
      activityId,
      validSlots,
      partySize
    );

    return slotsWithCapacity;
  }

  private generateSlots(
    date: Date,
    startTime: Date,
    endTime: Date,
    slotDurationMinutes: number,
    defaultCapacity: number
  ): Array<{ slotStart: Date; capacity: number }> {
    const slots: Array<{ slotStart: Date; capacity: number }> = [];

    // Extract hours and minutes from time fields
    const startHour = startTime.getUTCHours();
    const startMinute = startTime.getUTCMinutes();
    const endHour = endTime.getUTCHours();
    const endMinute = endTime.getUTCMinutes();

    // Create start and end datetime for the requested date
    const currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Generate slots
    while (currentSlot < endDateTime) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

      if (slotEnd <= endDateTime) {
        slots.push({
          slotStart: new Date(currentSlot),
          capacity: defaultCapacity,
        });
      }

      currentSlot.setMinutes(currentSlot.getMinutes() + slotDurationMinutes);
    }

    return slots;
  }

  private async applyCapacity(
    activityId: string,
    slots: Array<{ slotStart: Date; capacity: number }>,
    partySize?: number
  ): Promise<SlotAvailability[]> {
    if (slots.length === 0) {
      return [];
    }

    // Generate slot IDs for lookup
    const slotIds = slots.map((s) => this.generateSlotId(activityId, s.slotStart));
    
    // Fetch existing capacity records for these slots
    const capacityRecords = await this.prisma.slotCapacity.findMany({
      where: {
        id: {
          in: slotIds,
        },
      },
    });

    // Create a map for fast lookup
    const capacityMap = new Map<string, typeof capacityRecords[0]>();
    capacityRecords.forEach((record) => {
      capacityMap.set(record.id, record);
    });

    // Apply capacity to each slot
    return slots.map((slot) => {
      const slotId = this.generateSlotId(activityId, slot.slotStart);
      const capacityRecord = capacityMap.get(slotId);

      let capacity = slot.capacity;
      let bookedSeats = 0;
      let status = 'active';

      if (capacityRecord) {
        capacity = capacityRecord.capacity;
        bookedSeats = capacityRecord.bookedSeats;
        status = capacityRecord.status;
      }

      const remainingCapacity = capacity - bookedSeats;
      const available =
        status === 'active' &&
        remainingCapacity > 0 &&
        (!partySize || remainingCapacity >= partySize);

      return {
        slotId,
        slotStart: slot.slotStart,
        available,
        remainingCapacity,
        capacity,
      };
    });
  }
}
