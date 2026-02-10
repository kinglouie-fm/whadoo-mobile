import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import { AppUserGuard } from "../auth/app-user.guard";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { AvailabilityTemplatesService } from "./availability-templates.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";

@Controller("availability-templates")
@UseGuards(FirebaseAuthGuard, AppUserGuard)
export class AvailabilityTemplatesController {
  constructor(private readonly service: AvailabilityTemplatesService) {}

  @Post()
  async createTemplate(
    @Req() req: AuthedRequest,
    @Body() dto: CreateTemplateDto & { businessId: string }
  ) {
    const userId = req.appUser!.id;
    const { businessId, ...templateData } = dto;
    return this.service.createTemplate(userId, businessId, templateData);
  }

  @Get("business/:businessId")
  async listTemplates(
    @Req() req: AuthedRequest,
    @Param("businessId") businessId: string
  ) {
    const userId = req.appUser!.id;
    return this.service.listTemplates(userId, businessId);
  }

  @Get(":id")
  async getTemplate(
    @Req() req: AuthedRequest,
    @Param("id") id: string
  ) {
    const userId = req.appUser!.id;
    return this.service.getTemplate(id, userId);
  }

  @Put(":id")
  async updateTemplate(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateTemplateDto
  ) {
    const userId = req.appUser!.id;
    return this.service.updateTemplate(id, userId, dto);
  }

  @Patch(":id/deactivate")
  async deactivateTemplate(
    @Req() req: AuthedRequest,
    @Param("id") id: string
  ) {
    const userId = req.appUser!.id;
    return this.service.deactivateTemplate(id, userId);
  }
}
