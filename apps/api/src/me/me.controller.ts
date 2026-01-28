import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { MeService } from "./me.service";

@UseGuards(FirebaseAuthGuard)
@Controller()
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get("me")
  async me(@Req() req: AuthedRequest) {
    const fb = req.firebase!;
    const result = await this.meService.getOrCreateFromFirebase(fb.uid, fb.email, fb.picture);
    return result; // { user, stats }
  }

  @Patch("me")
  async updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateMeDto) {
    const fb = req.firebase!;
    const user = await this.meService.updateByFirebaseUid(fb.uid, dto);
    return { user };
  }

  @Delete("me")
  async deleteMe(@Req() req: AuthedRequest) {
    const fb = req.firebase!;
    await this.meService.deleteMyAccount(fb.uid);
    return { ok: true };
  }
}
