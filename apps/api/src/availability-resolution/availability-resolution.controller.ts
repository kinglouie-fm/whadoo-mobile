import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppUserGuard } from '../auth/app-user.guard';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AvailabilityResolutionService } from './availability-resolution.service';

@Controller('availability')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class AvailabilityResolutionController {
  constructor(private readonly service: AvailabilityResolutionService) {}

  @Get()
  async getAvailability(
    @Query('activityId') activityId: string,
    @Query('date') date: string,
    @Query('partySize') partySize?: string
  ) {
    const slots = await this.service.getAvailability(
      activityId,
      date,
      partySize ? parseInt(partySize, 10) : undefined
    );

    return {
      activityId,
      date,
      slots,
    };
  }
}
