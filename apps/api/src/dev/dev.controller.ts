import { Body, Controller, ForbiddenException, Headers, Post } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Development-only maintenance endpoints.
 */
@Controller("dev")
export class DevController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Promotes a user to `business` role behind a dev-only shared secret.
   */
  @Post("promote")
  async promote(
    @Headers("x-dev-secret") secret: string | undefined,
    @Body() body: { firebaseUid: string }
  ) {
    // Hard stop for production to avoid privileged runtime mutation.
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Disabled in production");
    }
    // Shared secret gate for local/staging admin operations.
    if (!secret || secret !== process.env.DEV_ADMIN_SECRET) {
      throw new ForbiddenException("Bad secret");
    }

    const user = await this.prisma.user.update({
      where: { firebaseUid: body.firebaseUid },
      data: { role: "business" },
      select: { id: true, firebaseUid: true, role: true },
    });

    return { user };
  }
}
