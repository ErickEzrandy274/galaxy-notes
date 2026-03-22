import { IsOptional, IsIn, IsEnum } from 'class-validator';
import { AutoDeleteBehavior } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn([7, 14, 30])
  trashRetentionDays?: number;

  @IsOptional()
  @IsEnum(AutoDeleteBehavior)
  autoDeleteBehavior?: AutoDeleteBehavior;
}
