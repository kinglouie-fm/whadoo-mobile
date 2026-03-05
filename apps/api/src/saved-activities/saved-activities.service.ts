import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Saved-activity persistence with idempotent save/unsave semantics.
 */
@Injectable()
export class SavedActivitiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Saves an activity for a user and snapshots display fields for list performance.
   */
  async saveActivity(userId: string, activityId: string) {
    // Validate activity exists and is published
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        images: {
          where: { isThumbnail: true },
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Create snapshot
    const snapshot = {
      title: activity.title,
      thumbnailUrl: activity.images[0]?.imageUrl || null,
      city: activity.city,
      priceFrom: activity.priceFrom,
      businessId: activity.businessId,
      catalogGroupId: activity.catalogGroupId,
      catalogGroupTitle: activity.catalogGroupTitle,
      catalogGroupKind: activity.catalogGroupKind,
    };

    // Upsert keeps save operation idempotent across repeated taps.
    const saved = await this.prisma.savedActivity.upsert({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
      create: {
        userId,
        activityId,
        activitySnapshot: snapshot,
      },
      update: {
        savedAt: new Date(),
        activitySnapshot: snapshot,
      },
    });

    return {
      success: true,
      saved: {
        activityId: saved.activityId,
        savedAt: saved.savedAt,
        snapshot: saved.activitySnapshot,
      },
    };
  }

  /**
   * Removes a saved activity relation without failing if it is already absent.
   */
  async unsaveActivity(userId: string, activityId: string) {
    // Idempotent delete - no error if not exists
    await this.prisma.savedActivity.deleteMany({
      where: {
        userId,
        activityId,
      },
    });

    return { success: true };
  }

  /**
   * Lists a user's saved activities with timestamp-based cursor pagination.
   */
  async listSavedActivities(
    userId: string,
    options?: { limit?: number; cursor?: string }
  ) {
    const limit = options?.limit || 50;

    const where: any = { userId };
    if (options?.cursor) {
      // Cursor is ISO timestamp from `savedAt`; fetch strictly older saves.
      where.savedAt = {
        lt: new Date(options.cursor),
      };
    }

    const savedActivities = await this.prisma.savedActivity.findMany({
      where,
      orderBy: { savedAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there's more
    });

    const hasMore = savedActivities.length > limit;
    const results = savedActivities.slice(0, limit);

    return {
      items: results.map((saved) => ({
        activityId: saved.activityId,
        savedAt: saved.savedAt,
        snapshot: saved.activitySnapshot as any,
      })),
      nextCursor: hasMore ? results[results.length - 1].savedAt.toISOString() : null,
    };
  }

  /**
   * Bulk-deletes saved activity relations for a user.
   */
  async bulkDelete(userId: string, activityIds: string[]) {
    const result = await this.prisma.savedActivity.deleteMany({
      where: {
        userId,
        activityId: {
          in: activityIds,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }

  /**
   * Returns whether a user has saved a given activity.
   */
  async isSaved(userId: string, activityId: string): Promise<boolean> {
    const saved = await this.prisma.savedActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    });

    return !!saved;
  }
}
