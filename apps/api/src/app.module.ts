import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ActivitiesModule } from "./activities/activities.module";
import { ActivityTypeDefinitionsModule } from "./activity-type-definitions/activity-type-definitions.module";
import { AssetsModule } from "./assets/assets.module";
import { AuthModule } from "./auth/auth.module";
import { AvailabilityTemplatesModule } from "./availability-templates/availability-templates.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { DevModule } from "./dev/dev.module";
import { FirebaseModule } from "./firebase/firebase.module";
import { HealthModule } from "./health/health.module";
import { MeModule } from "./me/me.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SavedActivitiesModule } from "./saved-activities/saved-activities.module";
import { AvailabilityResolutionModule } from "./availability-resolution/availability-resolution.module";
import { BookingsModule } from "./bookings/bookings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    HealthModule,
    DevModule,
    MeModule,
    BusinessesModule,
    AvailabilityTemplatesModule,
    ActivitiesModule,
    ActivityTypeDefinitionsModule,
    SavedActivitiesModule,
    AvailabilityResolutionModule,
    BookingsModule,
    AssetsModule,
  ],
})
export class AppModule {}
