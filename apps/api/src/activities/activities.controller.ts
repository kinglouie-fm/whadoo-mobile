import {
  Body,
  Controller,
  Delete,
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
import { RecordSwipeDto } from "./dto/record-swipe.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

/**
 * HTTP endpoints for activity management and discovery flows.
 */
@Controller("activities")
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  /**
   * Creates a new activity for the authenticated business user.
   */
  @Post()
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async createActivity(@Req() req: AuthedRequest, @Body() dto: CreateActivityDto) {
    // `appUser` is attached by `AppUserGuard` after Firebase authentication succeeds.
    const userId = req.appUser!.id;
    return this.service.createActivity(userId, dto);
  }

  /**
   * Lists activities for a business, optionally filtered by status.
   */
  @Get("business/:businessId")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async listActivities(
    @Req() req: AuthedRequest,
    @Param("businessId") businessId: string,
    @Query("status") status?: string
  ) {
    // Guard-populated business identity is used for access control in the service layer.
    const userId = req.appUser!.id;
    return this.service.listActivities(userId, businessId, status);
  }

  /**
   * Lists published activities available to consumers.
   */
  @Get("published")
  async listPublishedActivities(@Query("city") city?: string, @Query("typeId") typeId?: string) {
    return this.service.listPublishedActivities({ city, typeId });
  }

  /**
   * Returns grouped activity cards with cursor-based pagination inputs.
   */
  @Get("grouped-cards")
  async getGroupedCards(
    @Query("city") city?: string,
    @Query("typeId") typeId?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string
  ) {
    return this.service.getGroupedCards({
      city,
      typeId,
      // Query params are strings; normalize `limit` to a number when provided.
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Debug endpoint for validating karting activity data.
   */
  @Get("debug/karting")
  async debugKarting() {
    const activities = await this.service.debugKartingActivities();
    return activities;
  }

  /**
   * Lists activities assigned to a specific catalog group.
   */
  @Get("group/:catalogGroupId")
  async getActivitiesByGroup(
    @Param("catalogGroupId") catalogGroupId: string,
    @Query("businessId") businessId?: string,
  ) {
    return this.service.getActivitiesByGroup(catalogGroupId, businessId);
  }

  /**
   * Returns an activity in business context for the authenticated user.
   */
  @Get(":id")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async getActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    // Business context enforces ownership/visibility rules for authenticated operators.
    const userId = req.appUser!.id;
    return this.service.getActivity(id, userId, "business");
  }

  /**
   * Returns an activity in consumer context without business authentication.
   */
  @Get("consumer/:id")
  async getActivityConsumer(@Param("id") id: string) {
    return this.service.getActivity(id, undefined, "consumer");
  }

  /**
   * Updates an existing activity owned by the authenticated business user.
   */
  @Put(":id")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async updateActivity(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateActivityDto
  ) {
    // User identity comes from guards and is used for write authorization.
    const userId = req.appUser!.id;
    return this.service.updateActivity(id, userId, dto);
  }

  /**
   * Publishes an activity so it can appear in consumer-facing discovery.
   */
  @Patch(":id/publish")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async publishActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.publishActivity(id, userId);
  }

  /**
   * Unpublishes an activity from consumer-facing discovery.
   */
  @Patch(":id/unpublish")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async unpublishActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.unpublishActivity(id, userId);
  }

  /**
   * Deactivates an activity without deleting it.
   */
  @Patch(":id/deactivate")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async deactivateActivity(@Req() req: AuthedRequest, @Param("id") id: string) {
    const userId = req.appUser!.id;
    return this.service.deactivateActivity(id, userId);
  }

  /**
   * Records a consumer swipe interaction for recommendation/ranking signals.
   */
  @Post("swipe")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async recordSwipe(@Req() req: AuthedRequest, @Body() dto: RecordSwipeDto) {
    const userId = req.appUser!.id;
    return this.service.recordSwipe(userId, dto);
  }

  /**
   * Deletes a single image from an activity after ownership checks.
   */
  @Delete(":activityId/images/:imageId")
  @UseGuards(FirebaseAuthGuard, AppUserGuard)
  async deleteActivityImage(
    @Req() req: AuthedRequest,
    @Param("activityId") activityId: string,
    @Param("imageId") imageId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.deleteActivityImage(userId, activityId, imageId);
  }
}
