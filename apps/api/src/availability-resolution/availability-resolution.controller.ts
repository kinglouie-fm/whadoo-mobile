import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppUserGuard } from '../auth/app-user.guard';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AvailabilityResolutionService } from './availability-resolution.service';

/**
 * Availability endpoints for resolving bookable slots by activity package and date.
 */
@Controller('availability')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class AvailabilityResolutionController {
  constructor(private readonly service: AvailabilityResolutionService) {}

  /**
   * Returns available slots for a given activity package on a calendar day.
   */
  @Get()
  async getAvailability(
    @Query('activityId') activityId: string,
    @Query('packageCode') packageCode: string,
    @Query('date') date: string,
    @Query('partySize') partySize?: string
  ) {
    const slots = await this.service.getAvailability(
      activityId,
      packageCode,
      date,
      // Query params are strings; normalize to number when provided.
      partySize ? parseInt(partySize, 10) : undefined
    );

    return {
      activityId,
      packageCode,
      date,
      slots,
    };
  }
}
