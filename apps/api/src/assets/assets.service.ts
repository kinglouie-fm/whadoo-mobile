import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { admin } from '../auth/firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
} as const;

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

/**
 * Handles image staging, processing, and asset linking to application entities.
 */
@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validates and stores a raw image in user-scoped staging storage.
   */
  async uploadToStaging(
    user: { id: string; firebaseUid: string },
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_FILE_TYPE',
        message: `Invalid file type "${file.mimetype}". Allowed: JPEG, PNG, GIF, WebP`,
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds 10MB limit',
      });
    }

    const ext = ALLOWED_MIME_TYPES[file.mimetype];
    const filename = `${uuidv4()}.${ext}`;
    const storageKey = `staging/${user.firebaseUid}/${filename}`;

    const bucket = admin.storage().bucket();
    const storageFile = bucket.file(storageKey);

    await storageFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    return {
      storageKey,
      contentType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  /**
   * Moves a staged image to its final location, persists metadata, and links records.
   */
  async finalizeUpload(userId: string, dto: FinalizeUploadDto) {
    // Resolve firebase uid to enforce user-scoped staging path ownership.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firebaseUid: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Prevent finalizing files outside the caller's staging prefix.
    if (!dto.storageKey.startsWith(`staging/${user.firebaseUid}/`)) {
      throw new ForbiddenException('Invalid storage path');
    }

    // Read canonical metadata from storage before processing.
    const bucket = admin.storage().bucket();
    const stagingFile = bucket.file(dto.storageKey);
    const [exists] = await stagingFile.exists();
    if (!exists) {
      throw new BadRequestException('File not found in storage');
    }

    const [metadata] = await stagingFile.getMetadata();
    const contentType = metadata.contentType || dto.contentType;

    // Finalized assets are image-only.
    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Enforce hard size limit even if client metadata is missing or incorrect.
    const sizeBytes = metadata.size
      ? parseInt(String(metadata.size))
      : dto.sizeBytes;
    if (sizeBytes && sizeBytes > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Target path and resize strategy are context-specific.
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

        // Fast-fail before processing; transaction re-check below handles races.
        const imageCount = await this.prisma.activityImage.count({
          where: { activityId: dto.context.entityId! },
        });
        if (imageCount >= 5) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'MAX_IMAGES_REACHED',
            message: 'Activity already has 5 images (maximum allowed)',
          });
        }

        targetSize = 900;
        finalPath = `activities/${dto.context.entityId}/medium/img_${uuid}_900x900.jpg`;
        break;
      default:
        throw new BadRequestException('Invalid context type');
    }

    // Download source bytes after ownership and context checks pass.
    const [fileBuffer] = await stagingFile.download();

    const sizeInBytes = metadata.size
      ? parseInt(String(metadata.size))
      : dto.sizeBytes;

    // Normalize uploaded images to a square JPEG profile.
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

    // Persist processed output to the final storage location.
    const finalFile = bucket.file(finalPath);
    await finalFile.save(processedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(), // Generate download token
        },
      },
    });

    // Read generated download token for public URL construction.
    const [finalMetadata] = await finalFile.getMetadata();
    const downloadToken = finalMetadata.metadata?.firebaseStorageDownloadTokens;

    // Persist shared asset metadata independently from entity linkage.
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

    // Link the created asset to the target entity.
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
        const downloadTokenStr = downloadToken ? String(downloadToken) : null;

        // Transaction prevents concurrent uploads from exceeding image cap.
        await this.prisma.$transaction(async (tx) => {
          // Re-check inside transaction to close time-of-check/time-of-use gap.
          const imageCount = await tx.activityImage.count({
            where: { activityId: dto.context.entityId! },
          });
          if (imageCount >= 5) {
            throw new BadRequestException({
              statusCode: 400,
              error: 'MAX_IMAGES_REACHED',
              message: 'Activity already has 5 images (maximum allowed)',
            });
          }

          // Append new image at the end of existing sort order.
          const maxSort = await tx.activityImage.findFirst({
            where: { activityId: dto.context.entityId! },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
          });
          const nextSortOrder = (maxSort?.sortOrder ?? -1) + 1;

          await tx.activityImage.create({
            data: {
              activityId: dto.context.entityId!,
              assetId: asset.id,
              isThumbnail: dto.context.isThumbnail || false,
              imageUrl: this.buildPublicURL(finalPath, downloadTokenStr),
              sortOrder: nextSortOrder,
            },
          });
        });
        break;
    }

    // Best-effort cleanup; finalized asset remains valid if this fails.
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

  /**
   * Builds a Firebase Storage media URL for an asset object path and token.
   */
  private buildPublicURL(storageKey: string, token: string | null): string {
    const bucket = admin.storage().bucket();
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageKey)}?alt=media&token=${token || ''}`;
  }

  /**
   * Ensures the caller owns the business before asset linkage.
   */
  private async verifyBusinessOwnership(userId: string, businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerUserId: userId },
    });
    if (!business) {
      throw new ForbiddenException('Not your business');
    }
  }

  /**
   * Ensures the caller owns the activity before asset linkage.
   */
  private async verifyActivityOwnership(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, business: { ownerUserId: userId } },
    });
    if (!activity) {
      throw new ForbiddenException('Not your activity');
    }
  }
}
