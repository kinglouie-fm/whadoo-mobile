import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  private businessSelect = {
    id: true,
    ownerUserId: true,
    name: true,
    description: true,
    category: true,
    contactPhone: true,
    contactEmail: true,
    address: true,
    city: true,
    status: true,
    logoAsset: {
      select: {
        storageKey: true,
        downloadToken: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  };

  async getMyBusiness(ownerUserId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerUserId },
      select: this.businessSelect,
    });

    return business; // can be null
  }

  /**
   * MVP behavior:
   * - If user already has a business, return it.
   * - Otherwise create it.
   * - Also promote user role to "business".
   */
  async createMyBusiness(ownerUserId: string, dto: CreateBusinessDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.business.findFirst({
        where: { ownerUserId },
        select: this.businessSelect,
      });

      if (existing) return existing;

      const created = await tx.business.create({
        data: {
          ownerUserId,
          name: dto.name,
          description: dto.description ?? null,
          category: dto.category ?? null,
          contactPhone: dto.contactPhone ?? null,
          contactEmail: dto.contactEmail ?? null,
          address: dto.address ?? null,
          city: dto.city ?? null,
        },
        select: this.businessSelect,
      });

      // Promote role for MVP (so RouteGuard routes into business tabs)
      await tx.user.update({
        where: { id: ownerUserId },
        data: { role: "business" },
      });

      return created;
    });
  }

  async updateMyBusiness(ownerUserId: string, dto: UpdateBusinessDto) {
    const existing = await this.prisma.business.findFirst({
      where: { ownerUserId },
      select: { id: true },
    });

    if (!existing) {
      throw new ForbiddenException("Business not found. Create a business first.");
    }

    // Map 'location' to 'address' if provided
    const addressValue = dto.location !== undefined ? dto.location : dto.address;

    return this.prisma.business.update({
      where: { id: existing.id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        category: dto.category ?? undefined,
        contactPhone: dto.contactPhone ?? undefined,
        contactEmail: dto.contactEmail ?? undefined,
        address: addressValue ?? undefined,
        city: dto.city ?? undefined,
      },
      select: this.businessSelect,
    });
  }

  async updateBusiness(ownerUserId: string, businessId: string, dto: UpdateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!existing) {
      // Prisma throws if you try to update missing record; this is clearer
      throw new ForbiddenException("Business not found or not accessible.");
    }

    if (existing.ownerUserId !== ownerUserId) {
      throw new ForbiddenException("You do not own this business.");
    }

    // Map 'location' to 'address' if provided
    const addressValue = dto.location !== undefined ? dto.location : dto.address;

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        category: dto.category ?? undefined,
        contactPhone: dto.contactPhone ?? undefined,
        contactEmail: dto.contactEmail ?? undefined,
        address: addressValue ?? undefined,
        city: dto.city ?? undefined,
      },
      select: this.businessSelect,
    });
  }
}
