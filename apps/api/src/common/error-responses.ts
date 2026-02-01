import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

export interface ErrorResponse {
  code: string;
  message: string;
  field?: string;
  missingFields?: string[];
  linkedActivities?: Array<{ id: string; title: string }>;
}

export class ValidationErrorResponse extends BadRequestException {
  constructor(code: string, message: string, field?: string) {
    super({
      code,
      message,
      field,
    });
  }
}

export class PublishValidationError extends BadRequestException {
  constructor(
    code: string,
    message: string,
    field?: string,
    missingFields?: string[],
  ) {
    super({
      code,
      message,
      field,
      missingFields,
    });
  }
}

export class ConflictErrorResponse extends ConflictException {
  constructor(code: string, message: string, data?: any) {
    super({
      code,
      message,
      ...data,
    });
  }
}

export class AuthErrorResponse extends ForbiddenException {
  constructor(code: string, message: string) {
    super({
      code,
      message,
    });
  }
}

export class NotFoundErrorResponse extends NotFoundException {
  constructor(code: string, message: string) {
    super({
      code,
      message,
    });
  }
}

// Error codes
export const ErrorCodes = {
  // Template errors
  TEMPLATE_REQUIRED: "TEMPLATE_REQUIRED",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  TEMPLATE_INACTIVE: "TEMPLATE_INACTIVE",
  
  // Activity errors
  REQUIRED_FIELDS_MISSING: "REQUIRED_FIELDS_MISSING",
  INVALID_TYPE: "INVALID_TYPE",
  CANNOT_UNLINK_PUBLISHED: "CANNOT_UNLINK_PUBLISHED",
  CANNOT_CHANGE_TYPE_PUBLISHED: "CANNOT_CHANGE_TYPE_PUBLISHED",
  
  // Package errors (karting)
  PACKAGES_REQUIRED: "PACKAGES_REQUIRED",
  PACKAGE_CODE_REQUIRED: "PACKAGE_CODE_REQUIRED",
  PACKAGE_TITLE_REQUIRED: "PACKAGE_TITLE_REQUIRED",
  PACKAGE_CODE_DUPLICATE: "PACKAGE_CODE_DUPLICATE",
  MULTIPLE_DEFAULT_PACKAGES: "MULTIPLE_DEFAULT_PACKAGES",
  
  // Template deactivation
  CANNOT_DEACTIVATE_LINKED_PUBLISHED: "CANNOT_DEACTIVATE_LINKED_PUBLISHED",
  
  // Auth errors
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
} as const;
