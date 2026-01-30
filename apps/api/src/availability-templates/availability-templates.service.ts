import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ConflictErrorResponse, ErrorCodes } from "../common/error-responses";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";

@Injectable()
export class AvailabilityTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTemplate(dto: CreateTemplateDto | UpdateTemplateDto) {
    // Validate days of week
    if (dto.daysOfWeek) {
      if (dto.daysOfWeek.length === 0) {
        throw new BadRequestException("daysOfWeek must contain at least one day");
      }
      for (const day of dto.daysOfWeek) {
        if (day < 1 || day > 7) {
          throw new BadRequestException("daysOfWeek must contain values between 1 (Mon) and 7 (Sun)");
        }
      }
    }

    // Validate time range
    if (dto.startTime && dto.endTime) {
      const start = this.parseTime(dto.startTime);
      const end = this.parseTime(dto.endTime);
      if (start >= end) {
        throw new BadRequestException("startTime must be before endTime");
      }
    }

    // Validate slot duration
    if (dto.slotDurationMinutes !== undefined && dto.slotDurationMinutes <= 0) {
      throw new BadRequestException("slotDurationMinutes must be greater than 0");
    }

    // Validate capacity
    if (dto.capacity !== undefined && dto.capacity < 1) {
      throw new BadRequestException("capacity must be at least 1");
    }

    // Validate exceptions
    if (dto.exceptions) {
      for (const exception of dto.exceptions) {
        const start = new Date(exception.startDate);
        const end = new Date(exception.endDate);
        if (start > end) {
          throw new BadRequestException("Exception startDate must be before or equal to endDate");
        }
      }
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + (seconds || 0);
  }

  async createTemplate(userId: string, businessId: string, dto: CreateTemplateDto) {
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

    // Validate input
    this.validateTemplate(dto);

    // Create template with exceptions
    const template = await this.prisma.availabilityTemplate.create({
      data: {
        businessId,
        name: dto.name,
        daysOfWeek: dto.daysOfWeek,
        startTime: new Date(`1970-01-01T${dto.startTime}`),
        endTime: new Date(`1970-01-01T${dto.endTime}`),
        slotDurationMinutes: dto.slotDurationMinutes,
        capacity: dto.capacity,
        imageUrl: dto.imageUrl ?? null,
        status: "active",
        exceptions: dto.exceptions
          ? {
              create: dto.exceptions.map((ex) => ({
                startDate: new Date(ex.startDate),
                endDate: new Date(ex.endDate),
                reason: ex.reason ?? null,
              })),
            }
          : undefined,
      },
      include: {
        exceptions: true,
      },
    });

    return template;
  }

  async getTemplate(templateId: string, userId: string) {
    const template = await this.prisma.availabilityTemplate.findUnique({
      where: { id: templateId },
      include: {
        exceptions: true,
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    if (template.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this template");
    }

    return template;
  }

  async listTemplates(userId: string, businessId: string) {
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

    const templates = await this.prisma.availabilityTemplate.findMany({
      where: { businessId },
      include: {
        exceptions: true,
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return templates;
  }

  async updateTemplate(templateId: string, userId: string, dto: UpdateTemplateDto) {
    // Fetch template with business
    const existing = await this.prisma.availabilityTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Template not found");
    }

    if (existing.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this template");
    }

    // Validate input
    this.validateTemplate(dto);

    // Update template
    const updated = await this.prisma.availabilityTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        daysOfWeek: dto.daysOfWeek,
        startTime: dto.startTime ? new Date(`1970-01-01T${dto.startTime}`) : undefined,
        endTime: dto.endTime ? new Date(`1970-01-01T${dto.endTime}`) : undefined,
        slotDurationMinutes: dto.slotDurationMinutes,
        capacity: dto.capacity,
        imageUrl: dto.imageUrl,
        exceptions: dto.exceptions
          ? {
              deleteMany: {},
              create: dto.exceptions.map((ex) => ({
                startDate: new Date(ex.startDate),
                endDate: new Date(ex.endDate),
                reason: ex.reason ?? null,
              })),
            }
          : undefined,
      },
      include: {
        exceptions: true,
      },
    });

    return updated;
  }

  async deactivateTemplate(templateId: string, userId: string) {
    // Fetch template with business
    const existing = await this.prisma.availabilityTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Template not found");
    }

    if (existing.business.ownerUserId !== userId) {
      throw new ForbiddenException("You do not own this template");
    }

    // Check for published activities and return details
    const linkedPublishedActivities = await this.prisma.activity.findMany({
      where: {
        availabilityTemplateId: templateId,
        status: "published",
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (linkedPublishedActivities.length > 0) {
      throw new ConflictErrorResponse(
        ErrorCodes.CANNOT_DEACTIVATE_LINKED_PUBLISHED,
        `Cannot deactivate template linked to ${linkedPublishedActivities.length} published activity(ies). Deactivate or unlink those activities first.`,
        { linkedActivities: linkedPublishedActivities }
      );
    }

    // Deactivate template
    const updated = await this.prisma.availabilityTemplate.update({
      where: { id: templateId },
      data: { status: "inactive" },
      include: {
        exceptions: true,
      },
    });

    return updated;
  }

  // Internal helper method (no RBAC) - used by activity service
  async getTemplateById(templateId: string) {
    return this.prisma.availabilityTemplate.findUnique({
      where: { id: templateId },
      include: {
        exceptions: true,
      },
    });
  }
}
