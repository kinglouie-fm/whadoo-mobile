import { Controller, Get, Param } from "@nestjs/common";
import { ActivityTypeDefinitionsService } from "./activity-type-definitions.service";

/**
 * Read endpoints for activity type schemas used by activity forms and validation.
 */
@Controller("activity-type-definitions")
export class ActivityTypeDefinitionsController {
  constructor(
    private readonly activityTypeDefinitionsService: ActivityTypeDefinitionsService,
  ) {}

  /**
   * Returns all currently supported type definitions.
   */
  @Get()
  async list() {
    const typeDefinitions = await this.activityTypeDefinitionsService.listTypeDefinitions();
    return { typeDefinitions };
  }

  /**
   * Returns a single type definition by id.
   */
  @Get(":typeId")
  async get(@Param("typeId") typeId: string) {
    const typeDefinition = await this.activityTypeDefinitionsService.getTypeDefinition(typeId);
    return { typeDefinition };
  }
}
