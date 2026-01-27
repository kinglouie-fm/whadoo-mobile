import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUser(firebaseUid: string, email?: string, photoUrl?: string) {
    // Upsert makes first login create the row.
    return this.prisma.user.upsert({
      where: { firebaseUid },
      create: {
        firebaseUid,
        email: email ?? null,
        photoUrl: photoUrl ?? null,
        // role defaults to user per schema
      },
      update: {
        // Keep email/photo up to date if you want
        email: email ?? undefined,
        photoUrl: photoUrl ?? undefined,
      },
      select: {
        id: true,
        firebaseUid: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        city: true,
        phoneNumber: true,
        photoUrl: true,
      },
    });
  }
}
