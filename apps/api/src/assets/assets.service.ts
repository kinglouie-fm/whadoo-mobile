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

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

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
    const sizeBytes = metadata.size
      ? parseInt(String(metadata.size))
      : dto.sizeBytes;
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

        // Check if activity already has 5 images (will re-check in transaction)
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

    // 5. Download staging file
    const [fileBuffer] = await stagingFile.download();

    // 6. Validate metadata
    const sizeInBytes = metadata.size
      ? parseInt(String(metadata.size))
      : dto.sizeBytes;

    console.log('We are in line 96');

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

    console.log('We are in line 111');

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

    console.log('We are in line 124');

    // 9. Get download token from uploaded file
    const [finalMetadata] = await finalFile.getMetadata();
    const downloadToken = finalMetadata.metadata?.firebaseStorageDownloadTokens;

    console.log('We are in line 129');

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

    console.log('We are in line 149');

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
        const downloadTokenStr = downloadToken ? String(downloadToken) : null;

        // Use transaction to prevent race condition on max 5 images
        await this.prisma.$transaction(async (tx) => {
          // Re-check image count inside transaction
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

          // Find max sort order for this activity
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

    console.log('We are in line 187');

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
