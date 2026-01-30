import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateExceptionDto {
  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  endDate: string; // YYYY-MM-DD

  @IsString()
  reason?: string;
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  daysOfWeek: number[]; // 1-7 (Mon-Sun)

  @IsNotEmpty()
  @IsString()
  startTime: string; // HH:mm:ss format

  @IsNotEmpty()
  @IsString()
  endTime: string; // HH:mm:ss format

  @IsInt()
  @Min(1)
  slotDurationMinutes: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  imageUrl?: string;

  @IsArray()
  exceptions?: CreateExceptionDto[];
}
