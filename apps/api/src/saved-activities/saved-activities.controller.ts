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
import { SavedActivitiesService } from './saved-activities.service';
import { SaveActivityDto } from './dto/save-activity.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';

/**
 * Endpoints for user-saved activities and saved-state checks.
 */
@Controller('saved-activities')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class SavedActivitiesController {
  constructor(private readonly service: SavedActivitiesService) {}

  /**
   * Saves an activity for the authenticated user.
   */
  @Post()
  async saveActivity(
    @Req() req: AuthedRequest,
    @Body() dto: SaveActivityDto
  ) {
    const userId = req.appUser!.id;
    return this.service.saveActivity(userId, dto.activityId);
  }

  /**
   * Removes a saved activity for the authenticated user.
   */
  @Delete(':activityId')
  async unsaveActivity(
    @Req() req: AuthedRequest,
    @Param('activityId') activityId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.unsaveActivity(userId, activityId);
  }

  /**
   * Lists saved activities with cursor pagination.
   */
  @Get()
  async listSavedActivities(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listSavedActivities(userId, {
      // Query params are strings; normalize limit to number when present.
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Deletes multiple saved activities in one request.
   */
  @Post('bulk-delete')
  async bulkDelete(
    @Req() req: AuthedRequest,
    @Body() dto: BulkDeleteDto
  ) {
    const userId = req.appUser!.id;
    return this.service.bulkDelete(userId, dto.activityIds);
  }

  /**
   * Returns whether an activity is currently saved by the authenticated user.
   */
  @Get(':activityId/check')
  async checkSaved(
    @Req() req: AuthedRequest,
    @Param('activityId') activityId: string
  ) {
    const userId = req.appUser!.id;
    const isSaved = await this.service.isSaved(userId, activityId);
    return { isSaved };
  }
}
