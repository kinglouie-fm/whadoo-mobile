import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "textarea";
  required: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  pattern?: string;
  help?: string;
}

interface Schema {
  fields: FieldDefinition[];
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

@Injectable()
export class ActivityTypeDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTypeDefinition(typeId: string, schemaVersion?: number) {
    const version = schemaVersion || 1;
    const typeDef = await this.prisma.activityTypeDefinition.findUnique({
      where: {
        typeId_schemaVersion: {
          typeId,
          schemaVersion: version,
        },
      },
    });

    if (!typeDef) {
      throw new NotFoundException(`Type definition '${typeId}' not found`);
    }

    return typeDef;
  }

  async listTypeDefinitions() {
    // Return all type definitions (for now, only v1)
    const typeDefs = await this.prisma.activityTypeDefinition.findMany({
      where: {
        schemaVersion: 1,
      },
      orderBy: {
        typeId: "asc",
      },
    });

    return typeDefs;
  }

  async validateActivityConfig(
    typeId: string,
    config: any,
    schemaVersion?: number,
  ): Promise<ValidationResult> {
    const typeDef = await this.getTypeDefinition(typeId, schemaVersion);
    const configSchema = typeDef.configSchema as unknown as Schema;

    return this.validateAgainstSchema(config, configSchema.fields, "config");
  }

  async validateActivityPricing(
    typeId: string,
    pricing: any,
    schemaVersion?: number,
  ): Promise<ValidationResult> {
    const typeDef = await this.getTypeDefinition(typeId, schemaVersion);
    const pricingSchema = typeDef.pricingSchema as unknown as Schema;

    return this.validateAgainstSchema(pricing, pricingSchema.fields, "pricing");
  }

  private validateAgainstSchema(
    data: any,
    fields: FieldDefinition[],
    context: string,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const field of fields) {
      const value = data?.[field.name];

      // Required field check
      if (field.required && (value === undefined || value === null || value === "")) {
        errors.push({
          field: `${context}.${field.name}`,
          message: `${field.label} is required`,
        });
        continue;
      }

      // Skip further validation if field is optional and not provided
      if (!field.required && (value === undefined || value === null || value === "")) {
        continue;
      }

      // Type-specific validation
      switch (field.type) {
        case "number":
          if (typeof value !== "number" || isNaN(value)) {
            errors.push({
              field: `${context}.${field.name}`,
              message: `${field.label} must be a valid number`,
            });
          } else {
            if (field.min !== undefined && value < field.min) {
              errors.push({
                field: `${context}.${field.name}`,
                message: `${field.label} must be at least ${field.min}`,
              });
            }
            if (field.max !== undefined && value > field.max) {
              errors.push({
                field: `${context}.${field.name}`,
                message: `${field.label} must be at most ${field.max}`,
              });
            }
          }
          break;

        case "text":
        case "textarea":
          if (typeof value !== "string") {
            errors.push({
              field: `${context}.${field.name}`,
              message: `${field.label} must be a string`,
            });
          } else if (field.pattern) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
              errors.push({
                field: `${context}.${field.name}`,
                message: `${field.label} format is invalid`,
              });
            }
          }
          break;

        case "select":
          if (field.options && field.options.length > 0) {
            const validValues = field.options.map((opt) => opt.value);
            if (!validValues.includes(value)) {
              errors.push({
                field: `${context}.${field.name}`,
                message: `${field.label} must be one of: ${validValues.join(", ")}`,
              });
            }
          }
          break;

        case "checkbox":
          if (typeof value !== "boolean") {
            errors.push({
              field: `${context}.${field.name}`,
              message: `${field.label} must be a boolean`,
            });
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
