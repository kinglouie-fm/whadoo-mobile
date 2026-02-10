import { Module } from "@nestjs/common";
import { AppUserGuard } from "./app-user.guard";
import { AuthService } from "./auth.service";
import { BusinessOwnerGuard } from "./business-owner.guard";
import { FirebaseAuthGuard } from "./firebase-auth.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  providers: [AuthService, FirebaseAuthGuard, AppUserGuard, RolesGuard, BusinessOwnerGuard],
  exports: [AuthService, FirebaseAuthGuard, AppUserGuard, RolesGuard, BusinessOwnerGuard],
})
export class AuthModule {}
