import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { AvailabilityTemplatesModule } from "./availability-templates/availability-templates.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { DevModule } from "./dev/dev.module";
import { FirebaseModule } from "./firebase/firebase.module";
import { HealthModule } from "./health/health.module";
import { MeModule } from "./me/me.module";
import { PrismaModule } from "./prisma/prisma.module";

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
  ],
})
export class AppModule {}
