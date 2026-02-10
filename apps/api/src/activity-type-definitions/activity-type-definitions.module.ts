import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ActivityTypeDefinitionsController } from "./activity-type-definitions.controller";
import { ActivityTypeDefinitionsService } from "./activity-type-definitions.service";

@Module({
  imports: [PrismaModule],
  controllers: [ActivityTypeDefinitionsController],
  providers: [ActivityTypeDefinitionsService],
  exports: [ActivityTypeDefinitionsService],
})
export class ActivityTypeDefinitionsModule {}
