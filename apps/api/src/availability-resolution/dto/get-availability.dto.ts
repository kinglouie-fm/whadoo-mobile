import { IsUUID, IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class GetAvailabilityDto {
  @IsUUID()
  activityId: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt()
  @Min(1)
  partySize?: number;
}
