import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getOrCreateFromFirebase(firebaseUid: string, email?: string | null, picture?: string | null) {
    return this.authService.getOrCreateUser(firebaseUid, email ?? undefined, picture ?? undefined);
  }

  async updateByFirebaseUid(firebaseUid: string, dto: UpdateMeDto) {
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
}
