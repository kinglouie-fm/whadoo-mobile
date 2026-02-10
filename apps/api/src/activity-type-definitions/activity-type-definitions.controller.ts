import { Controller, Get, Param } from "@nestjs/common";
import { ActivityTypeDefinitionsService } from "./activity-type-definitions.service";

@Controller("activity-type-definitions")
export class ActivityTypeDefinitionsController {
  constructor(
    private readonly activityTypeDefinitionsService: ActivityTypeDefinitionsService,
  ) {}

  @Get()
  async list() {
    const typeDefinitions = await this.activityTypeDefinitionsService.listTypeDefinitions();
    return { typeDefinitions };
  }

  @Get(":typeId")
  async get(@Param("typeId") typeId: string) {
    const typeDefinition = await this.activityTypeDefinitionsService.getTypeDefinition(typeId);
    return { typeDefinition };
  }
}
