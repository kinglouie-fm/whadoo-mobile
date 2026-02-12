import { Controller, Post, Body, UseGuards, Param, Req } from "@nestjs/common";
import { AppUserGuard } from "../auth/app-user.guard";
import { AuthService } from "../auth/auth.service";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { AssetsService } from "./assets.service";

@Controller("assets")
@UseGuards(FirebaseAuthGuard, AppUserGuard, RolesGuard)
export class AssetsController {
  constructor(
    private assetsService: AssetsService,
    private authService: AuthService,
  ) {}

  private async currentDbUser(req: AuthedRequest) {
    const fb = req.firebase!;
    return this.authService.getOrCreateUser(fb.uid, fb.email ?? undefined, fb.picture ?? undefined);
  }

  @Post("finalize")
  async finalize(@Req() req: AuthedRequest, @Body() body: any) {
    const user = await this.currentDbUser(req);
    return this.assetsService.finalizeUpload(user.id, body);
  }
}
