import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthedRequest } from "./firebase-auth.guard";

/**
 * Authorizes requests to business routes scoped by `:id` ownership.
 */
@Injectable()
export class BusinessOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the authenticated app user owns the targeted business id.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const appUser = req.appUser;

    if (!appUser) throw new ForbiddenException("Missing app user");

    // Guard is designed for routes that expose business id as `:id`.
    const businessId = req.params?.id;
    if (!businessId) throw new BadRequestException("Missing business id");

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerUserId: true },
    });

    if (!business) throw new NotFoundException("Business not found");
    if (business.ownerUserId !== appUser.id) throw new ForbiddenException("Not business owner");

    return true;
  }
}
