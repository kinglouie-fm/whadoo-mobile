import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AvailabilityTemplatesModule } from "../availability-templates/availability-templates.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ActivitiesController } from "./activities.controller";
import { ActivitiesService } from "./activities.service";

@Module({
  imports: [PrismaModule, AuthModule, AvailabilityTemplatesModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
