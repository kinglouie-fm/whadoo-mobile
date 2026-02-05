import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly LUXEMBOURG_TZ = 'Europe/Luxembourg';

  constructor(private prisma: PrismaService) {}

  private generateSlotId(activityId: string, slotStart: Date): string {
    // Keep this commented out code!!!
    // Use UTC for slot ID format to match availability resolution
    // Slots are stored/generated in UTC, display is converted to local
    // const year = slotStart.getUTCFullYear();
    // const month = String(slotStart.getUTCMonth() + 1).padStart(2, '0');
    // const day = String(slotStart.getUTCDate()).padStart(2, '0');
    // const hours = String(slotStart.getUTCHours ()).padStart(2, '0');
    // const minutes = String(slotStart.getUTCMinutes()).padStart(2, '0');
    
    // Generate slot ID using Luxembourg local time to match availability resolution
    const luxStr = slotStart.toLocaleString('en-US', {
      timeZone: this.LUXEMBOURG_TZ,
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
    
    return `${activityId}_${year}-${month}-${day}_${hours}${minutes}`;
  }

  private calculatePrice(activity: any, participantsCount: number, selectionData: any): any {
    // Extract pricing from activity config/pricing
    const { config, pricing } = activity;
    
    // For karting with packages
    if (activity.typeId === 'karting' && config.packages && Array.isArray(config.packages)) {
      // Find the selected package
      const packageId = selectionData.packageId || selectionData.packageCode;
      const selectedPackage = config.packages.find((pkg: any) => 
        pkg.code === packageId || pkg.title === selectionData.packageName
      );
      
      if (selectedPackage && selectedPackage.base_price) {
        const basePrice = Number(selectedPackage.base_price);
        const total = basePrice * participantsCount;
        
        return {
          total: total.toFixed(2),
          currency: selectedPackage.currency || 'EUR',
          breakdown: {
            basePricePerPerson: basePrice.toFixed(2),
            participantsCount,
            packageName: selectedPackage.title,
          },
        };
      }
    }
    
    // Fallback to priceFrom if available
    if (activity.priceFrom) {
      const basePrice = Number(activity.priceFrom);
      const total = basePrice * participantsCount;
      
      return {
        total: total.toFixed(2),
        currency: 'EUR',
        breakdown: {
          basePricePerPerson: basePrice.toFixed(2),
          participantsCount,
        },
      };
    }
    
    // Default
    return {
      total: '0.00',
      currency: 'EUR',
      breakdown: {},
    };
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    const { activityId, slotStart, participantsCount, selectionData } = dto;
    
    // Check user profile completeness
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, firstName: true, lastName: true },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.phoneNumber) {
      throw new BadRequestException({
        code: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile by adding a phone number before booking',
        missingFields: ['phoneNumber'],
      });
    }
    
    const slotStartDate = new Date(slotStart);
    const now = new Date();
    
    if (slotStartDate <= now) {
      throw new BadRequestException('Cannot book a slot in the past');
    }

    // Transaction for atomic booking
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch activity with full details
      const activity = await tx.activity.findUnique({
        where: { id: activityId },
        include: {
          availabilityTemplate: true,
          business: {
            select: {
              id: true,
              name: true,
              contactPhone: true,
              contactEmail: true,
              city: true,
              address: true,
            },
          },
          images: {
            where: { isThumbnail: true },
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!activity) {
        throw new NotFoundException('Activity not found');
      }

      if (activity.status !== 'published') {
        throw new BadRequestException('Activity is not available for booking');
      }

      if (!activity.availabilityTemplateId || !activity.availabilityTemplate) {
        throw new BadRequestException('Activity has no availability configured');
      }

      if (activity.availabilityTemplate.status !== 'active') {
        throw new BadRequestException('Activity availability is inactive');
      }

      // 2. Generate slot ID
      const slotId = this.generateSlotId(activityId, slotStartDate);

      // 3. Lock / initialize slot capacity row
      let slotCapacity = await tx.slotCapacity.findUnique({
        where: { id: slotId },
      });

      if (!slotCapacity) {
        // Lazy init - create slot capacity record
        slotCapacity = await tx.slotCapacity.create({
          data: {
            id: slotId,
            activityId,
            slotStart: slotStartDate,
            capacity: activity.availabilityTemplate.capacity,
            bookedSeats: 0,
            status: 'active',
          },
        });
      }

      // 4. Capacity check
      const availableSeats = slotCapacity.capacity - slotCapacity.bookedSeats;
      
      if (availableSeats < participantsCount) {
        throw new ConflictException({
          code: 'SLOT_FULL',
          message: `This time slot is no longer available for ${participantsCount} participants. Only ${availableSeats} spots remaining.`,
          availableSeats,
        });
      }

      // 5. Update booked seats
      await tx.slotCapacity.update({
        where: { id: slotId },
        data: {
          bookedSeats: {
            increment: participantsCount,
          },
        },
      });

      // 6. Compute price & snapshots
      const priceSnapshot = this.calculatePrice(activity, participantsCount, selectionData);
      
      const activitySnapshot = {
        title: activity.title,
        description: activity.description,
        city: activity.city,
        address: activity.address,
        thumbnailUrl: activity.images[0]?.imageUrl || null,
        typeId: activity.typeId,
        catalogGroupKind: activity.catalogGroupKind,
      };
      
      const businessSnapshot = {
        name: activity.business.name,
        contactPhone: activity.business.contactPhone,
        contactEmail: activity.business.contactEmail,
        city: activity.business.city,
        address: activity.business.address,
      };
      
      const selectionSnapshot = {
        typeId: activity.typeId,
        activityId: activity.id,
        packageName: selectionData.packageName || null,
        durationMinutes: activity.availabilityTemplate.slotDurationMinutes,
        participantsCount,
        data: selectionData,
      };

      // 7. Insert booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          businessId: activity.businessId,
          activityId: activity.id,
          slotStart: slotStartDate,
          participantsCount,
          status: 'active',
          activitySnapshot,
          businessSnapshot,
          selectionSnapshot,
          priceSnapshot,
          paymentAmount: priceSnapshot.total ? Number(priceSnapshot.total) : null,
          paymentCurrency: priceSnapshot.currency || null,
        },
      });

      return booking;
    });
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId !== userId) {
        throw new BadRequestException('You can only cancel your own bookings');
      }

      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking is already cancelled');
      }

      // 2. Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
        },
      });

      // 3. Refund capacity
      const slotId = this.generateSlotId(booking.activityId, booking.slotStart);
      
      const slotCapacity = await tx.slotCapacity.findUnique({
        where: { id: slotId },
      });

      if (slotCapacity) {
        await tx.slotCapacity.update({
          where: { id: slotId },
          data: {
            bookedSeats: {
              decrement: booking.participantsCount,
            },
          },
        });
      }

      return updatedBooking;
    });
  }

  async getBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only view your own bookings');
    }

    return booking;
  }

  async listBookings(
    userId: string,
    kind?: 'upcoming' | 'past',
    options?: { limit?: number; cursor?: string }
  ) {
    const limit = options?.limit || 50;
    const now = new Date();

    const where: any = { userId };

    if (kind === 'upcoming') {
      where.slotStart = { gte: now };
    } else if (kind === 'past') {
      where.slotStart = { lt: now };
    }

    if (options?.cursor) {
      where.id = {
        lt: options.cursor,
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: kind === 'upcoming' ? { slotStart: 'asc' } : { slotStart: 'desc' },
      take: limit + 1,
    });

    const hasMore = bookings.length > limit;
    const results = bookings.slice(0, limit);

    return {
      items: results,
      nextCursor: hasMore ? results[results.length - 1].id : null,
    };
  }
}
