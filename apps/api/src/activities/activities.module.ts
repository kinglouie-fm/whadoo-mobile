import { Module } from "@nestjs/common";
import { ActivityTypeDefinitionsModule } from "../activity-type-definitions/activity-type-definitions.module";
import { AuthModule } from "../auth/auth.module";
import { AvailabilityTemplatesModule } from "../availability-templates/availability-templates.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ActivitiesController } from "./activities.controller";
import { ActivitiesService } from "./activities.service";
import { ActivityOwnerGuard } from "./activity-owner.guard";

@Module({
  imports: [PrismaModule, AuthModule, AvailabilityTemplatesModule, ActivityTypeDefinitionsModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivityOwnerGuard],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
