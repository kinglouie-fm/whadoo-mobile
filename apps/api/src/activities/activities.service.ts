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
}
