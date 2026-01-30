import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ActivityTypeDefinitionsService } from "../activity-type-definitions/activity-type-definitions.service";
import { AvailabilityTemplatesService } from "../availability-templates/availability-templates.service";
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

    // Validation: required fields
    if (!activity.title) {
      throw new BadRequestException("Title is required to publish");
    }

    // Validate type exists
    try {
      await this.typeDefinitionsService.getTypeDefinition(activity.typeId);
    } catch (error) {
      throw new BadRequestException(`Invalid activity type: ${activity.typeId}`);
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

    if (!activity.typeId) {
      throw new BadRequestException("Type is required to publish");
    }

    if (!activity.city) {
      throw new BadRequestException("City is required to publish");
    }

    if (!activity.availabilityTemplateId) {
      throw new BadRequestException("Availability template is required to publish");
    }

    // Verify template exists and is active
    const template = await this.templatesService.getTemplateById(activity.availabilityTemplateId);

    if (!template) {
      throw new BadRequestException("Linked availability template not found");
    }

    if (template.status !== "active") {
      throw new BadRequestException("Linked availability template is not active");
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
