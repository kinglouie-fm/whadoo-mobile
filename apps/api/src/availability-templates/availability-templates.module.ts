import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AvailabilityTemplatesController } from "./availability-templates.controller";
import { AvailabilityTemplatesService } from "./availability-templates.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AvailabilityTemplatesController],
  providers: [AvailabilityTemplatesService],
  exports: [AvailabilityTemplatesService],
})
export class AvailabilityTemplatesModule {}
