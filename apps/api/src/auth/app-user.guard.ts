import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthedRequest } from "./firebase-auth.guard";

@Injectable()
export class AppUserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const fb = req.firebase;
    if (!fb?.uid) throw new UnauthorizedException("Missing Firebase identity");

    const user = await this.authService.getOrCreateUser(
      fb.uid,
      fb.email ?? undefined,
      fb.picture ?? undefined
    );

    // attach minimal user info for later guards/controllers
    req.appUser = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      role: user.role as any,
    };

    return true;
  }
}
