import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ActivityTypeDefinitionsService } from "../activity-type-definitions/activity-type-definitions.service";
import { AvailabilityTemplatesService } from "../availability-templates/availability-templates.service";
import {
  ConflictErrorResponse,
  ErrorCodes,
  PublishValidationError
} from "../common/error-responses";
import { PrismaService } from "../prisma/prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { GroupedCardDto, GroupedCardsResponseDto } from "./dto/grouped-card.dto";
import { RecordSwipeDto } from "./dto/record-swipe.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templatesService: AvailabilityTemplatesService,
    private readonly typeDefinitionsService: ActivityTypeDefinitionsService
  ) {}

  async createActivity(userId: string, dto: CreateActivityDto) {
    // Verify business ownership
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      select: { ownerUserId: true },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this business");
    }

    // Validate type exists
    try {
      await this.typeDefinitionsService.getTypeDefinition(dto.typeId);
    } catch (error) {
      throw new BadRequestException(`Invalid activity type: ${dto.typeId}`);
    }

    // Validate config and pricing against type schema (if provided)
    if (dto.config && Object.keys(dto.config).length > 0) {
      const configValidation = await this.typeDefinitionsService.validateActivityConfig(
        dto.typeId,
        dto.config
      );
      if (!configValidation.valid) {
        throw new BadRequestException({
          message: "Activity configuration validation failed",
          errors: configValidation.errors,
        });
      }
    }

    if (dto.pricing && Object.keys(dto.pricing).length > 0) {
      const pricingValidation = await this.typeDefinitionsService.validateActivityPricing(
        dto.typeId,
        dto.pricing
      );
      if (!pricingValidation.valid) {
        throw new BadRequestException({
          message: "Activity pricing validation failed",
          errors: pricingValidation.errors,
        });
      }
    }

    // Create activity with images
    const activity = await this.prisma.activity.create({
      data: {
        businessId: dto.businessId,
        title: dto.title,
        typeId: dto.typeId,
        description: dto.description ?? null,
        category: dto.category ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        priceFrom: dto.priceFrom ?? null,
        config: dto.config ?? {},
        pricing: dto.pricing ?? {},
        catalogGroupId: dto.catalogGroupId ?? null,
        catalogGroupTitle: dto.catalogGroupTitle ?? null,
        catalogGroupKind: dto.catalogGroupKind ?? null,
        availabilityTemplateId: dto.availabilityTemplateId ?? null,
        status: "draft",
        images: dto.images
          ? {
              create: dto.images.map((img) => ({
                imageUrl: img.imageUrl,
                isThumbnail: img.isThumbnail ?? false,
                sortOrder: img.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    return activity;
  }

  async getActivity(activityId: string, userId?: string, viewAs: "business" | "consumer" = "business") {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        images: true,
        business: {
          select: { ownerUserId: true, name: true },
        },
        availabilityTemplate: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    // Consumer view: only published
    if (viewAs === "consumer") {
      if (activity.status !== "published") {
        throw new NotFoundException("Activity not found");
      }
      return activity;
    }

    // Business view: verify ownership
    if (userId && activity.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this activity");
    }

    return activity;
  }

  async listActivities(userId: string, businessId: string, status?: string) {
    // Verify business ownership
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this business");
    }

    const activities = await this.prisma.activity.findMany({
      where: {
        businessId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        images: {
          where: { isThumbnail: true },
          take: 1,
        },
        _count: {
          select: { images: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return activities;
  }

  async listPublishedActivities(filters?: { city?: string; typeId?: string }) {
    const activities = await this.prisma.activity.findMany({
      where: {
        status: "published",
        ...(filters?.city ? { city: filters.city } : {}),
        ...(filters?.typeId ? { typeId: filters.typeId } : {}),
      },
      include: {
        images: {
          where: { isThumbnail: true },
          take: 1,
        },
        business: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return activities;
  }

  async getGroupedCards(filters?: {
    city?: string;
    typeId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<GroupedCardsResponseDto> {
    const limit = filters?.limit || 20;

    // Fetch published activities with their business and availability template info
    const activities = await this.prisma.activity.findMany({
      where: {
        status: "published",
        ...(filters?.city ? { city: filters.city } : {}),
        ...(filters?.typeId ? { typeId: filters.typeId } : {}),
        business: {
          status: "active",
        },
      },
      include: {
        images: {
          where: { isThumbnail: true },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        availabilityTemplate: {
          select: {
            slotDurationMinutes: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group activities by catalogGroupId or by individual activity if no grouping
    const groupMap = new Map<string, any[]>();

    for (const activity of activities) {
      const groupKey = activity.catalogGroupId || activity.id;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(activity);
    }

    // Build grouped cards
    const groups: GroupedCardDto[] = [];

    for (const [groupKey, groupActivities] of groupMap.entries()) {
      // Sort by priceFrom (nulls last) and then by updatedAt
      groupActivities.sort((a, b) => {
        if (a.priceFrom === null) return 1;
        if (b.priceFrom === null) return -1;
        const priceDiff = Number(a.priceFrom) - Number(b.priceFrom);
        if (priceDiff !== 0) return priceDiff;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      const representativeActivity = groupActivities[0];
      const businessName = representativeActivity.business?.name || "Unknown Business";
      const city = representativeActivity.city || "Unknown";

      // Calculate group-level fields
      const priceFrom = groupActivities.reduce((min, act) => {
        if (act.priceFrom === null) return min;
        const price = Number(act.priceFrom);
        return min === null || price < min ? price : min;
      }, null as number | null) || 0;

      const maxUpdatedAt = groupActivities.reduce((max, act) => {
        return act.updatedAt > max ? act.updatedAt : max;
      }, groupActivities[0].updatedAt);

      // Collect sample durations from availability templates
      const durations = groupActivities
        .map((act) => act.availabilityTemplate?.slotDurationMinutes)
        .filter((d): d is number => d !== null && d !== undefined);
      const uniqueDurations = Array.from(new Set(durations)).sort((a, b) => a - b).slice(0, 3);

      // Get thumbnail
      const thumbnailUrl = representativeActivity.images[0]?.imageUrl || null;

      // Extract tags (for now, just use category if available)
      const tags: string[] = [];
      if (representativeActivity.category) {
        tags.push(representativeActivity.category);
      }

      // Use catalogGroupTitle or fallback to typeId + location
      const catalogGroupTitle = representativeActivity.catalogGroupTitle;
      const typeLabel = catalogGroupTitle || `${representativeActivity.typeId} at ${businessName}`;

      groups.push({
        catalogGroupId: groupKey,
        businessId: representativeActivity.businessId,
        businessName,
        typeId: representativeActivity.typeId,
        typeLabel,
        city,
        locationSummary: `${city}${representativeActivity.address ? ", " + representativeActivity.address : ""}`,
        thumbnailUrl: thumbnailUrl || undefined,
        priceFrom,
        tags,
        activityCount: groupActivities.length,
        sampleDurations: uniqueDurations,
        updatedAt: maxUpdatedAt,
        representativeActivityId: representativeActivity.id,
      });
    }

    // Sort groups by updatedAt descending
    groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Apply cursor-based pagination
    let paginatedGroups = groups;
    if (filters?.cursor) {
      const cursorIndex = groups.findIndex((g) => g.catalogGroupId === filters.cursor);
      if (cursorIndex !== -1) {
        paginatedGroups = groups.slice(cursorIndex + 1);
      }
    }

    // Take limit + 1 to determine if there's a next page
    const hasMore = paginatedGroups.length > limit;
    const resultGroups = paginatedGroups.slice(0, limit);
    const nextCursor = hasMore ? resultGroups[resultGroups.length - 1].catalogGroupId : null;

    return {
      groups: resultGroups,
      nextCursor,
    };
  }

  async updateActivity(activityId: string, userId: string, dto: UpdateActivityDto) {
    // Fetch activity with business
    const existing = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Activity not found");
    }

    // Validate type if being changed
    const typeId = dto.typeId || existing.typeId;
    try {
      await this.typeDefinitionsService.getTypeDefinition(typeId);
    } catch (error) {
      throw new BadRequestException(`Invalid activity type: ${typeId}`);
    }

    // Validate config if provided
    if (dto.config !== undefined) {
      const configToValidate = dto.config && Object.keys(dto.config).length > 0 
        ? dto.config 
        : existing.config;
      
      if (configToValidate && Object.keys(configToValidate).length > 0) {
        const configValidation = await this.typeDefinitionsService.validateActivityConfig(
          typeId,
          configToValidate
        );
        if (!configValidation.valid) {
          throw new BadRequestException({
            message: "Activity configuration validation failed",
            errors: configValidation.errors,
          });
        }
      }
    }

    // Validate pricing if provided
    if (dto.pricing !== undefined) {
      const pricingToValidate = dto.pricing && Object.keys(dto.pricing).length > 0
        ? dto.pricing
        : existing.pricing;
      
      if (pricingToValidate && Object.keys(pricingToValidate).length > 0) {
        const pricingValidation = await this.typeDefinitionsService.validateActivityPricing(
          typeId,
          pricingToValidate
        );
        if (!pricingValidation.valid) {
          throw new BadRequestException({
            message: "Activity pricing validation failed",
            errors: pricingValidation.errors,
          });
        }
      }
    }

    if (existing.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this activity");
    }

    // Prevent changing/unlinking template from published activity
    if (existing.status === "published" && dto.availabilityTemplateId !== undefined) {
      if (
        dto.availabilityTemplateId === null ||
        dto.availabilityTemplateId !== existing.availabilityTemplateId
      ) {
        throw new ConflictErrorResponse(
          ErrorCodes.CANNOT_UNLINK_PUBLISHED,
          "Cannot unlink or change availability template for a published activity. Unpublish the activity first.",
          { field: "availabilityTemplateId" }
        );
      }
    }

    // Prevent changing type from published activity
    if (existing.status === "published" && dto.typeId && dto.typeId !== existing.typeId) {
      throw new ConflictErrorResponse(
        ErrorCodes.CANNOT_CHANGE_TYPE_PUBLISHED,
        "Cannot change activity type for a published activity. Unpublish the activity first.",
        { field: "typeId" }
      );
    }

    // Update activity
    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        title: dto.title,
        typeId: dto.typeId,
        description: dto.description,
        category: dto.category,
        address: dto.address,
        city: dto.city,
        lat: dto.lat,
        lng: dto.lng,
        priceFrom: dto.priceFrom,
        catalogGroupId: dto.catalogGroupId,
        catalogGroupTitle: dto.catalogGroupTitle,
        catalogGroupKind: dto.catalogGroupKind,
        config: dto.config,
        pricing: dto.pricing,
        availabilityTemplateId: dto.availabilityTemplateId,
        images: dto.images
          ? {
              deleteMany: {},
              create: dto.images.map((img) => ({
                imageUrl: img.imageUrl,
                isThumbnail: img.isThumbnail ?? false,
                sortOrder: img.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    return updated;
  }

  async publishActivity(activityId: string, userId: string) {
    // Fetch activity with business
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    if (activity.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this activity");
    }

    // Check required fields
    const missingFields: string[] = [];
    if (!activity.title) missingFields.push("title");
    if (!activity.typeId) missingFields.push("typeId");
    if (!activity.city) missingFields.push("city");

    if (missingFields.length > 0) {
      throw new PublishValidationError(
        ErrorCodes.REQUIRED_FIELDS_MISSING,
        `Missing required fields: ${missingFields.join(", ")}`,
        undefined,
        missingFields
      );
    }

    // Check: availability template is linked
    if (!activity.availabilityTemplateId) {
      throw new PublishValidationError(
        ErrorCodes.TEMPLATE_REQUIRED,
        "Availability template must be linked before publishing.",
        "availabilityTemplateId"
      );
    }

    // Verify template exists and is active
    const template = await this.templatesService.getTemplateById(activity.availabilityTemplateId);

    if (!template) {
      throw new PublishValidationError(
        ErrorCodes.TEMPLATE_NOT_FOUND,
        "Linked availability template does not exist.",
        "availabilityTemplateId"
      );
    }

    if (template.status !== "active") {
      throw new PublishValidationError(
        ErrorCodes.TEMPLATE_INACTIVE,
        "Linked availability template is inactive. Activate or link a different template.",
        "availabilityTemplateId"
      );
    }

    // Validate type exists
    try {
      await this.typeDefinitionsService.getTypeDefinition(activity.typeId);
    } catch (error) {
      throw new PublishValidationError(
        ErrorCodes.INVALID_TYPE,
        `Activity type '${activity.typeId}' is not supported.`,
        "typeId"
      );
    }

    // Validate config against type schema
    const configValidation = await this.typeDefinitionsService.validateActivityConfig(
      activity.typeId,
      activity.config || {}
    );
    if (!configValidation.valid) {
      throw new BadRequestException({
        message: "Activity configuration must be complete before publishing",
        errors: configValidation.errors,
      });
    }

    // Karting-specific package validation
    if (activity.typeId === "karting") {
      this.validateKartingPackages(activity.config);
    }

    // Validate pricing against type schema
    const pricingValidation = await this.typeDefinitionsService.validateActivityPricing(
      activity.typeId,
      activity.pricing || {}
    );
    if (!pricingValidation.valid) {
      throw new BadRequestException({
        message: "Activity pricing must be complete before publishing",
        errors: pricingValidation.errors,
      });
    }

    // Publish activity
    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: { status: "published" },
      include: {
        images: true,
      },
    });

    return updated;
  }

  async unpublishActivity(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    if (activity.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this activity");
    }

    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: { status: "draft" },
      include: {
        images: true,
      },
    });

    return updated;
  }

  async deactivateActivity(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    if (activity.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this activity");
    }

    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: { status: "inactive" },
      include: {
        images: true,
      },
    });

    return updated;
  }

  // Internal helper - no RBAC
  async getActivityWithTemplate(activityId: string) {
    return this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        availabilityTemplate: {
          include: {
            exceptions: true,
          },
        },
      },
    });
  }

  private validateKartingPackages(config: any) {
    const packages = config?.packages;

    // Packages must exist and contain at least 1 item
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      throw new PublishValidationError(
        ErrorCodes.PACKAGES_REQUIRED,
        "Karting activities must have at least one package/formula defined.",
        "config.packages"
      );
    }

    // Validate each package
    const codes = new Set<string>();
    let defaultCount = 0;

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];

      // Required fields: code and title
      if (!pkg.code || typeof pkg.code !== "string" || pkg.code.trim() === "") {
        throw new PublishValidationError(
          ErrorCodes.PACKAGE_CODE_REQUIRED,
          `Package at index ${i} is missing required field: code`,
          `config.packages[${i}].code`
        );
      }

      if (!pkg.title || typeof pkg.title !== "string" || pkg.title.trim() === "") {
        throw new PublishValidationError(
          ErrorCodes.PACKAGE_TITLE_REQUIRED,
          `Package at index ${i} is missing required field: title`,
          `config.packages[${i}].title`
        );
      }

      // Normalize code (lowercase)
      const normalizedCode = pkg.code.toLowerCase().trim();

      // Check for duplicate codes
      if (codes.has(normalizedCode)) {
        throw new PublishValidationError(
          ErrorCodes.PACKAGE_CODE_DUPLICATE,
          `Duplicate package code: "${pkg.code}". Each package must have a unique code.`,
          `config.packages[${i}].code`
        );
      }
      codes.add(normalizedCode);

      // Count defaults
      if (pkg.is_default === true) {
        defaultCount++;
      }
    }

    // Only one default allowed
    if (defaultCount > 1) {
      throw new PublishValidationError(
        ErrorCodes.MULTIPLE_DEFAULT_PACKAGES,
        "Only one package can be marked as default.",
        "config.packages"
      );
    }

    // If no default, auto-set first package as default (or require one - choosing auto-set)
    if (defaultCount === 0) {
      packages[0].is_default = true;
    }

    // Sanitize format_lines (convert multiline string to array)
    for (const pkg of packages) {
      if (pkg.format_lines && typeof pkg.format_lines === "string") {
        pkg.format_lines = pkg.format_lines
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }
    }

    // Ensure stable sort_order
    for (let i = 0; i < packages.length; i++) {
      if (packages[i].sort_order === undefined || packages[i].sort_order === null) {
        packages[i].sort_order = i;
      }
    }
  }

  async recordSwipe(userId: string, dto: RecordSwipeDto) {
    await this.prisma.userSwipe.create({
      data: {
        userId,
        direction: dto.direction,
        catalogGroupId: dto.catalogGroupId ?? null,
        activityId: dto.activityId ?? null,
        city: dto.city ?? null,
        typeId: dto.typeId ?? null,
      },
    });

    return { success: true };
  }

  async debugKartingActivities() {
    const activities = await this.prisma.activity.findMany({
      where: {
        typeId: "karting",
      },
      select: {
        id: true,
        title: true,
        status: true,
        catalogGroupId: true,
        catalogGroupTitle: true,
        availabilityTemplateId: true,
        priceFrom: true,
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        availabilityTemplate: {
          select: {
            slotDurationMinutes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: activities.length,
      published: activities.filter((a) => a.status === "published").length,
      withGroupId: activities.filter((a) => a.catalogGroupId).length,
      activities: activities.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        catalogGroupId: a.catalogGroupId,
        catalogGroupTitle: a.catalogGroupTitle,
        duration: a.availabilityTemplate?.slotDurationMinutes,
        priceFrom: a.priceFrom,
        businessStatus: a.business?.status,
      })),
    };
  }

  async getActivitiesByGroup(catalogGroupId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        catalogGroupId,
        status: "published",
        business: {
          status: "active",
        },
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            images: true,
          },
        },
        availabilityTemplate: {
          select: {
            id: true,
            name: true,
            slotDurationMinutes: true,
            capacity: true,
            daysOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { priceFrom: "asc" },
        { updatedAt: "desc" },
      ],
    });

    if (activities.length === 0) {
      throw new NotFoundException("No activities found in this group");
    }

    return {
      catalogGroupId,
      catalogGroupTitle: activities[0].catalogGroupTitle,
      businessName: activities[0].business?.name,
      businessCity: activities[0].business?.city,
      businessAddress: activities[0].business?.address,
      businessImages: activities[0].business?.images || [],
      activities: activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        typeId: activity.typeId,
        priceFrom: activity.priceFrom,
        config: activity.config,
        pricing: activity.pricing,
        images: activity.images,
        duration: activity.availabilityTemplate?.slotDurationMinutes,
        capacity: activity.availabilityTemplate?.capacity,
        availabilityTemplate: activity.availabilityTemplate,
      })),
    };
  }
}
