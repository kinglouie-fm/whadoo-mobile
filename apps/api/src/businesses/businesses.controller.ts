import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AppUserGuard } from "../auth/app-user.guard";
import { AuthService } from "../auth/auth.service";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { BusinessesService } from "./businesses.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";

/**
 * Business profile endpoints for authenticated users.
 */
@UseGuards(FirebaseAuthGuard, AppUserGuard, RolesGuard)
@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly authService: AuthService
  ) {}

  /**
   * Resolves or creates the app user backing the current Firebase identity.
   */
  private async currentDbUser(req: AuthedRequest) {
    const fb = req.firebase!;
    return this.authService.getOrCreateUser(fb.uid, fb.email ?? undefined, fb.picture ?? undefined);
  }

  /**
   * Returns the caller's business, if present.
   */
  @Get("my")
  async my(@Req() req: AuthedRequest) {
    const user = await this.currentDbUser(req);
    const business = await this.businessesService.getMyBusiness(user.id);
    return { business };
  }

  /**
   * Creates the caller's business if missing, otherwise returns existing business.
   */
  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateBusinessDto) {
    const user = await this.currentDbUser(req);
    const business = await this.businessesService.createMyBusiness(user.id, dto);
    return { business };
  }

  /**
   * Updates the caller's own business profile.
   */
  @Patch("me")
  async updateMy(@Req() req: AuthedRequest, @Body() dto: UpdateBusinessDto) {
    const user = await this.currentDbUser(req);
    const business = await this.businessesService.updateMyBusiness(user.id, dto);
    return { business };
  }

  /**
   * Updates a business by id after ownership checks in the service layer.
   */
  @Patch(":id")
  async update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() dto: UpdateBusinessDto) {
    const user = await this.currentDbUser(req);
    const business = await this.businessesService.updateBusiness(user.id, id, dto);
    return { business };
  }
}
