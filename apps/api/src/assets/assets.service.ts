import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { admin } from "../auth/firebase-admin";

interface FinalizeUploadDto {
  storageKey: string;
  contentType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  context: {
    type: "user_avatar" | "business_logo" | "activity_image";
    entityId?: string;
    isThumbnail?: boolean;
  };
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async finalizeUpload(userId: string, dto: FinalizeUploadDto) {
    // 1. Extract firebaseUid from userId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firebaseUid: true },
    });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    // 2. Verify staging path
    if (!dto.storageKey.startsWith(`staging/${user.firebaseUid}/`)) {
      throw new ForbiddenException("Invalid storage path");
    }

    // 3. Verify file exists
    const bucket = admin.storage().bucket();
    const stagingFile = bucket.file(dto.storageKey);
    const [exists] = await stagingFile.exists();
    if (!exists) {
      throw new BadRequestException("File not found in storage");
    }

    // 4. Determine final path
    let finalPath: string;
    switch (dto.context.type) {
      case "user_avatar":
        finalPath = `users/${userId}/avatar_${Date.now()}.jpg`;
        break;
      case "business_logo":
        await this.verifyBusinessOwnership(userId, dto.context.entityId!);
        finalPath = `businesses/${dto.context.entityId}/logo_${Date.now()}.jpg`;
        break;
      case "activity_image":
        await this.verifyActivityOwnership(userId, dto.context.entityId!);
        finalPath = `activities/${dto.context.entityId}/${Date.now()}.jpg`;
        break;
      default:
        throw new BadRequestException("Invalid context type");
    }

    // 5. Move file from staging to final path
    await stagingFile.move(finalPath);

    // 6. Get download token
    const finalFile = bucket.file(finalPath);
    const [metadata] = await finalFile.getMetadata();
    const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens;
    const downloadTokenStr = downloadToken ? String(downloadToken) : null;

    // 7. Create Asset record
    const asset = await this.prisma.asset.create({
      data: {
        storageKey: finalPath,
        downloadToken: downloadTokenStr,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes,
        width: dto.width,
        height: dto.height,
        userId: dto.context.type === "user_avatar" ? userId : undefined,
        businessId:
          dto.context.type === "business_logo"
            ? dto.context.entityId
            : undefined,
      },
    });

    // 8. Link to entity
    switch (dto.context.type) {
      case "user_avatar":
        await this.prisma.user.update({
          where: { id: userId },
          data: { photoAssetId: asset.id },
        });
        break;
      case "business_logo":
        await this.prisma.business.update({
          where: { id: dto.context.entityId },
          data: { logoAssetId: asset.id },
        });
        break;
      case "activity_image":
        // Find max sort order for this activity
        const maxSort = await this.prisma.activityImage.findFirst({
          where: { activityId: dto.context.entityId! },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        const nextSortOrder = (maxSort?.sortOrder ?? -1) + 1;

        await this.prisma.activityImage.create({
          data: {
            activityId: dto.context.entityId!,
            assetId: asset.id,
            isThumbnail: dto.context.isThumbnail || false,
            imageUrl: this.buildPublicURL(finalPath, downloadTokenStr),
            sortOrder: nextSortOrder,
          },
        });
        break;
    }

    return {
      asset,
      publicURL: this.buildPublicURL(finalPath, downloadTokenStr),
    };
  }

  buildPublicURL(storageKey: string, token: string | null): string {
    const bucket = admin.storage().bucket();
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageKey)}?alt=media&token=${token || ""}`;
  }

  private async verifyBusinessOwnership(userId: string, businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerUserId: userId },
    });
    if (!business) {
      throw new ForbiddenException("Not your business");
    }
  }

  private async verifyActivityOwnership(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, business: { ownerUserId: userId } },
    });
    if (!activity) {
      throw new ForbiddenException("Not your activity");
    }
  }

  async updateVariants(assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset) return;

    const bucket = admin.storage().bucket();
    const basePath = asset.storageKey;

    // Check for variants generated by extension
    const variants = {
      thumb: await this.findVariant(bucket, basePath, "200x200"),
      medium: await this.findVariant(bucket, basePath, "800x800"),
      hero: await this.findVariant(bucket, basePath, "1600x1600"),
    };

    // Only update if at least one variant exists
    if (variants.thumb || variants.medium || variants.hero) {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { variants },
      });
    }

    return variants;
  }

  private async findVariant(bucket: any, basePath: string, size: string) {
    const variantPath = `variants/${basePath}_${size}`;
    const file = bucket.file(variantPath);
    const [exists] = await file.exists();

    if (!exists) return null;

    const [metadata] = await file.getMetadata();
    const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens;
    return {
      storageKey: variantPath,
      downloadToken: downloadToken ? String(downloadToken) : null,
      width: parseInt(size.split("x")[0]),
      height: parseInt(size.split("x")[1]),
    };
  }
}
