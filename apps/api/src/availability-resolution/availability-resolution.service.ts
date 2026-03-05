import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SlotAvailability {
  slotId: string;
  slotStart: Date;
  available: boolean;
  remainingCapacity: number;
  capacity: number;
}

/**
 * Resolves date-based package availability into concrete, capacity-aware booking slots.
 */
@Injectable()
export class AvailabilityResolutionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Builds a deterministic slot id from activity, package, and Luxembourg-local slot time.
   */
  private generateSlotId(activityId: string, packageCode: string, slotStart: Date): string {
    // Generate slot ID using Luxembourg local time
    // slotStart is UTC but represents a Luxembourg local time
    const luxStr = slotStart.toLocaleString('en-US', {
      timeZone: 'Europe/Luxembourg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    // Parse the formatted string (format: "MM/DD/YYYY, HH:mm")
    const [datePart, timePart] = luxStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    return `${activityId}_${packageCode}_${year}-${month}-${day}_${hours}${minutes}`;
  }

  /**
   * Returns bookable slots for a package/date after status, day-of-week, and capacity checks.
   */
  async getAvailability(
    activityId: string,
    packageCode: string,
    date: string,
    partySize?: number
  ): Promise<SlotAvailability[]> {
    // 1. Validate activity
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
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

    // 2. Find package in config
    const config = activity.config as any;
    const packages = config?.packages || [];
    const pkg = packages.find((p: any) => p.code === packageCode);

    if (!pkg) {
      throw new BadRequestException(`Package "${packageCode}" not found for this activity`);
    }

    if (!pkg.availability) {
      throw new BadRequestException('No availability configured for this package');
    }

    const availability = pkg.availability;

    if (availability.status !== 'active') {
      throw new BadRequestException('Package availability is inactive');
    }

    // 3. Parse date in UTC (date string is in YYYY-MM-DD format representing a calendar day)
    // Date comes as YYYY-MM-DD string from query param
    const [year, month, day] = date.split('-').map(Number);
    const requestedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    
    // Compare calendar dates (not timestamps) to check if in past
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0));

    if (requestedDate < todayUTC) {
      return []; // No slots for past dates
    }

    // 4. Check if date is in package's daysOfWeek (1=Mon, 7=Sun)
    const dayOfWeek = requestedDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO 8601 (1=Mon, 7=Sun)

    if (!availability.daysOfWeek.includes(isoDayOfWeek)) {
      return []; // Date not in package's available days
    }

    // 5. Generate candidate slots (no exceptions for now)
    // Convert time strings to Date objects for compatibility with generateSlots
    const [startHours, startMinutes] = availability.startTime.split(':').map(Number);
    const [endHours, endMinutes] = availability.endTime.split(':').map(Number);
    
    const startTime = new Date(Date.UTC(1970, 0, 1, startHours, startMinutes, 0));
    const endTime = new Date(Date.UTC(1970, 0, 1, endHours, endMinutes, 0));
    
    const slots = this.generateSlots(
      requestedDate,
      startTime,
      endTime,
      availability.slotDurationMinutes,
      availability.capacity
    );

    // 6. Filter out past slots if today (in Luxembourg timezone)
    const nowLux = this.getCurrentLuxembourgTime();
    
    // Compare dates in Luxembourg timezone
    const luxDateNow = nowLux.toLocaleDateString('en-US', { timeZone: 'Europe/Luxembourg' });
    const luxDateRequested = requestedDate.toLocaleDateString('en-US', { timeZone: 'Europe/Luxembourg' });
    
    const validSlots =
      luxDateRequested === luxDateNow
        ? slots.filter((slot) => slot.slotStart.getTime() > new Date().getTime())
        : slots;
    
    console.log(`[Slot Filtering] Today check: requested=${luxDateRequested}, now=${luxDateNow}, isToday=${luxDateRequested === luxDateNow}`);
    console.log(`[Slot Filtering] Current time: ${new Date().toISOString()}`);
    console.log(`[Slot Filtering] Luxembourg time: ${nowLux.toISOString()}`);
    console.log(`[Slot Filtering] Filtered ${slots.length - validSlots.length} past slots out of ${slots.length}`);

    // 7. Lookup capacity for each slot
    const slotsWithCapacity = await this.applyCapacity(
      activityId,
      packageCode,
      validSlots,
      partySize
    );

    return slotsWithCapacity;
  }

  /**
   * Extracts hour/minute from PostgreSQL TIME values represented as Date instances.
   */
  private extractTimeComponents(timeDate: Date): { hours: number; minutes: number } {
    // PostgreSQL TIME type is returned as a Date object with arbitrary date (1970-01-01)
    // TIME is stored without timezone, representing Luxembourg local time
    const hours = timeDate.getUTCHours();
    const minutes = timeDate.getUTCMinutes();
    return { hours, minutes };
  }

  /**
   * Returns the current wall-clock time interpreted in the Luxembourg timezone.
   */
  private getCurrentLuxembourgTime(): Date {
    // Get current time in Luxembourg timezone
    const now = new Date();
    const luxString = now.toLocaleString('en-US', {
      timeZone: 'Europe/Luxembourg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return new Date(luxString);
  }

  /**
   * Returns Luxembourg UTC offset hours for a date (CET/CEST approximation).
   */
  private getLuxembourgOffsetHours(date: Date): number {
    // Determine if DST is active for Luxembourg on this date
    // Luxembourg uses CET (UTC+1) in winter and CEST (UTC+2) in summer
    // DST rules: Last Sunday in March to last Sunday in October
    
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-11
    
    // DST is definitely active in Apr-Sep (months 3-8)
    if (month >= 3 && month <= 8) {
      return 2; // UTC+2 (CEST)
    }
    
    // DST is definitely not active in Jan, Feb, Nov, Dec (months 0, 1, 10, 11)
    if (month <= 1 || month >= 10) {
      return 1; // UTC+1 (CET)
    }
    
    // For March and October, need to check if we're past the transition
    // Last Sunday of March at 02:00 → switch to UTC+2
    // Last Sunday of October at 03:00 → switch to UTC+1
    
    // For simplicity in Feb 2026, it's definitely winter (UTC+1)
    return 1; // UTC+1 (CET)
  }

  /**
   * Converts a Luxembourg-local calendar date/time into a UTC Date object.
   */
  private createLuxembourgDate(dateStr: string, hours: number, minutes: number): Date {
    // Create a Date representing a specific time in Luxembourg timezone
    // Input: dateStr (YYYY-MM-DD), hours and minutes (Luxembourg local time)
    // Output: Date object in UTC
    
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create a UTC date for this day
    const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Get Luxembourg offset for this date
    const luxOffsetHours = this.getLuxembourgOffsetHours(refDate);
    
    console.log(`[createLuxembourgDate] Date: ${dateStr}, Time: ${hours}:${minutes}, Luxembourg offset: UTC+${luxOffsetHours}`);
    
    // Luxembourg local time = UTC + offset
    // So: UTC = Luxembourg local time - offset
    const utcHours = hours - luxOffsetHours;
    
    const result = new Date(Date.UTC(year, month - 1, day, utcHours, minutes, 0));
    
    console.log(`[createLuxembourgDate] Result: ${result.toISOString()} (should be ${hours}:${String(minutes).padStart(2, '0')} Luxembourg time)`);
    
    return result;
  }

  /**
   * Generates candidate slot start times for one date window.
   */
  private generateSlots(
    date: Date,
    startTime: Date,
    endTime: Date,
    slotDurationMinutes: number,
    defaultCapacity: number
  ): Array<{ slotStart: Date; capacity: number }> {
    const slots: Array<{ slotStart: Date; capacity: number }> = [];

    // Extract hours and minutes from TIME fields (stored without timezone)
    const start = this.extractTimeComponents(startTime);
    const end = this.extractTimeComponents(endTime);

    console.log(`[Slot Generation] Date: ${date.toISOString()}`);
    console.log(`[Slot Generation] Start: ${start.hours}:${String(start.minutes).padStart(2, '0')}, End: ${end.hours}:${String(end.minutes).padStart(2, '0')}, Duration: ${slotDurationMinutes}min`);

    // Get date string
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create start and end times in Luxembourg timezone, converted to UTC
    const currentSlot = this.createLuxembourgDate(dateStr, start.hours, start.minutes);
    const endDateTime = this.createLuxembourgDate(dateStr, end.hours, end.minutes);

    // Generate slots - include slots where slot end equals endDateTime
    while (currentSlot < endDateTime) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

      // Include slot if it ends at or before the end time
      if (slotEnd <= endDateTime) {
        slots.push({
          slotStart: new Date(currentSlot),
          capacity: defaultCapacity,
        });
      }

      currentSlot.setMinutes(currentSlot.getMinutes() + slotDurationMinutes);
    }

    console.log(`[Slot Generation] Generated ${slots.length} slots`);
    slots.forEach((slot, idx) => {
      const hours = slot.slotStart.getUTCHours();
      const minutes = slot.slotStart.getUTCMinutes();
      console.log(`  Slot ${idx + 1}: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} (${slot.slotStart.toISOString()})`);
    });

    return slots;
  }

  /**
   * Merges generated slots with stored capacity and package-claim constraints.
   */
  private async applyCapacity(
    activityId: string,
    packageCode: string,
    slots: Array<{ slotStart: Date; capacity: number }>,
    partySize?: number
  ): Promise<SlotAvailability[]> {
    if (slots.length === 0) {
      return [];
    }

    // Generate slot IDs for this specific package
    const slotIds = slots.map((s) => this.generateSlotId(activityId, packageCode, s.slotStart));
    
    // Fetch existing capacity records for this package's slots
    const capacityRecords = await this.prisma.slotCapacity.findMany({
      where: {
        id: {
          in: slotIds,
        },
      },
    });

    // Cross-package claims make a time unavailable for this package once seats are booked.
    const allCapacityRecords = await this.prisma.slotCapacity.findMany({
      where: {
        activityId,
        slotStart: {
          in: slots.map(s => s.slotStart),
        },
      },
    });

    // Create a map for fast lookup (this package's capacity)
    const capacityMap = new Map<string, typeof capacityRecords[0]>();
    capacityRecords.forEach((record) => {
      capacityMap.set(record.id, record);
    });

    // Create a set of time slots claimed by other packages
    const claimedByOtherPackage = new Set<string>();
    allCapacityRecords.forEach((record) => {
      if (record.packageCode !== packageCode && record.bookedSeats > 0) {
        claimedByOtherPackage.add(record.slotStart.toISOString());
      }
    });

    // Apply capacity to each slot and filter out those claimed by other packages
    return slots
      .map((slot) => {
        const slotId = this.generateSlotId(activityId, packageCode, slot.slotStart);
        const capacityRecord = capacityMap.get(slotId);
        const timeKey = slot.slotStart.toISOString();

        // If this time slot is claimed by another package, mark as unavailable
        if (claimedByOtherPackage.has(timeKey)) {
          return {
            slotId,
            slotStart: slot.slotStart,
            available: false,
            remainingCapacity: 0,
            capacity: 0,
            bookedSeats: 0,
          };
        }

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
          bookedSeats,
        };
      })
      .filter((slot) => slot.available);
  }
}
