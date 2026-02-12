import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUser(firebaseUid: string, email?: string, photoUrl?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { deletedAt: true },
    });

    if (existing?.deletedAt) {
      throw new ForbiddenException("Account was deleted.");
    }

    return this.prisma.user.upsert({
      where: { firebaseUid },
      create: {
        firebaseUid,
        email: email ?? null,
      },
      update: {
        email: email ?? undefined,
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
        photoAsset: {
          select: {
            storageKey: true,
            downloadToken: true,
          },
        },
      },
    });
  }
}
