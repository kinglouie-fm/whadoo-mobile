import { IsUUID, IsDateString, IsInt, Min, IsObject, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  activityId: string;

  @IsDateString()
  slotStart: string; // ISO 8601 timestamp

  @IsInt()
  @Min(1)
  participantsCount: number;

  @IsObject()
  @IsNotEmpty()
  selectionData: any; // Type-specific booking selection data
}
