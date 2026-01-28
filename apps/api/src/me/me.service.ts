import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { admin } from "../auth/firebase-admin";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getOrCreateFromFirebase(firebaseUid: string, email?: string | null, picture?: string | null) {
    const user = await this.authService.getOrCreateUser(
      firebaseUid,
      email ?? undefined,
      picture ?? undefined
    );

    // bookings aren’t built yet — keep 0 for now
    const stats = { totalBookings: 0 };

    return { user, stats };
  }

  async updateByFirebaseUid(firebaseUid: string, dto: UpdateMeDto) {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { deletedAt: true },
    });
    if (!existing) throw new NotFoundException("User not found");
    if (existing.deletedAt) throw new ForbiddenException("Account was deleted.");

    return this.prisma.user.update({
      where: { firebaseUid },
      data: {
        firstName: dto.firstName ?? undefined,
        lastName: dto.lastName ?? undefined,
        phoneNumber: dto.phoneNumber ?? undefined,
        city: dto.city ?? undefined,
        photoUrl: dto.photoUrl ?? undefined,
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

  async deleteMyAccount(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, role: true, deletedAt: true },
    });

    if (!user) return; // already gone in DB
    if (user.deletedAt) return;

    if (user.role === "business") {
      throw new ForbiddenException(
        "Business accounts can’t be deleted in-app. Please email support."
      );
    }

    // 1) delete Firebase user
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch (e: any) {
      // If already deleted in Firebase, continue
      if (e?.errorInfo?.code !== "auth/user-not-found") {
        throw e;
      }
    }

    // 2) soft-delete + scrub PII in Postgres
    await this.prisma.user.update({
      where: { firebaseUid },
      data: {
        deletedAt: new Date(),
        email: null,
        firstName: null,
        lastName: null,
        city: null,
        phoneNumber: null,
        photoUrl: null,
      },
    });
  }
}