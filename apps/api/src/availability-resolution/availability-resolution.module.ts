import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AvailabilityResolutionController } from './availability-resolution.controller';
import { AvailabilityResolutionService } from './availability-resolution.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AvailabilityResolutionController],
  providers: [AvailabilityResolutionService],
  exports: [AvailabilityResolutionService],
})
export class AvailabilityResolutionModule {}
