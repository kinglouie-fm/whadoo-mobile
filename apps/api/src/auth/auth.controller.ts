import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthedRequest, FirebaseAuthGuard } from "./firebase-auth.guard";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get("me")
  async me(@Req() req: AuthedRequest) {
    const fb = req.firebase!;
    const user = await this.authService.getOrCreateUser(fb.uid, fb.email, fb.picture);
    return { user };
  }
}
