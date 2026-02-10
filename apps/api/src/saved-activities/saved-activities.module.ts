import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SavedActivitiesController } from './saved-activities.controller';
import { SavedActivitiesService } from './saved-activities.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SavedActivitiesController],
  providers: [SavedActivitiesService],
  exports: [SavedActivitiesService],
})
export class SavedActivitiesModule {}
