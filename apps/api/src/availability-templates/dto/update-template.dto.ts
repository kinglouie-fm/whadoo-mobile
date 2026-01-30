import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";
import { CreateExceptionDto } from "./create-template.dto";

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  daysOfWeek?: number[];

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  exceptions?: CreateExceptionDto[];
}
