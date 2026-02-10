import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateActivityImageDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsOptional()
  isThumbnail?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateActivityDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  typeId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  priceFrom?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  pricing?: Record<string, any>;

  @IsOptional()
  @IsString()
  catalogGroupId?: string;

  @IsOptional()
  @IsString()
  catalogGroupTitle?: string;

  @IsOptional()
  @IsString()
  catalogGroupKind?: string;

  @IsOptional()
  @IsString()
  availabilityTemplateId?: string;

  @IsOptional()
  images?: CreateActivityImageDto[];
}
