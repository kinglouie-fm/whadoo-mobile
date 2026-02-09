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
    
    // For activities with packages (karting, cooking_class, escape_room)
    if (config.packages && Array.isArray(config.packages)) {
      // Find the selected package
      const packageId = selectionData.packageId || selectionData.packageCode;
      const selectedPackage = config.packages.find((pkg: any) => 
        pkg.code === packageId || pkg.title === selectionData.packageName
      );
      
      if (selectedPackage && selectedPackage.base_price) {
        const basePrice = Number(selectedPackage.base_price);
        const pricingType = selectedPackage.pricing_type || 'per_person';
        
        // Calculate total based on pricing model
        const total = pricingType === 'fixed' 
          ? basePrice 
          : basePrice * participantsCount;
        
        return {
          total: total.toFixed(2),
          currency: selectedPackage.currency || 'EUR',
          breakdown: {
            basePrice: basePrice.toFixed(2),
            pricingType,
            participantsCount,
            packageName: selectedPackage.title,
            ...(pricingType === 'per_person' && {
              basePricePerPerson: basePrice.toFixed(2),
            }),
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

      // 2. Validate participant count against package constraints
      const config = activity.config as any;
      if (config?.packages && Array.isArray(config.packages)) {
        const packageId = selectionData?.packageCode || selectionData?.packageId;
        const selectedPackage = config.packages.find((pkg: any) => 
          pkg.code === packageId || pkg.title === selectionData?.packageName
        );

        if (selectedPackage) {
          if (selectedPackage.min_participants && participantsCount < selectedPackage.min_participants) {
            throw new BadRequestException({
              code: 'MIN_PARTICIPANTS_NOT_MET',
              message: `This package requires at least ${selectedPackage.min_participants} participants. You selected ${participantsCount}.`,
              minParticipants: selectedPackage.min_participants,
              selectedParticipants: participantsCount,
            });
          }

          if (selectedPackage.max_participants && participantsCount > selectedPackage.max_participants) {
            throw new BadRequestException({
              code: 'MAX_PARTICIPANTS_EXCEEDED',
              message: `This package allows maximum ${selectedPackage.max_participants} participants. You selected ${participantsCount}.`,
              maxParticipants: selectedPackage.max_participants,
              selectedParticipants: participantsCount,
            });
          }
        }
      }

      // 3. Generate slot ID
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

      // 5. Capacity check
      const availableSeats = slotCapacity.capacity - slotCapacity.bookedSeats;
      
      if (availableSeats < participantsCount) {
        throw new ConflictException({
          code: 'SLOT_FULL',
          message: `This time slot is no longer available for ${participantsCount} participants. Only ${availableSeats} spots remaining.`,
          availableSeats,
        });
      }

      // 6. Update booked seats
      await tx.slotCapacity.update({
        where: { id: slotId },
        data: {
          bookedSeats: {
            increment: participantsCount,
          },
        },
      });

      // 7. Compute price & snapshots
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

      // 8. Insert booking record
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

  async listBusinessBookings(
    userId: string,
    businessId: string,
    kind?: 'upcoming' | 'past' | 'today',
    options?: { status?: 'active' | 'cancelled' | 'completed'; limit?: number; cursor?: string }
  ) {
    // Verify user owns this business
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== userId) {
      throw new BadRequestException('You can only view bookings for your own business');
    }

    const limit = options?.limit || 50;
    const now = new Date();

    const where: any = { businessId };

    // Filter by status if provided
    if (options?.status) {
      where.status = options.status;
    }

    // Filter by kind
    if (kind === 'today') {
      // Get today's date in Luxembourg timezone
      const luxNow = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Luxembourg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const [month, day, year] = luxNow.split(', ')[0].split('/');
      const todayStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
      const todayEnd = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));
      
      where.slotStart = {
        gte: todayStart,
        lte: todayEnd,
      };
    } else if (kind === 'upcoming') {
      where.slotStart = { gte: now };
    } else if (kind === 'past') {
      where.slotStart = { lt: now };
    }

    // Cursor-based pagination
    if (options?.cursor) {
      where.id = {
        lt: options.cursor,
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: kind === 'past' ? { slotStart: 'desc' } : { slotStart: 'asc' },
      take: limit + 1,
    });

    const hasMore = bookings.length > limit;
    const results = bookings.slice(0, limit);

    return {
      items: results,
      nextCursor: hasMore ? results[results.length - 1].id : null,
    };
  }

  async getBusinessStats(userId: string, businessId: string) {
    // Verify user owns this business
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== userId) {
      throw new BadRequestException('You can only view stats for your own business');
    }

    const now = new Date();

    // Get today's date range in Luxembourg timezone
    const luxNow = new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Luxembourg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [month, day, year] = luxNow.split(', ')[0].split('/');
    const todayStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));

    // Count bookings happening today
    const todayCount = await this.prisma.booking.count({
      where: {
        businessId,
        status: 'active',
        slotStart: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Count upcoming bookings
    const upcomingCount = await this.prisma.booking.count({
      where: {
        businessId,
        status: 'active',
        slotStart: {
          gte: now,
        },
      },
    });

    // Calculate total revenue from active bookings
    const revenueResult = await this.prisma.booking.aggregate({
      where: {
        businessId,
        status: 'active',
      },
      _sum: {
        paymentAmount: true,
      },
    });

    const totalRevenue = revenueResult._sum.paymentAmount || 0;

    return {
      todayCount,
      upcomingCount,
      totalRevenue: Number(totalRevenue),
    };
  }
}
