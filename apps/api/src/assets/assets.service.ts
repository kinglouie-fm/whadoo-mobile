import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as sharp from 'sharp';
import { admin } from '../auth/firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

import { v4 as uuidv4 } from 'uuid';

interface FinalizeUploadDto {
  storageKey: string;
  contentType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  context: {
    type: 'user_avatar' | 'business_logo' | 'activity_image';
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
      throw new BadRequestException('User not found');
    }

    // 2. Verify staging path
    if (!dto.storageKey.startsWith(`staging/${user.firebaseUid}/`)) {
      throw new ForbiddenException('Invalid storage path');
    }

    // 3. Verify file exists and get metadata
    const bucket = admin.storage().bucket();
    const stagingFile = bucket.file(dto.storageKey);
    const [exists] = await stagingFile.exists();
    if (!exists) {
      throw new BadRequestException('File not found in storage');
    }

    const [metadata] = await stagingFile.getMetadata();
    const contentType = metadata.contentType || dto.contentType;

    // Validate it's an image
    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validate file size (10MB max)
    const sizeBytes = metadata.size ? parseInt(String(metadata.size)) : dto.sizeBytes;
    if (sizeBytes && sizeBytes > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // 4. Determine target size and final path
    let targetSize: number;
    let finalPath: string;
    const uuid = uuidv4();

    switch (dto.context.type) {
      case 'user_avatar':
        targetSize = 300;
        finalPath = `users/${userId}/thumbs/avatar_${uuid}_300x300.jpg`;
        break;
      case 'business_logo':
        await this.verifyBusinessOwnership(userId, dto.context.entityId!);
        targetSize = 300;
        finalPath = `businesses/${dto.context.entityId}/thumbs/logo_${uuid}_300x300.jpg`;
        break;
      case 'activity_image':
        await this.verifyActivityOwnership(userId, dto.context.entityId!);
        targetSize = 900;
        finalPath = `activities/${dto.context.entityId}/medium/img_${uuid}_900x900.jpg`;
        break;
      default:
        throw new BadRequestException('Invalid context type');
    }

    // 5. Download staging file
    const [fileBuffer] = await stagingFile.download();

    // 6. Validate metadata
    const sizeInBytes = metadata.size ? parseInt(String(metadata.size)) : dto.sizeBytes;

    // 7. Process image: resize, crop, compress
    const processedBuffer = await sharp(fileBuffer)
      .resize(targetSize, targetSize, {
        fit: 'cover', // center-crop to fill square
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .withMetadata({ orientation: undefined }) // Strip EXIF
      .toBuffer();

    // 8. Upload processed image to final path
    const finalFile = bucket.file(finalPath);
    await finalFile.save(processedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(), // Generate download token
        },
      },
    });

    // 9. Get download token from uploaded file
    const [finalMetadata] = await finalFile.getMetadata();
    const downloadToken = finalMetadata.metadata?.firebaseStorageDownloadTokens;

    // 10. Create Asset record
    const asset = await this.prisma.asset.create({
      data: {
        storageKey: finalPath,
        downloadToken: downloadToken ? String(downloadToken) : null,
        contentType: 'image/jpeg',
        sizeBytes: processedBuffer.length,
        width: targetSize,
        height: targetSize,
        userId: dto.context.type === 'user_avatar' ? userId : undefined,
        businessId:
          dto.context.type === 'business_logo'
            ? dto.context.entityId
            : undefined,
      },
    });

    // 11. Link asset to entity
    switch (dto.context.type) {
      case 'user_avatar':
        await this.prisma.user.update({
          where: { id: userId },
          data: { photoAssetId: asset.id },
        });
        break;
      case 'business_logo':
        await this.prisma.business.update({
          where: { id: dto.context.entityId },
          data: { logoAssetId: asset.id },
        });
        break;
      case 'activity_image':
        // Find max sort order for this activity
        const maxSort = await this.prisma.activityImage.findFirst({
          where: { activityId: dto.context.entityId! },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });
        const nextSortOrder = (maxSort?.sortOrder ?? -1) + 1;

        const downloadTokenStr = downloadToken ? String(downloadToken) : null;
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

    // 12. Delete staging file
    try {
      await stagingFile.delete();
    } catch (error) {
      // Log but don't fail if staging cleanup fails
      console.warn('Failed to delete staging file:', dto.storageKey, error);
    }

    const downloadTokenStr = downloadToken ? String(downloadToken) : null;
    return {
      assetId: asset.id,
      publicURL: this.buildPublicURL(finalPath, downloadTokenStr),
    };
  }

  private buildPublicURL(storageKey: string, token: string | null): string {
    const bucket = admin.storage().bucket();
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageKey)}?alt=media&token=${token || ''}`;
  }

  private async verifyBusinessOwnership(userId: string, businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerUserId: userId },
    });
    if (!business) {
      throw new ForbiddenException('Not your business');
    }
  }

  private async verifyActivityOwnership(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, business: { ownerUserId: userId } },
    });
    if (!activity) {
      throw new ForbiddenException('Not your activity');
    }
  }
}
