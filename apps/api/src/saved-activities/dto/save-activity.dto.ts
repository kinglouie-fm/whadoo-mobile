import { IsUUID } from 'class-validator';

export class SaveActivityDto {
  @IsUUID()
  activityId: string;
}
