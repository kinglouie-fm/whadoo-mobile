import { IsIn, IsOptional, IsString } from "class-validator";

export class RecordSwipeDto {
  @IsString()
  @IsIn(["left", "right", "up", "down"])
  direction!: string;

  @IsOptional()
  @IsString()
  catalogGroupId?: string;

  @IsOptional()
  @IsString()
  activityId?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  typeId?: string;
}
