import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AppUserGuard } from "../auth/app-user.guard";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

@Controller("activities")
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async createActivity(@Req() req: AuthedRequest, @Body() dto: CreateActivityDto) {
    const userId = req.appUser!.id;
    return this.service.createActivity(userId, dto);
  }

  @Get("business/:businessId")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async listActivities(
    @Req() req: AuthedRequest,
    @Param("businessId") businessId: string,
    @Query("status") status?: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listActivities(userId, businessId, status);
  }

  @Get("published")
  async listPublishedActivities(@Query("city") city?: string, @Query("typeId") typeId?: string) {
    return this.service.listPublishedActivities({ city, typeId });
  }

  @Get(":id")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async getActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.getActivity(id, userId, "business");
  }

  @Get(":id/consumer")
  async getActivityConsumer(@Param("id") id: string) {
    return this.service.getActivity(id, undefined, "consumer");
  }

  @Put(":id")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async updateActivity(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateActivityDto
  ) {
    const userId = req.appUser!.id;
    return this.service.updateActivity(id, userId, dto);
  }

  @Patch(":id/publish")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async publishActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.publishActivity(id, userId);
  }

  @Patch(":id/unpublish")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async unpublishActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.unpublishActivity(id, userId);
  }

  @Patch(":id/deactivate")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async deactivateActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.deactivateActivity(id, userId);
  }
}
