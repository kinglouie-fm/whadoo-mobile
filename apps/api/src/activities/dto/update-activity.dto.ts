import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { CreateActivityImageDto } from "./create-activity.dto";

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  typeId?: string;

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
  availabilityTemplateId?: string;

  @IsOptional()
  images?: CreateActivityImageDto[];
}
