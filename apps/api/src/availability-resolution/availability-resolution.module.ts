import { Module } from '@nestjs/common';
import { AvailabilityResolutionService } from './availability-resolution.service';
import { AvailabilityResolutionController } from './availability-resolution.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AvailabilityResolutionController],
  providers: [AvailabilityResolutionService],
  exports: [AvailabilityResolutionService],
})
export class AvailabilityResolutionModule {}
