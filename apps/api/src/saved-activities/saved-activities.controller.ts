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

@Controller('saved-activities')
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class SavedActivitiesController {
  constructor(private readonly service: SavedActivitiesService) {}

  @Post()
  async saveActivity(
    @Req() req: AuthedRequest,
    @Body() dto: SaveActivityDto
  ) {
    const userId = req.appUser!.id;
    return this.service.saveActivity(userId, dto.activityId);
  }

  @Delete(':activityId')
  async unsaveActivity(
    @Req() req: AuthedRequest,
    @Param('activityId') activityId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.unsaveActivity(userId, activityId);
  }

  @Get()
  async listSavedActivities(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listSavedActivities(userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Post('bulk-delete')
  async bulkDelete(
    @Req() req: AuthedRequest,
    @Body() dto: BulkDeleteDto
  ) {
    const userId = req.appUser!.id;
    return this.service.bulkDelete(userId, dto.activityIds);
  }

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
