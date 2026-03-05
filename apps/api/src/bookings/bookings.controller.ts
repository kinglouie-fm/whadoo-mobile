import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthedRequest, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AppUserGuard } from '../auth/app-user.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

/**
 * Booking endpoints for consumers and business owners.
 */
@Controller('bookings')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  /**
   * Creates a booking for the authenticated user.
   */
  @Post()
  async createBooking(
    @Req() req: AuthedRequest,
    @Body() dto: CreateBookingDto
  ) {
    const userId = req.appUser!.id;
    return this.service.createBooking(userId, dto);
  }

  /**
   * Cancels a booking owned by the authenticated user.
   */
  @Post(':id/cancel')
  async cancelBooking(
    @Req() req: AuthedRequest,
    @Param('id') bookingId: string,
    @Body() dto: CancelBookingDto
  ) {
    const userId = req.appUser!.id;
    return this.service.cancelBooking(userId, bookingId, dto.reason);
  }

  /**
   * Lists user bookings with optional kind filtering and cursor pagination.
   */
  @Get()
  async listBookings(
    @Req() req: AuthedRequest,
    @Query('kind') kind?: 'upcoming' | 'past',
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listBookings(userId, kind, {
      // Query params are strings; normalize limit to number when present.
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Returns a single booking owned by the authenticated user.
   */
  @Get(':id')
  async getBooking(
    @Req() req: AuthedRequest,
    @Param('id') bookingId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.getBooking(userId, bookingId);
  }

  /**
   * Lists bookings for a business owned by the authenticated user.
   */
  @Get('business/:businessId/list')
  async listBusinessBookings(
    @Req() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Query('status') status?: 'active' | 'cancelled' | 'completed',
    @Query('kind') kind?: 'upcoming' | 'past' | 'today',
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listBusinessBookings(userId, businessId, kind, {
      status,
      // Query params are strings; normalize limit to number when present.
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Returns aggregate booking stats for an owned business.
   */
  @Get('business/:businessId/stats')
  async getBusinessStats(
    @Req() req: AuthedRequest,
    @Param('businessId') businessId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.getBusinessStats(userId, businessId);
  }
}
