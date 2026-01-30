import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ActivityOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.appUser?.id;
    const activityId = request.params.id;

    if (!userId) {
      throw new ForbiddenException("User not authenticated");
    }

    if (!activityId) {
      throw new ForbiddenException("Activity ID not provided");
    }

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

    return true;
  }
}
