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

@Controller('bookings')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  async createBooking(
    @Req() req: AuthedRequest,
    @Body() dto: CreateBookingDto
  ) {
    const userId = req.appUser!.id;
    return this.service.createBooking(userId, dto);
  }

  @Post(':id/cancel')
  async cancelBooking(
    @Req() req: AuthedRequest,
    @Param('id') bookingId: string,
    @Body() dto: CancelBookingDto
  ) {
    const userId = req.appUser!.id;
    return this.service.cancelBooking(userId, bookingId, dto.reason);
  }

  @Get()
  async listBookings(
    @Req() req: AuthedRequest,
    @Query('kind') kind?: 'upcoming' | 'past',
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listBookings(userId, kind, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get(':id')
  async getBooking(
    @Req() req: AuthedRequest,
    @Param('id') bookingId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.getBooking(userId, bookingId);
  }

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
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('business/:businessId/stats')
  async getBusinessStats(
    @Req() req: AuthedRequest,
    @Param('businessId') businessId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.getBusinessStats(userId, businessId);
  }
}
