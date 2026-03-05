import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthedRequest } from "./firebase-auth.guard";

/**
 * Loads or provisions the application user for an authenticated Firebase identity.
 */
@Injectable()
export class AppUserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /**
   * Enriches the request with `appUser` for downstream authorization checks.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const fb = req.firebase;
    if (!fb?.uid) throw new UnauthorizedException("Missing Firebase identity");

    const user = await this.authService.getOrCreateUser(
      fb.uid,
      fb.email ?? undefined,
      fb.picture ?? undefined
    );

    // Attach minimal identity data consumed by guards/controllers in this request.
    req.appUser = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      role: user.role as any,
    };

    return true;
  }
}
